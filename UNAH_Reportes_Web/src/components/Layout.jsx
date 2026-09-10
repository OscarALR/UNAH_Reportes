import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faBars,
  faBoxArchive,
  faChartLine,
  faClipboardList,
  faHouse,
  faMoon,
  faPlus,
  faRightFromBracket,
  faSun,
  faTableColumns,
  faScrewdriverWrench,
} from '@fortawesome/free-solid-svg-icons';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { getAccessToken } from '../auth/getToken';
import { getNotificaciones } from '../api/notificacionesApi';
import './Layout.css';

function Layout({ children }) {
  const { instance, accounts } = useMsal();
  const { usuario, cerrarSesionLocal } = useUser();
  const { tema, alternarTema } = useTheme();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const [aviso, setAviso] = useState('');
  const ultimaNotificacion = useRef(null);

  const esGestorOAdmin =
    usuario?.rol === 'Gestor' || usuario?.rol === 'Administrador';
  const esAdministrador = usuario?.rol === 'Administrador';

  useEffect(() => {
    let activo = true;

    const cargarConteoNotificaciones = async () => {
      if (!usuario?.idUsuario) return;

      try {
        const token = await getAccessToken(instance, accounts);
        const notificaciones = await getNotificaciones(usuario.idUsuario, token);

        if (activo) {
          setNoLeidas(
            notificaciones.filter((notificacion) => !notificacion.leida).length
          );
          const masReciente = notificaciones[0];
          if (ultimaNotificacion.current && masReciente && masReciente.idNotificacion !== ultimaNotificacion.current) {
            setAviso(masReciente.mensaje);
            window.setTimeout(() => setAviso(''), 6000);
          }
          if (masReciente) ultimaNotificacion.current = masReciente.idNotificacion;
        }
      } catch (error) {
        console.error('Error cargando notificaciones:', error);
      }
    };

    cargarConteoNotificaciones();
    const intervalo = window.setInterval(cargarConteoNotificaciones, 30000);

    window.addEventListener(
      'notificacionesActualizadas',
      cargarConteoNotificaciones
    );

    return () => {
      activo = false;
      window.removeEventListener(
        'notificacionesActualizadas',
        cargarConteoNotificaciones
      );
      window.clearInterval(intervalo);
    };
  }, [accounts, instance, usuario?.idUsuario]);

  const cerrarMenu = () => setMenuAbierto(false);

  const handleLogout = async () => {
    if (sessionStorage.getItem('unah_local_token')) {
      cerrarSesionLocal();
      return;
    }
    const cuentaActiva = instance.getActiveAccount() ?? accounts[0];
    await instance.logoutRedirect({
      account: cuentaActiva,
      postLogoutRedirectUri: window.location.origin,
    });
  };

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-header-contenido">
          <Link to="/" className="layout-logo" onClick={cerrarMenu} aria-label="RiUVS, inicio">
            <img
              src={tema === 'dark' ? '/riuvs-logo-dark-bg.svg' : '/riuvs-logo-horizontal.svg'}
              alt="RiUVS, plataforma de incidencias UNAH VS"
            />
          </Link>

          <nav className={`layout-nav ${menuAbierto ? 'abierto' : ''}`}>
            <div className="layout-enlaces">
              <NavLink
                end
                to="/"
                className={({ isActive }) =>
                  `layout-nav-link ${isActive ? 'activo' : ''}`
                }
                onClick={cerrarMenu}
              >
                <FontAwesomeIcon icon={faHouse} />
                <span>Feed</span>
              </NavLink>

              <NavLink
                to="/mis-reportes"
                className={({ isActive }) =>
                  `layout-nav-link ${isActive ? 'activo' : ''}`
                }
                onClick={cerrarMenu}
              >
                <FontAwesomeIcon icon={faClipboardList} />
                <span>Mis reportes</span>
              </NavLink>

              <NavLink
                to="/archivados"
                className={({ isActive }) =>
                  `layout-nav-link ${isActive ? 'activo' : ''}`
                }
                onClick={cerrarMenu}
              >
                <FontAwesomeIcon icon={faBoxArchive} />
                <span>Archivados</span>
              </NavLink>

              <NavLink
                to="/crear-reporte"
                className={({ isActive }) =>
                  `layout-nav-link ${isActive ? 'activo' : ''}`
                }
                onClick={cerrarMenu}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Crear reporte</span>
              </NavLink>

              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `layout-nav-link ${isActive ? 'activo' : ''}`
                }
                onClick={cerrarMenu}
              >
                <FontAwesomeIcon icon={faChartLine} />
                <span>Dashboard</span>
              </NavLink>

              {esGestorOAdmin && (
                <>
                  <NavLink
                    to="/gestion"
                    className={({ isActive }) =>
                      `layout-nav-link ${isActive ? 'activo' : ''}`
                    }
                    onClick={cerrarMenu}
                  >
                    <FontAwesomeIcon icon={faTableColumns} />
                    <span>Gestión</span>
                  </NavLink>

                </>
              )}

              {esAdministrador && (
                <NavLink
                  to="/administracion/categorias"
                  className={({ isActive }) =>
                    `layout-nav-link ${isActive ? 'activo' : ''}`
                  }
                  onClick={cerrarMenu}
                >
                  <FontAwesomeIcon icon={faScrewdriverWrench} />
                  <span>Administración</span>
                </NavLink>
              )}

            </div>
          </nav>

          <div className="layout-acciones">
              <NavLink to="/notificaciones" className="layout-bell" title="Notificaciones" aria-label="Notificaciones">
                <FontAwesomeIcon icon={faBell} />
                {noLeidas > 0 && <span className="layout-notificaciones-contador">{noLeidas > 9 ? '9+' : noLeidas}</span>}
              </NavLink>
              <button
                type="button"
                onClick={alternarTema}
                className="layout-theme-toggle"
                title={tema === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
                aria-label={tema === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
              >
                <FontAwesomeIcon icon={tema === 'light' ? faMoon : faSun} />
              </button>
              <div className="layout-user-menu">
              <button type="button" className="layout-user" onClick={() => setMenuUsuarioAbierto((abierto) => !abierto)} aria-expanded={menuUsuarioAbierto}>
                <span className="layout-avatar">
                  {usuario?.nombreCompleto?.charAt(0)?.toUpperCase() ?? '?'}
                </span>

                <div className="layout-user-info">
                  <span className="layout-username">{usuario?.nombreCompleto}</span>
                  <span className="layout-user-role">{usuario?.rol}</span>
                </div>
              </button>
              {menuUsuarioAbierto && <div className="layout-user-dropdown"><NavLink to="/perfil" onClick={() => setMenuUsuarioAbierto(false)}>Mi perfil</NavLink><button type="button" onClick={handleLogout}><FontAwesomeIcon icon={faRightFromBracket} /> Cerrar sesión</button></div>}
              </div>
          </div>

          <button
            className="layout-menu-toggle"
            type="button"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        </div>
      </header>

      <main className="layout-content">{children}</main>
      {aviso && <div className="layout-toast" role="status">{aviso}</div>}
      <footer className="layout-footer">
        <div className="layout-footer-contenido">
          <div>
            <strong><img src="/riuvs-icon.svg" alt="" />RiUVS</strong>
            <span>Plataforma de incidencias para UNAH Valle de Sula.</span>
          </div>
          <div className="layout-footer-enlaces">
            <span>Desarrollado por Oscar López Rodríguez</span>
            <a href="https://github.com/OscarALR" target="_blank" rel="noreferrer">GitHub</a>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
