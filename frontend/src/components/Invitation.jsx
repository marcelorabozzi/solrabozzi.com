import React, { useState, useEffect, useRef } from 'react';
import solPortrait from '../assets/sol_portrait.png';

export default function Invitation() {
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    cantidad_personas: 1,
    modalidad_pago: 'ahora',
    observaciones: '',
  });

  const [asistentes, setAsistentes] = useState([
    { nombre: '', apellido: '', email: '', tipo_asistente: 'adulto', restriccion_alimentaria: 'ninguna', restriccion_alimentaria_detalle: '' }
  ]);

  const [isExistingRegistration, setIsExistingRegistration] = useState(false);
  const [hasExistingComprobante, setHasExistingComprobante] = useState(false);
  const [isVerifyingDni, setIsVerifyingDni] = useState(false);
  const [dniVerificationMessage, setDniVerificationMessage] = useState('');

  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [comprobantePreview, setComprobantePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [successResponse, setSuccessResponse] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Cuenta regresiva
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const eventDate = new Date('2027-01-23T21:30:00').getTime();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = eventDate - now;

      if (difference <= 0) {
        clearInterval(timer);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Precios
  const PRECIO_ADULTO = 50000;
  const PRECIO_MENOR = 25000;

  // Calcular precio total
  const calculateTotal = () => {
    return asistentes.reduce((total, asis) => {
      return total + (asis.tipo_asistente === 'menor' ? PRECIO_MENOR : PRECIO_ADULTO);
    }, 0);
  };

  // Manejar cambios en campos generales del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      
      // Sincronizar el primer asistente con los datos del responsable
      if (name === 'nombre' || name === 'apellido' || name === 'email') {
        setAsistentes(prevAsis => {
          const copy = [...prevAsis];
          if (copy[0]) {
            copy[0] = {
              ...copy[0],
              [name]: value
            };
          }
          return copy;
        });
      }
      
      return updated;
    });

    if (name === 'cantidad_personas') {
      const count = parseInt(value, 10) || 1;
      adjustAsistentesCount(count);
    }
  };

  // Ajustar la cantidad de asistentes
  const adjustAsistentesCount = (count) => {
    setAsistentes(prev => {
      let copy = [...prev];
      const currentCount = copy.length;
      if (count > currentCount) {
        const extra = Array(count - currentCount).fill(null).map((_, i) => {
          const isFirst = (currentCount + i) === 0;
          return {
            nombre: isFirst ? formData.nombre : '',
            apellido: isFirst ? formData.apellido : '',
            email: isFirst ? formData.email : '',
            tipo_asistente: 'adulto',
            restriccion_alimentaria: 'ninguna',
            restriccion_alimentaria_detalle: ''
          };
        });
        copy = [...copy, ...extra];
      } else if (count < currentCount) {
        copy = copy.slice(0, count);
      }
      
      // Asegurar que el primer asistente siempre tenga los datos del responsable
      if (copy[0]) {
        copy[0].nombre = formData.nombre;
        copy[0].apellido = formData.apellido;
        copy[0].email = formData.email;
      }
      return copy;
    });
  };

  // Manejar cambios en la lista de asistentes
  const handleAsistenteChange = (index, field, value) => {
    setAsistentes(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value
      };
      return copy;
    });
  };

  // Verificar registro por DNI
  const handleVerifyDni = async () => {
    if (!formData.dni.trim()) {
      setDniVerificationMessage('Por favor, ingresa tu DNI.');
      return;
    }

    setIsVerifyingDni(true);
    setDniVerificationMessage('');
    
    try {
      const response = await fetch(`/api/rsvp/verify/${formData.dni.trim()}`);
      
      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        if (response.status === 404) {
          setDniVerificationMessage('No se encontró registro para este DNI. Completa los datos para registrarte por primera vez.');
          setIsExistingRegistration(false);
          setHasExistingComprobante(false);
        } else {
          throw new Error(data?.error || `Error del servidor (Código ${response.status}). Por favor, intenta de nuevo más tarde.`);
        }
      } else {
        if (!data) {
          throw new Error('Respuesta del servidor inválida (no es JSON).');
        }
        setDniVerificationMessage('¡Registro encontrado! Puedes modificar tus datos o adjuntar un nuevo comprobante.');
        
        setFormData({
          dni: data.dni || formData.dni,
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          telefono: data.telefono || '',
          email: data.email || '',
          cantidad_personas: data.cantidad_personas || 1,
          modalidad_pago: data.modalidad_pago || 'ahora',
          observaciones: data.observaciones || '',
        });

        if (data.asistentes && data.asistentes.length > 0) {
          setAsistentes(data.asistentes.map(a => ({
            id: a.id,
            nombre: a.nombre || '',
            apellido: a.apellido || '',
            email: a.email || '',
            tipo_asistente: a.tipo_asistente || 'adulto',
            restriccion_alimentaria: a.restriccion_alimentaria || 'ninguna',
            restriccion_alimentaria_detalle: a.restriccion_alimentaria_detalle || '',
            mesa: a.mesa || ''
          })));
        } else {
          adjustAsistentesCount(data.cantidad_personas || 1);
        }

        setIsExistingRegistration(true);
        if (data.comprobante && data.comprobante.archivo) {
          setHasExistingComprobante(true);
        } else {
          setHasExistingComprobante(false);
        }
      }
    } catch (err) {
      setDniVerificationMessage(`Error: ${err.message}`);
    } finally {
      setIsVerifyingDni(false);
    }
  };

  // Copiar alias al portapapeles (RF-031)
  const handleCopyAlias = () => {
    navigator.clipboard.writeText('sol.15.rabozzi');
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 3000);
  };

  // Manejar carga del archivo comprobante
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo supera el límite de 5 MB.');
        return;
      }
      setComprobanteFile(file);
      
      // Crear preview para imágenes
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setComprobantePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setComprobantePreview(null); // PDF no tiene preview directa de imagen
      }
    }
  };

  // Enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    if (!formData.dni.trim()) {
      setErrorMessage('Por favor, ingresa tu DNI.');
      setIsSubmitting(false);
      return;
    }

    // Asegurar sincronización del primer asistente (responsable)
    if (asistentes[0]) {
      asistentes[0].nombre = formData.nombre;
      asistentes[0].apellido = formData.apellido;
      asistentes[0].email = formData.email;
    }

    // Validación de correo electrónico del responsable
    if (!formData.email.trim()) {
      setErrorMessage('Por favor, ingresa tu correo electrónico.');
      setIsSubmitting(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMessage('Por favor, ingresa un correo electrónico de responsable válido.');
      setIsSubmitting(false);
      return;
    }

    // Validación básica de asistentes
    const incomplete = asistentes.some(a => !a.nombre.trim() || !a.apellido.trim());
    if (incomplete) {
      setErrorMessage('Por favor, ingresa el nombre y apellido de todos los asistentes.');
      setIsSubmitting(false);
      return;
    }

    // Validación de correos opcionales de asistentes si están cargados
    const invalidGuestEmails = asistentes.some(a => a.email && a.email.trim() && !emailRegex.test(a.email.trim()));
    if (invalidGuestEmails) {
      setErrorMessage('Por favor, ingresa correos electrónicos válidos para los asistentes.');
      setIsSubmitting(false);
      return;
    }

    if (formData.modalidad_pago === 'ahora' && !comprobanteFile && !hasExistingComprobante) {
      setErrorMessage('Por favor, adjunta el comprobante de transferencia bancaria.');
      setIsSubmitting(false);
      return;
    }

    try {
      const dataToSend = new FormData();
      dataToSend.append('dni', formData.dni);
      dataToSend.append('nombre', formData.nombre);
      dataToSend.append('apellido', formData.apellido);
      dataToSend.append('telefono', formData.telefono);
      dataToSend.append('email', formData.email);
      dataToSend.append('cantidad_personas', formData.cantidad_personas);
      dataToSend.append('modalidad_pago', formData.modalidad_pago);
      dataToSend.append('importe_total', calculateTotal());
      dataToSend.append('observaciones', formData.observaciones);
      dataToSend.append('asistentes', JSON.stringify(asistentes));
      
      if (comprobanteFile) {
        dataToSend.append('comprobante', comprobanteFile);
      }

      const response = await fetch('/api/rsvp', {
        method: 'POST',
        body: dataToSend
      });

      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data?.error || `Error del servidor (Código ${response.status}). Por favor, intenta de nuevo más tarde.`);
      }

      if (!data) {
        throw new Error('El servidor no devolvió una respuesta válida (no es JSON).');
      }

      setSuccessResponse(data);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Portada elegante y hero */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem 1rem',
        background: `linear-gradient(rgba(10, 4, 11, 0.75), rgba(10, 4, 11, 0.95)), url("/ballroom_bg.png") center/cover no-repeat fixed`,
        position: 'relative'
      }}>
        <div className="sparkles"></div>
        <div className="animated-fade-in" style={{ maxWidth: '650px', zIndex: 2 }}>
          <h2 style={{ fontSize: '1.8rem', letterSpacing: '4px', color: 'var(--rose-gold)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Mis 15 Años</h2>
          <h1 style={{ fontSize: '4.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', margin: '0 0 1.5rem 0', textShadow: '0 0 20px rgba(226,165,165,0.3)' }}>Sol Rabozzi</h1>
          
          {/* Foto principal de Sol en un círculo dorado brillante */}
          <div style={{
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            margin: '0 auto 2rem auto',
            border: '3px solid var(--rose-gold)',
            boxShadow: '0 0 30px rgba(226, 165, 165, 0.4), inset 0 0 20px rgba(0,0,0,0.8)',
            overflow: 'hidden',
            transition: 'transform 0.5s ease'
          }} className="zoom-portrait">
            <img src={solPortrait} alt="Sol Rabozzi" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <p style={{ fontStyle: 'italic', fontSize: '1.4rem', fontFamily: 'var(--font-serif)', color: 'var(--rose-gold-light)', marginBottom: '2.5rem' }}>
            "Hay momentos que son inolvidables, pero compartirlos con quienes más queremos los hace eternos. Te invito a celebrar conmigo esta noche mágica."
          </p>

          <a href="#confirmar" className="btn-premium btn-primary">Confirmar Asistencia</a>
        </div>
      </section>

      {/* Contador de cuenta regresiva */}
      <section style={{ padding: '4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-dark-secondary)' }}>
        <h3 style={{ fontSize: '1.8rem', color: 'var(--rose-gold)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem' }}>Falta muy poco...</h3>
        <div className="countdown-container">
          <div className="countdown-box">
            <span className="countdown-num">{countdown.days}</span>
            <span className="countdown-label">Días</span>
          </div>
          <div className="countdown-box">
            <span className="countdown-num">{countdown.hours}</span>
            <span className="countdown-label">Hs</span>
          </div>
          <div className="countdown-box">
            <span className="countdown-num">{countdown.minutes}</span>
            <span className="countdown-label">Min</span>
          </div>
          <div className="countdown-box">
            <span className="countdown-num">{countdown.seconds}</span>
            <span className="countdown-label">Seg</span>
          </div>
        </div>
      </section>

      {/* Detalles del Evento */}
      <section style={{ padding: '5rem 1rem', background: 'var(--bg-dark-primary)', display: 'flex', justifyContent: 'center' }}>
        <div className="panel-glass" style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--rose-gold-light)', marginBottom: '2rem' }}>Detalles del Evento</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem', marginTop: '1.5rem' }}>
            
            {/* Cuadro de salón y fecha */}
            <div style={{ borderRight: '1px solid rgba(226,165,165,0.1)', paddingRight: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', color: 'var(--gold)', marginBottom: '0.8rem' }}>✦ Fiesta ✦</div>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Salón Elegance Eventos</h3>
              <p style={{ fontSize: '0.95rem', marginBottom: '1.2rem' }}>Av. de los Constituyentes 4500, Villa Urquiza, CABA</p>
              
              <a 
                href="https://maps.google.com/?q=Av.+de+los+Constituyentes+4500,+Villa+Urquiza,+CABA" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-premium btn-secondary" 
                style={{ fontSize: '0.8rem', padding: '0.6rem 1.5rem' }}
              >
                ¿Cómo llegar?
              </a>
              
              <div style={{ marginTop: '1.8rem' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Horario de Inicio</span>
                <span style={{ fontSize: '1.2rem', color: 'var(--rose-gold-light)' }}>Sábado 23 de Enero - 21:30 hs</span>
              </div>
              <div style={{ marginTop: '0.8rem' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Horario de Finalización</span>
                <span style={{ fontSize: '1.1rem', color: 'var(--rose-gold-light)' }}>Domingo 24 de Enero - 05:30 hs</span>
              </div>
            </div>

            {/* Información adicional */}
            <div style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '1.8rem', color: 'var(--gold)', marginBottom: '0.8rem' }}>✦ Información ✦</div>
              
              <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <strong style={{ color: 'var(--rose-gold)' }}>Vestimenta:</strong>
                <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>Formal / Elegante Sport</p>
              </div>

              <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <strong style={{ color: 'var(--rose-gold)' }}>Estacionamiento:</strong>
                <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>El salón cuenta con valet parking y estacionamiento privado de cortesía dentro del predio.</p>
              </div>

              <div style={{ textAlign: 'left' }}>
                <strong style={{ color: 'var(--rose-gold)' }}>Ingreso:</strong>
                <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>El control se realiza mediante la lista de invitados confirmados. No es necesario presentar DNI físico.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Valores de las tarjetas */}
      <section style={{ padding: '4rem 1rem', background: 'var(--bg-dark-secondary)', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.2rem', color: 'var(--rose-gold)', marginBottom: '0.5rem' }}>Valor de la Tarjeta</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2rem' }}>Vigencia de precios hasta el 31/12/2026</p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem' }}>
            <div className="panel-glass" style={{ minWidth: '220px', flex: 1, padding: '1.8rem' }}>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--rose-gold-light)' }}>Mayores / Adultos</h3>
              <p style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--gold)', margin: '0.5rem 0' }}>$50.000</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Por persona</p>
            </div>
            
            <div className="panel-glass" style={{ minWidth: '220px', flex: 1, padding: '1.8rem' }}>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--rose-gold-light)' }}>Menores (Hasta 12 años)</h3>
              <p style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--gold)', margin: '0.5rem 0' }}>$25.000</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Por persona</p>
            </div>
          </div>
          
          <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            * Las transferencias e ingresos deben estar debidamente reportados en esta plataforma para garantizar el ingreso al salón.
          </div>
        </div>
      </section>

      {/* Formulario RSVP / Confirmación */}
      <section id="confirmar" style={{ padding: '6rem 1rem', background: 'var(--bg-dark-primary)', display: 'flex', justifyContent: 'center' }}>
        {successResponse ? (
          /* Mensaje de Éxito */
          <div className="panel-glass animated-fade-in" style={{ maxWidth: '650px', width: '100%', textAlign: 'center', border: '1px solid rgba(163, 230, 53, 0.3)' }}>
            <div style={{ fontSize: '4rem', color: 'var(--rose-gold)', marginBottom: '1rem' }}>✓</div>
            <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>¡Confirmación Recibida!</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--rose-gold-light)', lineHeight: '1.6', marginBottom: '2rem' }}>
              {successResponse.message}
            </p>
            <button onClick={() => {
              setSuccessResponse(null);
              setFormData({
                dni: '',
                nombre: '',
                apellido: '',
                telefono: '',
                email: '',
                cantidad_personas: 1,
                modalidad_pago: 'ahora',
                observaciones: '',
              });
              setAsistentes([{ nombre: '', apellido: '', email: '', tipo_asistente: 'adulto', restriccion_alimentaria: 'ninguna', restriccion_alimentaria_detalle: '' }]);
              setComprobanteFile(null);
              setComprobantePreview(null);
              setIsExistingRegistration(false);
              setHasExistingComprobante(false);
              setDniVerificationMessage('');
            }} className="btn-premium btn-primary">Confirmar otra invitación</button>
          </div>
        ) : (
          /* Formulario */
          <div className="panel-glass" style={{ maxWidth: '750px', width: '100%' }}>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--rose-gold-light)', textAlign: 'center', marginBottom: '0.5rem' }}>Confirmar Asistencia</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
              Por favor, completa tus datos antes de la fecha límite para reservar tu lugar.
            </p>

            <form onSubmit={handleSubmit}>
              {/* DNI del Responsable y verificación */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '1rem',
                alignItems: 'end',
                marginBottom: '1.5rem',
                borderBottom: '1px solid rgba(226,165,165,0.1)',
                paddingBottom: '1.5rem'
              }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">DNI del Responsable</label>
                  <input 
                    type="text" 
                    name="dni" 
                    required 
                    value={formData.dni} 
                    onChange={handleInputChange} 
                    className="form-input" 
                    placeholder="Ej. 12345678" 
                  />
                </div>
                <button 
                  type="button" 
                  onClick={handleVerifyDni}
                  disabled={isVerifyingDni}
                  className="btn-premium btn-secondary"
                  style={{
                    height: '46px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 1.5rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isVerifyingDni ? 'Verificando...' : 'Verificar mi registro'}
                </button>
              </div>

              {dniVerificationMessage && (
                <div style={{
                  padding: '0.8rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: isExistingRegistration ? 'rgba(15, 118, 110, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                  border: isExistingRegistration ? '1px solid rgba(15, 118, 110, 0.4)' : '1px solid rgba(239, 68, 68, 0.3)',
                  color: isExistingRegistration ? '#2dd4bf' : '#f87171',
                  fontSize: '0.9rem',
                  marginBottom: '1.5rem',
                  textAlign: 'center'
                }} className="animated-fade-in">
                  {dniVerificationMessage}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Nombre del Responsable</label>
                  <input 
                    type="text" 
                    name="nombre" 
                    required 
                    value={formData.nombre} 
                    onChange={handleInputChange} 
                    className="form-input" 
                    placeholder="Ej. Juan Carlos" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellido del Responsable</label>
                  <input 
                    type="text" 
                    name="apellido" 
                    required 
                    value={formData.apellido} 
                    onChange={handleInputChange} 
                    className="form-input" 
                    placeholder="Ej. Pérez" 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Teléfono / WhatsApp</label>
                  <input 
                    type="tel" 
                    name="telefono" 
                    required 
                    value={formData.telefono} 
                    onChange={handleInputChange} 
                    className="form-input" 
                    placeholder="Ej. +54 9 11 1234-5678" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email del Responsable</label>
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    className="form-input" 
                    placeholder="Ej. juan@correo.com" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cantidad de Personas a Confirmar</label>
                <select 
                  name="cantidad_personas" 
                  value={formData.cantidad_personas} 
                  onChange={handleInputChange} 
                  className="form-input form-select"
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
                      let text = '';
                      if (n === 1) {
                        text = 'Voy solo (1 persona)';
                      } else if (n === 2) {
                        text = 'Acompañado de 1 persona (2 en total)';
                      } else {
                        text = `Acompañado de ${n - 1} personas (${n} en total)`;
                      }
                      return (
                        <option key={n} value={n} style={{ backgroundColor: 'var(--bg-dark-tertiary)' }}>
                          {text}
                        </option>
                      );
                    })}
                  </select>
                </div>

              {/* Registro de Asistentes Individuales */}
              <div style={{ marginTop: '1.5rem', marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--rose-gold)', borderBottom: '1px solid rgba(226,165,165,0.1)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  Detalles de los Asistentes
                </h3>
                
                {asistentes.map((asis, idx) => (
                  <div key={idx} className="animated-fade-in" style={{
                    background: 'rgba(20, 8, 22, 0.4)',
                    border: '1px solid rgba(226,165,165,0.08)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '1rem'
                  }}>
                    <h4 style={{ fontSize: '1rem', color: 'var(--rose-gold-light)', marginBottom: '1rem' }}>
                      Asistente #{idx + 1} {idx === 0 && '(Responsable)'}
                    </h4>
                    
                    {idx === 0 ? (
                      <div style={{ marginBottom: '1.2rem', padding: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Nombre y Apellido: <strong style={{ color: 'var(--text-primary)' }}>{formData.nombre || '(Completa arriba)'} {formData.apellido || ''}</strong>
                        <br />
                        Email: <strong style={{ color: 'var(--text-primary)' }}>{formData.email || '(Completa arriba)'}</strong>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: '0.8rem' }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Nombre</label>
                          <input 
                            type="text" 
                            required 
                            value={asis.nombre} 
                            onChange={(e) => handleAsistenteChange(idx, 'nombre', e.target.value)} 
                            className="form-input" 
                            placeholder="Nombre" 
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.8rem' }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Apellido</label>
                          <input 
                            type="text" 
                            required 
                            value={asis.apellido} 
                            onChange={(e) => handleAsistenteChange(idx, 'apellido', e.target.value)} 
                            className="form-input" 
                            placeholder="Apellido" 
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.8rem' }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Email (Opcional)</label>
                          <input 
                            type="email" 
                            value={asis.email || ''} 
                            onChange={(e) => handleAsistenteChange(idx, 'email', e.target.value)} 
                            className="form-input" 
                            placeholder="Email" 
                          />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Categoría de Invitado</label>
                        <select 
                          value={asis.tipo_asistente} 
                          onChange={(e) => handleAsistenteChange(idx, 'tipo_asistente', e.target.value)} 
                          className="form-input form-select"
                        >
                          <option value="adulto" style={{ backgroundColor: 'var(--bg-dark-tertiary)' }}>Mayor ($50.000)</option>
                          <option value="menor" style={{ backgroundColor: 'var(--bg-dark-tertiary)' }}>Menor de 12 ($25.000)</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Restricción Alimentaria</label>
                        <select 
                          value={asis.restriccion_alimentaria} 
                          onChange={(e) => handleAsistenteChange(idx, 'restriccion_alimentaria', e.target.value)} 
                          className="form-input form-select"
                        >
                          <option value="ninguna" style={{ backgroundColor: 'var(--bg-dark-tertiary)' }}>Ninguna</option>
                          <option value="celiaquia" style={{ backgroundColor: 'var(--bg-dark-tertiary)' }}>Celíaco/a</option>
                          <option value="vegetarianismo" style={{ backgroundColor: 'var(--bg-dark-tertiary)' }}>Vegetariano/a</option>
                          <option value="veganismo" style={{ backgroundColor: 'var(--bg-dark-tertiary)' }}>Vegano/a</option>
                          <option value="alergias" style={{ backgroundColor: 'var(--bg-dark-tertiary)' }}>Alergias / Otra</option>
                        </select>
                      </div>
                    </div>

                    {asis.restriccion_alimentaria === 'alergias' && (
                      <div className="form-group" style={{ marginTop: '1rem', marginBottom: '0' }} className="animated-fade-in">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Especifique Restricción Alimentaria</label>
                        <input 
                          type="text" 
                          required 
                          value={asis.restriccion_alimentaria_detail || ''} 
                          onChange={(e) => handleAsistenteChange(idx, 'restriccion_alimentaria_detalle', e.target.value)} 
                          className="form-input" 
                          placeholder="Ej. Alergia al maní / Sin mariscos / etc." 
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Importe y Forma de Pago */}
              <div className="panel-glass" style={{ background: 'rgba(31, 13, 34, 0.3)', marginBottom: '2.5rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '1.2rem', color: 'var(--rose-gold-light)' }}>Importe Total a Pagar:</span>
                  <strong style={{ fontSize: '2.2rem', fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
                    ${calculateTotal().toLocaleString('es-AR')}
                  </strong>
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Modalidad de Pago</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
                    
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.95rem' }}>
                      <input 
                        type="radio" 
                        name="modalidad_pago" 
                        value="ahora" 
                        checked={formData.modalidad_pago === 'ahora'} 
                        onChange={handleInputChange} 
                        style={{ marginRight: '10px', accentColor: 'var(--rose-gold)' }} 
                      />
                      Confirmar y pagar transferencia ahora (Cargar comprobante)
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.95rem' }}>
                      <input 
                        type="radio" 
                        name="modalidad_pago" 
                        value="despues" 
                        checked={formData.modalidad_pago === 'despues'} 
                        onChange={handleInputChange} 
                        style={{ marginRight: '10px', accentColor: 'var(--rose-gold)' }} 
                      />
                      Confirmar asistencia y pagar después (Estado pendiente)
                    </label>

                  </div>
                </div>
              </div>

              {/* Sección de Datos de Transferencia y Carga (Si se selecciona Pagar Ahora) */}
              {formData.modalidad_pago === 'ahora' && (
                <div className="panel-glass animated-fade-in" style={{ background: 'rgba(20, 8, 22, 0.9)', marginBottom: '2.5rem', padding: '1.5rem', border: '1px dashed var(--rose-gold)' }}>
                  <h4 style={{ fontSize: '1.1rem', color: 'var(--rose-gold)', marginBottom: '1rem' }}>Datos Bancarios para Transferencia</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <div>
                      <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Titular</span>
                      <strong style={{ color: 'var(--text-primary)' }}>Marcelo Juan Rabozzi</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>CBU</span>
                      <strong style={{ color: 'var(--text-primary)' }}>0170123456789012345678</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Alias Bancario</span>
                        <strong style={{ color: 'var(--gold)' }}>sol.15.rabozzi</strong>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleCopyAlias} 
                        className="btn-premium btn-secondary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', letterSpacing: '0.5px' }}
                      >
                        {copiedAlias ? '¡Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">Adjuntar Comprobante de Pago</label>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>Formatos admitidos: JPG, PNG, PDF (Máx: 5MB)</p>
                    
                    {hasExistingComprobante && (
                      <div style={{
                        padding: '0.6rem 0.8rem',
                        backgroundColor: 'rgba(15, 118, 110, 0.2)',
                        border: '1px solid rgba(15, 118, 110, 0.4)',
                        borderRadius: '8px',
                        color: '#2dd4bf',
                        fontSize: '0.85rem',
                        marginBottom: '0.8rem',
                        textAlign: 'center'
                      }}>
                        ✓ Ya has adjuntado un comprobante anteriormente. Si subes uno nuevo, se reemplazará.
                      </div>
                    )}
                    
                    <div style={{
                      border: '2px dashed rgba(226,165,165,0.25)',
                      borderRadius: '12px',
                      padding: '2rem 1rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      background: 'rgba(10, 4, 11, 0.5)',
                      transition: 'all 0.3s ease'
                    }} className="upload-dropzone">
                      <input 
                        type="file" 
                        accept=".png, .jpg, .jpeg, .pdf" 
                        onChange={handleFileChange} 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer'
                        }}
                      />
                      
                      {comprobanteFile ? (
                        <div>
                          <div style={{ color: 'var(--rose-gold-light)', fontWeight: '500', marginBottom: '0.5rem' }}>
                            📁 {comprobanteFile.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {(comprobanteFile.size / 1024 / 1024).toFixed(2)} MB - Haz clic para cambiar el archivo
                          </div>
                          {comprobantePreview && (
                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                              <img src={comprobantePreview} alt="Preview Comprobante" style={{ maxHeight: '120px', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '1.8rem', color: 'var(--rose-gold)', marginBottom: '0.5rem' }}>📤</div>
                          <div style={{ color: 'var(--text-secondary)' }}>Haz clic o arrastra para subir tu comprobante</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                <label className="form-label">Observaciones / Restricciones Adicionales</label>
                <textarea 
                  name="observaciones" 
                  value={formData.observaciones} 
                  onChange={handleInputChange} 
                  rows="3" 
                  className="form-input" 
                  placeholder="Ej. Avísennos si necesitan algo especial, silla de ruedas, etc."
                  style={{ resize: 'vertical' }}
                ></textarea>
              </div>

              {errorMessage && (
                <div style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  marginBottom: '1.5rem',
                  fontSize: '0.9rem'
                }}>
                  ⚠️ {errorMessage}
                </div>
              )}

              <div style={{ textAlign: 'center' }}>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="btn-premium btn-primary"
                  style={{ width: '100%', maxWidth: '300px', height: '52px' }}
                >
                  {isSubmitting ? 'Procesando...' : 'Confirmar Asistencia'}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      {/* Footer elegante */}
      <footer style={{
        padding: '3rem 1rem',
        textAlign: 'center',
        background: 'var(--bg-dark-secondary)',
        borderTop: '1px solid rgba(226,165,165,0.05)',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--rose-gold-light)', marginBottom: '0.5rem' }}>Sol Rabozzi - Mis 15 Años</div>
        <div>23 de Enero de 2027 • Salón Elegance</div>
        <div style={{ marginTop: '1.5rem', fontSize: '0.75rem' }}>© 2026 Sol Rabozzi • Desarrollado para gestión de asistencia</div>
      </footer>
    </div>
  );
}
