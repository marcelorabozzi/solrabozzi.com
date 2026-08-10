import React, { useState, useEffect } from 'react';
import Invitation from './components/Invitation';
import AdminPanel from './components/AdminPanel';

function App() {
  const [currentView, setCurrentView] = useState('invitation');

  useEffect(() => {
    // Escuchar cambios de hash en la URL
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('invitation');
      }
    };

    // Evaluar inicialmente
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="app-container">
      {/* Botón flotante oculto para navegar al admin, o simplemente acceso por URL hash */}
      <main className="main-content">
        {currentView === 'admin' ? <AdminPanel /> : <Invitation />}
      </main>
      
      {/* Enlace sutil al pie para administradores */}
      {currentView === 'invitation' && (
        <div style={{ textAlign: 'center', background: 'var(--bg-dark-secondary)', paddingBottom: '2rem' }}>
          <a 
            href="#admin" 
            style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)', 
              textDecoration: 'none',
              opacity: 0.5,
              transition: 'opacity 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = 1}
            onMouseLeave={(e) => e.target.style.opacity = 0.5}
          >
            Acceso Organizadores
          </a>
        </div>
      )}

      {currentView === 'admin' && (
        <div style={{ textAlign: 'center', background: 'var(--bg-dark-primary)', paddingBottom: '2rem' }}>
          <a 
            href="#" 
            style={{ 
              fontSize: '0.85rem', 
              color: 'var(--rose-gold)', 
              textDecoration: 'none',
              borderBottom: '1px dashed var(--rose-gold)'
            }}
          >
            Volver a la Invitación
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
