import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useUser } from '../context/UserContext';
import { getAccessToken } from '../auth/getToken';
import { getNotificaciones, marcarLeida } from '../api/notificacionesApi';
import './NotificacionesPage.css';

function obtenerSiglas(tipo = '') {
  const tipoNormalizado = tipo.toLowerCase();

  if (tipoNormalizado.includes('estado')) return 'ES';
  if (tipoNormalizado.includes('comentario')) return 'CO';
  if (tipoNormalizado.includes('asign')) return 'AS';

  return 'IN';
}

function tiempoRelativo(fecha) {
  const diferenciaMs = Date.now() - new Date(fecha).getTime();
  const minutos = Math.floor(diferenciaMs / 60000);
  const horas = Math.floor(diferenciaMs / 3600000);
  const dias = Math.floor(diferenciaMs / 86400000);

  if (minutos < 1) return 'Hace unos momentos';
  if (minutos < 60) return `Hace ${minutos} min`;
  if (horas < 24) return `Hace ${horas} h`;
  if (dias === 1) return 'Ayer';
  if (dias < 7) return `Hace ${dias} días`;

  return new Date(fecha).toLocaleDateString('es-HN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function NotificacionesPage() {
  const { instance, accounts } = useMsal();
  const { usuario } = useUser();

  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todas');
  const idUsuario = usuario?.idUsuario;

  const cargarNotificaciones = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);

      const token = await getAccessToken(instance, accounts);
      const data = await getNotificaciones(idUsuario, token);
      setNotificaciones(data);
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
      setError('No se pudieron cargar las notificaciones. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  }, [accounts, idUsuario, instance]);

  useEffect(() => {
    if (idUsuario) {
      cargarNotificaciones();
    }
  }, [cargarNotificaciones, idUsuario]);

  const handleMarcarLeida = async (idNotificacion) => {
    const notificacion = notificaciones.find(
      (item) => item.idNotificacion === idNotificacion
    );

    if (!notificacion || notificacion.leida) return;

    try {
      const token = await getAccessToken(instance, accounts);
      await marcarLeida(usuario.idUsuario, idNotificacion, token);

      setNotificaciones((prev) =>
        prev.map((item) =>
          item.idNotificacion === idNotificacion
            ? { ...item, leida: true }
            : item
        )
      );

      window.dispatchEvent(new Event('notificacionesActualizadas'));
    } catch (err) {
      console.error('Error marcando como leída:', err);
    }
  };

  const noLeidas = useMemo(
    () => notificaciones.filter((notificacion) => !notificacion.leida).length,
    [notificaciones]
  );

  const notificacionesFiltradas = useMemo(() => {
    if (filtro === 'no-leidas') {
      return notificaciones.filter((notificacion) => !notificacion.leida);
    }

    return notificaciones;
  }, [notificaciones, filtro]);

  if (cargando) {
    return <p className="notificaciones-estado-pagina">Cargando notificaciones...</p>;
  }

  if (error) {
    return (
      <div className="notificaciones-error">
        <p>{error}</p>
        <button type="button" onClick={cargarNotificaciones}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="notificaciones-page">
      <div className="notificaciones-encabezado">
        <div>
          <p className="notificaciones-etiqueta">Centro de actividad</p>
          <h2>Notificaciones</h2>
          <p>Mantente al tanto de los cambios en tus reportes.</p>
        </div>

        <button
          className="notificaciones-actualizar"
          type="button"
          onClick={cargarNotificaciones}
        >
          Actualizar
        </button>
      </div>

      <section className="notificaciones-panel">
        <div className="notificaciones-panel-cabecera">
          <div>
            <h3>Actividad reciente</h3>
            <p>
              {noLeidas === 0
                ? 'No tienes notificaciones pendientes.'
                : `Tienes ${noLeidas} notificación(es) sin leer.`}
            </p>
          </div>

          <div className="notificaciones-filtros">
            <button
              type="button"
              className={filtro === 'todas' ? 'activo' : ''}
              onClick={() => setFiltro('todas')}
            >
              Todas <span>{notificaciones.length}</span>
            </button>

            <button
              type="button"
              className={filtro === 'no-leidas' ? 'activo' : ''}
              onClick={() => setFiltro('no-leidas')}
            >
              Sin leer <span>{noLeidas}</span>
            </button>
          </div>
        </div>

        {notificacionesFiltradas.length === 0 ? (
          <div className="notificaciones-vacio">
            <div className="notificaciones-vacio-icono">IN</div>
            <h3>No hay notificaciones para mostrar</h3>
            <p>
              {filtro === 'no-leidas'
                ? 'Ya has leído todas tus notificaciones.'
                : 'Cuando haya actividad en tus reportes, aparecerá aquí.'}
            </p>
          </div>
        ) : (
          <div className="notificaciones-lista">
            {notificacionesFiltradas.map((notificacion) => (
              <article
                key={notificacion.idNotificacion}
                className={`notificacion-item ui-entrada ${notificacion.leida ? 'leida' : 'no-leida'}`}
              >
                <div className="notificacion-icono">
                  {obtenerSiglas(notificacion.tipo)}
                </div>

                <div className="notificacion-contenido">
                  <div className="notificacion-superior">
                    <div>
                      <span className="notificacion-tipo">
                        {notificacion.tipo || 'Notificación'}
                      </span>
                      <p>{notificacion.mensaje}</p>
                    </div>

                    {!notificacion.leida && (
                      <span className="notificacion-indicador" title="No leída" />
                    )}
                  </div>

                  <div className="notificacion-inferior">
                    <time title={new Date(notificacion.fechaCreacion).toLocaleString('es-HN')}>
                      {tiempoRelativo(notificacion.fechaCreacion)}
                    </time>

                    <div className="notificacion-acciones">
                      <Link
                        to={`/reporte/${notificacion.idReporte}`}
                        onClick={() => handleMarcarLeida(notificacion.idNotificacion)}
                      >
                        Ver reporte
                      </Link>

                      {!notificacion.leida && (
                        <button
                          type="button"
                          onClick={() => handleMarcarLeida(notificacion.idNotificacion)}
                        >
                          Marcar como leída
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default NotificacionesPage;
