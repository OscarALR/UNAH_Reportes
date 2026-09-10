import { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComments,
  faEnvelope,
  faClockRotateLeft,
  faLocationDot,
  faGraduationCap,
  faScrewdriverWrench,
  faTag,
  faUser,
  faUserGear,
} from '@fortawesome/free-solid-svg-icons';
import { getAccessToken } from '../auth/getToken';
import { getReportePorId } from '../api/reportesApi';
import { getComentarios, crearComentario } from '../api/comentariosApi';
import { getHistorial } from '../api/historialApi';
import { getImagenes } from '../api/imagenesApi';
import { useUser } from '../context/UserContext';
import { archivarReporte, cambiarEstado, asignarGestor } from '../api/reportesApi';
import { getEstados } from '../api/catalogosApi';
import { ordenarAlfabeticamente } from '../utils/ordenarAlfabeticamente';
import './ReporteDetallePage.css';

function slugEstado(estado) {
  return estado
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

function ReporteDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();

  const { usuario } = useUser();

  const [estados, setEstados] = useState([]);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [comentarioEstado, setComentarioEstado] = useState('');
  const [actualizandoEstado, setActualizandoEstado] = useState(false);

  const esGestorOAdmin = usuario?.rol === 'Gestor' || usuario?.rol === 'Administrador';

  const [reporte, setReporte] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [imagenActiva, setImagenActiva] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  const [lightboxAbierto, setLightboxAbierto] = useState(false);
  const [zoomActivo, setZoomActivo] = useState(false);

  const cargarTodo = useCallback(async () => {
    setCargando(true);
    try {
      const token = await getAccessToken(instance, accounts);
      const promesas = [
        getReportePorId(id, token),
        getComentarios(id, token),
        getHistorial(id, token),
        getImagenes(id, token),
      ];

      if (esGestorOAdmin) {
        promesas.push(getEstados());
      }

      const [rep, coms, hist, imgs, estadosData] = await Promise.all(promesas);
      setReporte(rep);
      setComentarios(coms);
      setHistorial(hist);
      setImagenes(imgs);
      setImagenActiva(0);

      if (estadosData) setEstados(ordenarAlfabeticamente(estadosData, (estado) => estado.nombreEstado));
    } catch (err) {
      console.error('Error cargando el detalle del reporte:', err);
      setError('No se pudo cargar el reporte.');
    } finally {
      setCargando(false);
    }
  }, [accounts, esGestorOAdmin, id, instance]);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  const handleCambiarEstado = async (e) => {
    e.preventDefault();
    if (!nuevoEstado) return;

    setActualizandoEstado(true);
    try {
      const token = await getAccessToken(instance, accounts);
      await cambiarEstado(id, Number(nuevoEstado), comentarioEstado || null, token);
      setNuevoEstado('');
      setComentarioEstado('');
      cargarTodo();
    } catch (err) {
      console.error('Error cambiando estado:', err);
      if (err.response?.status === 400) {
        alert(err.response.data?.errors?.Comentario?.[0] || 'El comentario es demasiado largo.');
      } else {
        alert('Ocurrió un error al actualizar el estado. Intenta de nuevo.');
      }
    } finally {
      setActualizandoEstado(false);
    }
  };

  const handleAsignarme = async () => {
    try {
      const token = await getAccessToken(instance, accounts);
      await asignarGestor(id, usuario.idUsuario, token);
      cargarTodo();
    } catch (err) {
      console.error('Error asignando gestor:', err);
    }
  };

  const handleComentar = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;

    setEnviandoComentario(true);
    try {
      const token = await getAccessToken(instance, accounts);
      await crearComentario(id, nuevoComentario, token);
      setNuevoComentario('');
      const comsActualizados = await getComentarios(id, token);
      setComentarios(comsActualizados);
    } catch (err) {
      console.error('Error creando comentario:', err);
      if (err.response?.status === 400) {
        alert(err.response.data?.errors?.Texto?.[0] || 'El comentario no es válido.');
      } else {
        alert('Ocurrió un error al enviar el comentario. Intenta de nuevo.');
      }
    } finally {
      setEnviandoComentario(false);
    }
  };

  const handleArchivar = async () => {
    const motivo = window.prompt('Indica el motivo para archivar este reporte:');
    if (!motivo?.trim()) return;
    if (!window.confirm('El reporte dejará de aparecer en el feed y se notificará a quien lo creó. ¿Continuar?')) return;
    try {
      const token = await getAccessToken(instance, accounts);
      await archivarReporte(id, motivo.trim(), token);
      navigate('/archivados');
    } catch (err) {
      console.error('Error archivando reporte:', err);
      alert(err.response?.data || 'No se pudo archivar el reporte.');
    }
  };

  const imagenAnterior = () => {
    setImagenActiva((prev) => (prev === 0 ? imagenes.length - 1 : prev - 1));
  };

  const imagenSiguiente = () => {
    setImagenActiva((prev) => (prev === imagenes.length - 1 ? 0 : prev + 1));
  };

  if (cargando) return <p>Cargando reporte...</p>;
  if (error) return <p>{error}</p>;
  if (!reporte) return <p>Reporte no encontrado.</p>;

  const tieneImagenes = imagenes.length > 0;

  // --- Bloques reutilizados en ambos layouts ---

  const bloqueInfo = (
    <div className="detalle-card detalle-header">
      <h2>{reporte.titulo}</h2>
      <p className="detalle-descripcion">{reporte.descripcion}</p>

      <div className="detalle-badges">
        <span className={`badge badge-prioridad-${reporte.prioridad.toLowerCase()}`}>
          {reporte.prioridad}
        </span>
        <span className={`badge badge-estado-${slugEstado(reporte.estado)}`}>{reporte.estado}</span>
      </div>

      <div className="detalle-meta">
        <div className="detalle-meta-item"><span className="detalle-etiqueta"><FontAwesomeIcon icon={faTag} />Categoría</span><span className="detalle-meta-valor">{reporte.categoria}</span></div>
        <div className="detalle-meta-item"><span className="detalle-etiqueta"><FontAwesomeIcon icon={faLocationDot} />Ubicación</span><span className="detalle-meta-valor">{reporte.ubicacion ?? reporte.espacio}</span></div>
        <div className="detalle-meta-item"><span className="detalle-etiqueta"><FontAwesomeIcon icon={faUser} />Reportado por</span><span className="detalle-meta-valor detalle-reportante"><strong>{reporte.usuarioReporta}</strong>{reporte.correoUsuarioReporta && <a href={`mailto:${reporte.correoUsuarioReporta}`}><FontAwesomeIcon icon={faEnvelope} />{reporte.correoUsuarioReporta}</a>}</span></div>
        <div className="detalle-meta-item"><span className="detalle-etiqueta"><FontAwesomeIcon icon={faGraduationCap} />Carrera</span><span className="detalle-meta-valor"><span className="detalle-carrera">{reporte.carreraUsuarioReporta ?? 'Sin carrera asignada'}</span></span></div>
        <div className="detalle-meta-item"><span className="detalle-etiqueta"><FontAwesomeIcon icon={faUserGear} />Gestor asignado</span><span className="detalle-meta-valor">{reporte.gestorAsignado ?? 'Sin asignar'}</span></div>
      </div>

      <p className="detalle-fecha">{new Date(reporte.fechaCreacion).toLocaleString()}</p>
    </div>
  );

  const bloqueGestion = esGestorOAdmin && !reporte.eliminado && (
  <div className="detalle-card panel-gestion">
    <h3><FontAwesomeIcon icon={faScrewdriverWrench} />Panel de gestión</h3>
    <p className="panel-gestion-subtitulo">Solo visible para gestores y administradores</p>

    <form className="panel-gestion-fila" onSubmit={handleCambiarEstado}>
      <button type="button" className="btn btn-primary" onClick={handleAsignarme}>
        Asignarme este reporte
      </button>

      <button type="button" className="btn btn-danger" onClick={handleArchivar}>
        Archivar reporte
      </button>

      <div className="panel-gestion-divisor" />

      <div className="panel-gestion-campo campo-estado">
        <label>Nuevo estado</label>
        <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}>
          <option value="">Selecciona un estado</option>
          {estados.map((est) => (
            <option key={est.idEstado} value={est.idEstado}>{est.nombreEstado}</option>
          ))}
        </select>
      </div>

      <div className="panel-gestion-campo campo-comentario">
        <label>Comentario (opcional)</label>
        <input
          type="text"
          placeholder="Ej: Se envió al equipo de mantenimiento"
          value={comentarioEstado}
          onChange={(e) => setComentarioEstado(e.target.value)}
          maxLength={500}
        />
      </div>

      <button className="btn btn-primary" type="submit" disabled={actualizandoEstado}>
        {actualizandoEstado ? 'Actualizando...' : 'Actualizar estado'}
      </button>
    </form>
  </div>
);

  const bloqueHistorial = (
    <div className="detalle-card">
      <h3><FontAwesomeIcon icon={faClockRotateLeft} />Historial de estados</h3>
      {historial.length === 0 ? (
        <p>Sin historial todavía.</p>
      ) : (
        <ul className="historial-lista">
          {historial.map((h) => (
            <li key={h.idHistorial} className="historial-item">
              <div className="historial-cabecera">
                <strong>{h.estado}</strong> — {h.usuario} ({new Date(h.fechaCambio).toLocaleString()})
              </div>
              {h.comentario && <p className="historial-comentario">{h.comentario}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const bloqueComentarios = (
    <div className="detalle-card">
      <h3><FontAwesomeIcon icon={faComments} />Comentarios</h3>
      {comentarios.length === 0 ? (
        <p>Sin comentarios todavía.</p>
      ) : (
        <ul className="comentarios-lista">
          {comentarios.map((c) => (
            <li key={c.idComentario} className="comentario-item">
              <div className="comentario-cabecera">
                <strong>{c.usuario}</strong> ({new Date(c.fechaComentario).toLocaleString()})
              </div>
              <p className="comentario-texto">{c.texto}</p>
            </li>
          ))}
        </ul>
      )}

      <form className="comentario-form" onSubmit={handleComentar}>
        <textarea
          value={nuevoComentario}
          onChange={(e) => setNuevoComentario(e.target.value)}
          placeholder="Escribe un comentario de seguimiento..."
          maxLength={500}
        />
        <button className="btn btn-primary" type="submit" disabled={enviandoComentario}>
          {enviandoComentario ? 'Enviando...' : 'Comentar'}
        </button>
      </form>
    </div>
  );

  // --- Layout CON imágenes: imagen protagonista + panel lateral ---
  if (tieneImagenes) {
    return (
      <div>
        <Link to="/" className="detalle-volver">← Volver al feed</Link>

        <div className="detalle-con-imagen">
          <div className="detalle-visor">
            <div className="detalle-visor-imagen-wrap" onClick={() => { setLightboxAbierto(true); setZoomActivo(false); }}>
              {imagenes.length > 1 && (
                <button className="detalle-visor-flecha izq" 
                onClick={(e) => { e.stopPropagation(); imagenAnterior(); }} aria-label="Imagen anterior">
                  ‹
                </button>
              )}
              <img src={imagenes[imagenActiva]} alt={`Imagen ${imagenActiva + 1}`} />
              {imagenes.length > 1 && (
                <button className="detalle-visor-flecha der" 
                onClick={(e) => { e.stopPropagation(); imagenSiguiente(); }} aria-label="Imagen siguiente">
                  ›
                </button>
              )}
            </div>

            {imagenes.length > 1 && (
              <div className="detalle-visor-miniaturas">
                {imagenes.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Miniatura ${index + 1}`}
                    className={index === imagenActiva ? 'activa' : ''}
                    onClick={() => setImagenActiva(index)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="detalle-panel-lateral">
            {bloqueInfo}
            {bloqueGestion}
            {bloqueHistorial}
            {bloqueComentarios}
          </div>
        </div>
        {lightboxAbierto && (
          <div className="lightbox-overlay" onClick={() => setLightboxAbierto(false)}>
            <button className="lightbox-cerrar" onClick={() => setLightboxAbierto(false)} aria-label="Cerrar">
              ✕
            </button>

            {imagenes.length > 1 && (
              <button
                className="lightbox-flecha izq"
                onClick={(e) => { e.stopPropagation(); imagenAnterior(); setZoomActivo(false); }}
              >
                ‹
              </button>
            )}

            <div className="lightbox-imagen-wrap" onClick={(e) => e.stopPropagation()}>
              <img
                src={imagenes[imagenActiva]}
                alt={`Imagen ${imagenActiva + 1}`}
                className={zoomActivo ? 'zoom' : ''}
                onClick={() => setZoomActivo((z) => !z)}
              />
            </div>
          
            {imagenes.length > 1 && (
              <button
                className="lightbox-flecha der"
                onClick={(e) => { e.stopPropagation(); imagenSiguiente(); setZoomActivo(false); }}
              >
                ›
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- Layout SIN imágenes: una columna, tarjetas apiladas (como ya lo teníamos) ---
  return (
    <div>
      <Link to="/" className="detalle-volver">← Volver al feed</Link>

      {bloqueInfo}
      {bloqueGestion}

      <div className="detalle-card">
        <h3>Imágenes</h3>
        <p>No hay imágenes adjuntas.</p>
      </div>

      {bloqueHistorial}
      {bloqueComentarios}
    </div>
  );
}

export default ReporteDetallePage;
