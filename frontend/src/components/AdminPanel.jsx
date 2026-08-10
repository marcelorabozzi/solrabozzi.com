import React, { useState, useEffect } from 'react';

export default function AdminPanel() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Datos del Dashboard
  const [rsvps, setRsvps] = useState([]);
  const [stats, setStats] = useState({
    totalInvitaciones: 0,
    personasTotales: 0,
    pagosVerificados: 0,
    pagosPendientes: 0,
    pagosAVerificar: 0,
    recaudacion: 0,
    importePendiente: 0
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRsvp, setSelectedRsvp] = useState(null); // Para ver detalles y asistentes
  
  // Estado para visor de comprobante
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [comprobanteLoading, setComprobanteLoading] = useState(false);
  const [isViewingComprobante, setIsViewingComprobante] = useState(false);
  const [activeReceiptFilename, setActiveReceiptFilename] = useState('');
  const [activeReceiptMimetype, setActiveReceiptMimetype] = useState('');

  // Cargar datos si hay token
  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Obtener stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.status === 401 || statsRes.status === 403) {
        handleLogout();
        return;
      }
      
      let statsData = null;
      const statsContentType = statsRes.headers.get('content-type');
      if (statsContentType && statsContentType.includes('application/json')) {
        statsData = await statsRes.json();
      }

      if (!statsRes.ok) {
        throw new Error(statsData?.error || `Error al obtener estadísticas (Código ${statsRes.status})`);
      }
      if (statsData) {
        setStats(statsData);
      }

      // Obtener RSVPs
      const rsvpsRes = await fetch('/api/admin/rsvps', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let rsvpsData = null;
      const rsvpsContentType = rsvpsRes.headers.get('content-type');
      if (rsvpsContentType && rsvpsContentType.includes('application/json')) {
        rsvpsData = await rsvpsRes.json();
      }

      if (!rsvpsRes.ok) {
        throw new Error(rsvpsData?.error || `Error al obtener confirmaciones (Código ${rsvpsRes.status})`);
      }
      if (rsvpsData) {
        setRsvps(rsvpsData);
      }
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      let data = null;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok) {
        throw new Error(data?.error || `Error de inicio de sesión (Código ${res.status}).`);
      }

      if (!data || !data.token) {
        throw new Error('Respuesta inválida del servidor.');
      }

      localStorage.setItem('adminToken', data.token);
      setToken(data.token);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
    setRsvps([]);
    setSelectedRsvp(null);
    setIsViewingComprobante(false);
  };

  // Verificar pago de una invitación (RF-046)
  const handleVerifyPayment = async (rsvpId, newPaymentState) => {
    try {
      const res = await fetch(`/api/admin/rsvps/${rsvpId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado_pago: newPaymentState })
      });

      if (!res.ok) {
        throw new Error('Error al actualizar el estado de pago.');
      }

      // Recargar datos
      await fetchDashboardData();
      
      // Actualizar detalle abierto
      if (selectedRsvp && selectedRsvp.id === rsvpId) {
        const updatedInvite = rsvps.find(r => r.id === rsvpId);
        if (updatedInvite) {
          setSelectedRsvp({
            ...updatedInvite,
            estado_pago: newPaymentState
          });
        }
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Ver comprobante de pago de forma segura (RNF-005)
  const viewReceipt = async (filename, mimetype) => {
    if (!filename) return;
    setComprobanteLoading(true);
    setIsViewingComprobante(true);
    setActiveReceiptFilename(filename);
    setActiveReceiptMimetype(mimetype);
    setComprobanteUrl('');

    try {
      const res = await fetch(`/api/admin/comprobantes/${filename}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Error al cargar archivo del servidor.');
      }
      const blob = await res.blob();
      const localUrl = URL.createObjectURL(blob);
      setComprobanteUrl(localUrl);
    } catch (err) {
      alert('Error cargando comprobante: ' + err.message);
      setIsViewingComprobante(false);
    } finally {
      setComprobanteLoading(false);
    }
  };

  // Descargar exportación CSV (RF-057)
  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/admin/rsvps/export/csv', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('No se pudo generar la exportación.');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'asistentes_sol_rabozzi.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filtrado y búsqueda de invitaciones
  const filteredRsvps = rsvps.filter(rsvp => {
    const fullName = `${rsvp.nombre} ${rsvp.apellido}`.toLowerCase();
    const queryMatch = fullName.includes(searchQuery.toLowerCase()) || 
                       rsvp.telefono.includes(searchQuery) ||
                       (rsvp.dni && rsvp.dni.includes(searchQuery));
    
    if (paymentFilter === 'all') return queryMatch;
    return queryMatch && rsvp.estado_pago === paymentFilter;
  });

  // Vista de Login
  if (!token) {
    return (
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-dark-primary)',
        padding: '1.5rem'
      }}>
        <div className="panel-glass" style={{ maxWidth: '420px', width: '100%' }}>
          <h2 style={{ fontSize: '2.2rem', color: 'var(--rose-gold)', textAlign: 'center', marginBottom: '1.5rem' }}>Panel Administrativo</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Usuario</label>
              <input 
                type="text" 
                required 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="form-input" 
                placeholder="Ingresa tu usuario" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="form-input" 
                placeholder="Ingresa tu contraseña" 
              />
            </div>
            
            {loginError && (
              <div style={{
                color: '#fca5a5',
                fontSize: '0.85rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.8rem',
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                ⚠️ {loginError}
              </div>
            )}

            <button type="submit" className="btn-premium btn-primary" style={{ width: '100%', height: '48px' }}>
              Ingresar al Panel
            </button>
          </form>
        </div>
      </section>
    );
  }

  // Panel Principal
  return (
    <section style={{ minHeight: '100vh', background: 'var(--bg-dark-primary)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Cabecera del Panel */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', color: 'var(--rose-gold)' }}>Gestión de Asistencia</h1>
            <p style={{ color: 'var(--text-muted)' }}>Mis 15 – Sol Rabozzi</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleExportCSV} className="btn-premium btn-gold" style={{ fontSize: '0.85rem', padding: '0.6rem 1.5rem' }}>
              📥 Exportar Lista (CSV)
            </button>
            <button onClick={handleLogout} className="btn-premium btn-secondary" style={{ fontSize: '0.85rem', padding: '0.6rem 1.5rem' }}>
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Tarjetas de Indicadores Generales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          <div className="admin-card-metric">
            <div className="metric-label">Invitaciones</div>
            <div className="metric-value">{stats.totalInvitaciones}</div>
          </div>
          <div className="admin-card-metric">
            <div className="metric-label">Asistentes Totales</div>
            <div className="metric-value">{stats.personasTotales}</div>
          </div>
          <div className="admin-card-metric">
            <div className="metric-label">Pagos Verificados</div>
            <div className="metric-value" style={{ color: '#a3e635' }}>{stats.pagosVerificados}</div>
          </div>
          <div className="admin-card-metric">
            <div className="metric-label">Pagos a Verificar</div>
            <div className="metric-value" style={{ color: '#93c5fd' }}>{stats.pagosAVerificar}</div>
          </div>
          <div className="admin-card-metric">
            <div className="metric-label">Recaudado</div>
            <div className="metric-value" style={{ color: '#fbbf24' }}>${stats.recaudacion.toLocaleString('es-AR')}</div>
          </div>
          <div className="admin-card-metric">
            <div className="metric-label">Monto Pendiente</div>
            <div className="metric-value" style={{ color: '#fca5a5' }}>${stats.importePendiente.toLocaleString('es-AR')}</div>
          </div>
        </div>

        {/* Filtros de Tabla y Buscador */}
        <div className="panel-glass" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label className="form-label">Buscar Invitado Responsable</label>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="form-input" 
              placeholder="Buscar por nombre, apellido o teléfono..." 
            />
          </div>
          
          <div style={{ width: '220px' }}>
            <label className="form-label">Filtrar por Estado de Pago</label>
            <select 
              value={paymentFilter} 
              onChange={(e) => setPaymentFilter(e.target.value)} 
              className="form-input form-select"
            >
              <option value="all" style={{ backgroundColor: 'var(--bg-dark-tertiary)' }}>Todos</option>
              <option value="verificado" style={{ backgroundColor: 'var(--bg-dark-tertiary)' }}>Verificados</option>
              <option value="a_verificar" style={{ backgroundColor: 'var(--bg-dark-tertiary)' }}>A Verificar</option>
              <option value="pendiente" style={{ backgroundColor: 'var(--bg-dark-tertiary)' }}>Pendientes</option>
            </select>
          </div>
          
          <div style={{ alignSelf: 'flex-end' }}>
            <button onClick={fetchDashboardData} className="btn-premium btn-secondary" style={{ padding: '0.8rem 1.5rem' }}>
              🔄 Refrescar
            </button>
          </div>
        </div>

        {/* Listado de Confirmaciones */}
        <div className="panel-glass" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--rose-gold-light)', marginBottom: '1rem' }}>Confirmaciones Registradas</h2>
          
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando datos...</div>
          ) : filteredRsvps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No se encontraron confirmaciones registradas.</div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>DNI</th>
                    <th>Responsable</th>
                    <th>Teléfono</th>
                    <th>Asistentes</th>
                    <th>Importe</th>
                    <th>Modo Pago</th>
                    <th>Estado Pago</th>
                    <th>Comprobante</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRsvps.map((rsvp) => (
                    <tr key={rsvp.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedRsvp(rsvp)}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{rsvp.dni || '-'}</td>
                      <td><strong>{rsvp.nombre} {rsvp.apellido}</strong></td>
                      <td>
                        <a 
                          href={`https://wa.me/${rsvp.telefono.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: 'var(--rose-gold)', textDecoration: 'none' }}
                          onClick={(e) => e.stopPropagation()} // Evitar abrir detalles al clickear el link
                        >
                          💬 {rsvp.telefono}
                        </a>
                      </td>
                      <td>{rsvp.cantidad_personas}</td>
                      <td>${rsvp.importe_total.toLocaleString('es-AR')}</td>
                      <td>{rsvp.modalidad_pago === 'ahora' ? 'Transferencia' : 'Pagar Después'}</td>
                      <td>
                        {rsvp.estado_pago === 'verificado' && <span className="badge badge-success">Verificado</span>}
                        {rsvp.estado_pago === 'a_verificar' && <span className="badge badge-info">A Verificar</span>}
                        {rsvp.estado_pago === 'pendiente' && <span className="badge badge-warning">Pendiente</span>}
                      </td>
                      <td>
                        {rsvp.comprobante && rsvp.comprobante.archivo ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              viewReceipt(rsvp.comprobante.archivo, rsvp.comprobante.tipo_archivo);
                            }}
                            className="btn-premium btn-secondary"
                            style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem', letterSpacing: '0.5px' }}
                          >
                            👁 Ver Archivo
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin archivo</span>
                        )}
                      </td>
                      <td>
                        {rsvp.estado_pago !== 'verificado' ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifyPayment(rsvp.id, 'verificado');
                            }}
                            className="btn-premium btn-primary"
                            style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem', letterSpacing: '0.5px' }}
                          >
                            Verificar Pago
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifyPayment(rsvp.id, 'pendiente');
                            }}
                            className="btn-premium btn-secondary"
                            style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem', letterSpacing: '0.5px', color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                          >
                            Desmarcar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de Detalles de Invitación */}
        {selectedRsvp && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
          }} onClick={() => setSelectedRsvp(null)}>
            <div className="panel-glass animated-fade-in" style={{
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid var(--rose-gold)',
              boxShadow: '0 0 30px rgba(226,165,165,0.2)'
            }} onClick={(e) => e.stopPropagation()}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.8rem', color: 'var(--rose-gold)' }}>Detalle de Confirmación</h3>
                <button 
                  onClick={() => setSelectedRsvp(null)} 
                  style={{ background: 'none', border: 'none', color: 'var(--rose-gold-light)', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>DNI</span>
                  <strong>{selectedRsvp.dni || '-'}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Responsable</span>
                  <strong>{selectedRsvp.nombre} {selectedRsvp.apellido}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Teléfono</span>
                  <strong>{selectedRsvp.telefono}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Email</span>
                  <strong>{selectedRsvp.email || '-'}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Forma de Pago</span>
                  <strong>{selectedRsvp.modalidad_pago === 'ahora' ? 'Transferencia Bancaria' : 'Pagar Después'}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Importe Tarjeta</span>
                  <strong style={{ color: 'var(--gold)' }}>${selectedRsvp.importe_total.toLocaleString('es-AR')}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Estado Pago</span>
                  <div>
                    {selectedRsvp.estado_pago === 'verificado' && <span className="badge badge-success">Verificado</span>}
                    {selectedRsvp.estado_pago === 'a_verificar' && <span className="badge badge-info">A Verificar</span>}
                    {selectedRsvp.estado_pago === 'pendiente' && <span className="badge badge-warning">Pendiente</span>}
                  </div>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Fecha Registro</span>
                  <strong>{new Date(selectedRsvp.fecha_confirmacion).toLocaleString('es-AR')}</strong>
                </div>
              </div>

              {selectedRsvp.observaciones && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(20,8,22,0.4)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Observaciones / Comentarios</span>
                  <p style={{ fontSize: '0.9rem' }}>{selectedRsvp.observaciones}</p>
                </div>
              )}

              {/* Lista detallada de asistentes individuales */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ color: 'var(--rose-gold-light)', borderBottom: '1px solid rgba(226,165,165,0.1)', paddingBottom: '0.3rem', marginBottom: '1rem' }}>Asistentes Individuales</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedRsvp.asistentes && selectedRsvp.asistentes.map((asis, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(10,4,11,0.5)',
                      padding: '0.8rem 1rem',
                      borderRadius: '8px',
                      borderLeft: '3px solid var(--rose-gold)'
                    }}>
                      <div>
                        <strong>{asis.nombre} {asis.apellido}</strong>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Categoría: {asis.tipo_asistente === 'adulto' ? 'Mayor' : 'Menor de 12'}
                          {asis.email && ` • Email: ${asis.email}`}
                        </span>
                      </div>
                      <div>
                        {asis.restriccion_alimentaria !== 'ninguna' ? (
                          <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                            ⚠️ Restricción: {asis.restriccion_alimentaria === 'alergias' ? (asis.restriccion_alimentaria_detalle || 'Alergia') : asis.restriccion_alimentaria}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sin restricciones</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones del Modal */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                {selectedRsvp.comprobante && selectedRsvp.comprobante.archivo && (
                  <button 
                    onClick={() => viewReceipt(selectedRsvp.comprobante.archivo, selectedRsvp.comprobante.tipo_archivo)} 
                    className="btn-premium btn-secondary" 
                    style={{ fontSize: '0.85rem' }}
                  >
                    👁 Ver Comprobante
                  </button>
                )}
                
                {selectedRsvp.estado_pago !== 'verificado' ? (
                  <button 
                    onClick={() => handleVerifyPayment(selectedRsvp.id, 'verificado')} 
                    className="btn-premium btn-primary"
                    style={{ fontSize: '0.85rem' }}
                  >
                    Verificar Pago
                  </button>
                ) : (
                  <button 
                    onClick={() => handleVerifyPayment(selectedRsvp.id, 'pendiente')} 
                    className="btn-premium btn-secondary"
                    style={{ fontSize: '0.85rem', color: '#fca5a5' }}
                  >
                    Marcar como Pendiente
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Lightbox seguro para ver el comprobante (RNF-005) */}
        {isViewingComprobante && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '2rem'
          }} onClick={() => setIsViewingComprobante(false)}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '800px', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--rose-gold-light)' }}>
                {activeReceiptFilename}
              </span>
              <button 
                onClick={() => setIsViewingComprobante(false)} 
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.8rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{
              maxWidth: '800px',
              maxHeight: '80vh',
              width: '100%',
              backgroundColor: '#222',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 40px rgba(0,0,0,0.8)',
              padding: '1rem'
            }} onClick={(e) => e.stopPropagation()}>
              
              {comprobanteLoading ? (
                <div style={{ padding: '3rem', color: '#fff' }}>Cargando comprobante de forma segura...</div>
              ) : activeReceiptMimetype === 'application/pdf' ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                  <p style={{ color: '#fff', marginBottom: '1.5rem' }}>El comprobante es un archivo PDF.</p>
                  <a 
                    href={comprobanteUrl} 
                    download={`comprobante_${activeReceiptFilename}`}
                    className="btn-premium btn-primary"
                    style={{ textDecoration: 'none' }}
                  >
                    📥 Descargar PDF para visualizar
                  </a>
                </div>
              ) : comprobanteUrl ? (
                <img 
                  src={comprobanteUrl} 
                  alt="Comprobante de Pago" 
                  style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }} 
                />
              ) : (
                <div style={{ padding: '3rem', color: '#fca5a5' }}>Error al obtener el archivo.</div>
              )}
            </div>

          </div>
        )}

      </div>
    </section>
  );
}
