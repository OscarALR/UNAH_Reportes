import { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
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
  faThumbsUp,
  faReply,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { getAccessToken } from '../auth/getToken';
import { getReportePorId, alternarLikeReporte } from '../api/reportesApi';
import { getComentarios, crearComentario, alternarLikeComentario } from '../api/comentariosApi';
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

function fechaUtc(fecha) {
  return typeof fecha === 'string' && !/(Z|[+-]\d\d:\d\d)$/.test(fecha) ? `${fecha}Z` : fecha;
}

function tiempoRelativo(fecha) {
  const diferenciaMs = Math.max(0, Date.now() - new Date(fechaUtc(fecha)).getTime());
  const minutos = Math.floor(diferenciaMs / 60000);
  const horas = Math.floor(diferenciaMs / 3600000);
  const dias = Math.floor(diferenciaMs / 86400000);
  const meses = Math.floor(dias / 30);
  const anios = Math.floor(dias / 365);

  if (minutos < 1) return 'Hace unos momentos';
  if (minutos < 60) return `Hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  if (dias < 30) return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
  if (meses < 12) return `Hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  return `Hace ${anios} ${anios === 1 ? 'año' : 'años'}`;
}

function organizarHilosComentarios(comentarios, orden) {
  const compararPrincipales = (a, b) => orden === 'populares'
    ? (b.numeroLikes - a.numeroLikes) || (new Date(fechaUtc(b.fechaComentario)) - new Date(fechaUtc(a.fechaComentario)))
    : new Date(fechaUtc(b.fechaComentario)) - new Date(fechaUtc(a.fechaComentario));
  const compararRespuestas = (a, b) => new Date(fechaUtc(a.fechaComentario)) - new Date(fechaUtc(b.fechaComentario));
  const nodosPorId = new Map(comentarios.map((comentario) => [comentario.idComentario, { ...comentario, respuestas: [] }]));
  const raices = [];

  nodosPorId.forEach((nodo) => {
    const padre = nodo.idComentarioPadre ? nodosPorId.get(nodo.idComentarioPadre) : null;
    if (padre) padre.respuestas.push(nodo);
    else raices.push(nodo);
  });

  const ordenarRespuestas = (nodos) => {
    nodos.sort(compararRespuestas);
    nodos.forEach((nodo) => ordenarRespuestas(nodo.respuestas));
  };

  raices.sort(compararPrincipales);
  raices.forEach((raiz) => ordenarRespuestas(raiz.respuestas));
  return raices;
}

function limitarHilos(hilos, limite) {
  let mostrados = 0;
  const limitar = (nodos) => nodos.reduce((visibles, nodo) => {
    if (mostrados >= limite) return visibles;
    mostrados += 1;
    visibles.push({ ...nodo, respuestas: limitar(nodo.respuestas) });
    return visibles;
  }, []);

  return limitar(hilos);
}

function inicialesUsuario(nombre = '') {
  return nombre.split(' ').filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || 'U';
}

function tonoAvatar(nombre = '') {
  return [...nombre].reduce((total, caracter) => total + caracter.charCodeAt(0), 0) % 360;
}

function ComentarioHilo({ nodo, hilosContraidos, alternarHilo, respondiendoA, responder, darLike, fechaLocal, formularioRespuesta }) {
  const tieneRespuestas = nodo.respuestas.length > 0;
  const contraido = hilosContraidos.has(nodo.idComentario);

  return (
    <li className="comentario-hilo">
      <article className="comentario-item">
        <div className="comentario-rail">
          <span className="comentario-avatar" style={{ '--tono-avatar': tonoAvatar(nodo.usuario) }} aria-label={`Avatar de ${nodo.usuario}`}>{inicialesUsuario(nodo.usuario)}</span>
          {tieneRespuestas && <button type="button" className="hilo-toggle" onClick={() => alternarHilo(nodo.idComentario)} aria-expanded={!contraido} aria-label={contraido ? 'Mostrar respuestas' : 'Ocultar respuestas'}>{contraido ? '+' : '−'}</button>}
        </div>
        <div className="comentario-contenido">
          <div className="comentario-cabecera">
            <strong>{nodo.usuario}</strong> ({fechaLocal(nodo.fechaComentario)} · <time dateTime={fechaUtc(nodo.fechaComentario)} title={fechaLocal(nodo.fechaComentario)}>{tiempoRelativo(nodo.fechaComentario)}</time>)
          </div>
          <p className="comentario-texto">{nodo.texto}</p>
          <div className="comentario-acciones">
            <button type="button" className={nodo.leGustaUsuarioActual ? 'activo' : ''} onClick={() => darLike(nodo.idComentario)}><FontAwesomeIcon icon={faThumbsUp} /> {nodo.numeroLikes || 0}</button>
            <button type="button" onClick={() => responder(nodo.idComentario)}><FontAwesomeIcon icon={faReply} /> Responder</button>
          </div>
          {respondiendoA === nodo.idComentario && formularioRespuesta()}
        </div>
      </article>
      {tieneRespuestas && !contraido && (
        <ul className="comentario-respuestas">
          {nodo.respuestas.map((respuesta) => <ComentarioHilo key={respuesta.idComentario} nodo={respuesta} hilosContraidos={hilosContraidos} alternarHilo={alternarHilo} respondiendoA={respondiendoA} responder={responder} darLike={darLike} fechaLocal={fechaLocal} formularioRespuesta={formularioRespuesta} />)}
        </ul>
      )}
    </li>
  );
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
  const [comentariosVisibles, setComentariosVisibles] = useState(5);
  const [ordenComentarios, setOrdenComentarios] = useState('recientes');
  const [respondiendoA, setRespondiendoA] = useState(null);
  const [hilosContraidos, setHilosContraidos] = useState(() => new Set());

  const [lightboxAbierto, setLightboxAbierto] = useState(false);
  const [zoomActivo, setZoomActivo] = useState(false);
  const [likeAnimado, setLikeAnimado] = useState(false);

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
      await crearComentario(id, nuevoComentario, token, respondiendoA);
      setNuevoComentario('');
      setRespondiendoA(null);
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

  const darLikeReporte = async () => {
    const token = await getAccessToken(instance, accounts);
    const resultado = await alternarLikeReporte(id, token);
    setReporte((actual) => ({ ...actual, leGustaUsuarioActual: resultado.leGusta, numeroLikes: resultado.numeroLikes }));
    setLikeAnimado(false);
    window.requestAnimationFrame(() => setLikeAnimado(true));
    window.setTimeout(() => setLikeAnimado(false), 350);
  };
  const darLikeComentario = async (idComentario) => {
    const token = await getAccessToken(instance, accounts);
    const resultado = await alternarLikeComentario(id, idComentario, token);
    setComentarios((actuales) => actuales.map((comentario) => comentario.idComentario === idComentario ? { ...comentario, leGustaUsuarioActual: resultado.leGusta, numeroLikes: resultado.numeroLikes } : comentario));
  };
  const fechaLocal = (fecha) => new Intl.DateTimeFormat('es-HN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(fechaUtc(fecha)));

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
  const hilosComentarios = organizarHilosComentarios(comentarios, ordenComentarios);
  const hilosVisibles = limitarHilos(hilosComentarios, comentariosVisibles);
  const comentarioRespondido = comentarios.find((comentario) => comentario.idComentario === respondiendoA);

  const alternarHilo = (idComentario) => {
    setHilosContraidos((actuales) => {
      const siguientes = new Set(actuales);
      if (siguientes.has(idComentario)) siguientes.delete(idComentario);
      else siguientes.add(idComentario);
      return siguientes;
    });
  };

  const formularioComentario = (esRespuesta = false) => (
    <form className={`comentario-form ${esRespuesta ? 'comentario-form-respuesta' : ''}`} onSubmit={handleComentar}>
      {esRespuesta && comentarioRespondido && (
        <div className="respuesta-activa">
          <span>Respondiendo a <strong>{comentarioRespondido.usuario}</strong></span>
          <button type="button" onClick={() => setRespondiendoA(null)} aria-label="Cancelar respuesta">×</button>
        </div>
      )}
      <textarea
        value={nuevoComentario}
        onChange={(e) => setNuevoComentario(e.target.value)}
        placeholder={comentarioRespondido ? `Responde a ${comentarioRespondido.usuario}...` : 'Escribe un comentario de seguimiento...'}
        maxLength={500}
        autoFocus={esRespuesta}
      />
      <div className="comentario-form-acciones">
        {esRespuesta && <button type="button" className="btn" onClick={() => setRespondiendoA(null)}>Cancelar</button>}
        <button className="btn btn-primary" type="submit" disabled={enviandoComentario}>
          {enviandoComentario ? 'Enviando...' : esRespuesta ? 'Responder' : 'Comentar'}
        </button>
      </div>
    </form>
  );

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
        <button type="button" className={`detalle-like ${reporte.leGustaUsuarioActual ? 'activo' : ''} ${likeAnimado ? 'animando' : ''}`} onClick={darLikeReporte}><FontAwesomeIcon icon={faThumbsUp} /> {reporte.numeroLikes ?? 0} Me gusta</button>
      </div>

      <div className="detalle-meta">
        <div className="detalle-meta-item"><span className="detalle-etiqueta"><FontAwesomeIcon icon={faTag} />Categoría</span><span className="detalle-meta-valor">{reporte.categoria}</span></div>
        <div className="detalle-meta-item"><span className="detalle-etiqueta"><FontAwesomeIcon icon={faLocationDot} />Ubicación</span><span className="detalle-meta-valor">{reporte.ubicacion ?? reporte.espacio}</span></div>
        <div className="detalle-meta-item"><span className="detalle-etiqueta"><FontAwesomeIcon icon={faUser} />Reportado por</span><span className="detalle-meta-valor detalle-reportante"><strong>{reporte.usuarioReporta}</strong>{reporte.correoUsuarioReporta && <a href={`mailto:${reporte.correoUsuarioReporta}`}><FontAwesomeIcon icon={faEnvelope} />{reporte.correoUsuarioReporta}</a>}</span></div>
        <div className="detalle-meta-item"><span className="detalle-etiqueta"><FontAwesomeIcon icon={faGraduationCap} />Carrera</span><span className="detalle-meta-valor">{reporte.carreraUsuarioReporta ?? 'Sin carrera asignada'}</span></div>
        <div className="detalle-meta-item"><span className="detalle-etiqueta"><FontAwesomeIcon icon={faUserGear} />Gestor asignado</span><span className="detalle-meta-valor">{reporte.gestorAsignado ?? 'Sin asignar'}</span></div>
      </div>

      <p className="detalle-fecha">{fechaLocal(reporte.fechaCreacion)}</p>
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
                <strong>{h.estado}</strong> — {h.usuario} ({fechaLocal(h.fechaCambio)} · <time dateTime={fechaUtc(h.fechaCambio)} title={fechaLocal(h.fechaCambio)}>{tiempoRelativo(h.fechaCambio)}</time>)
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
      {comentarios.length > 5 && <div className="comentarios-controles"><select value={ordenComentarios} onChange={(e) => setOrdenComentarios(e.target.value)}><option value="recientes">Más recientes</option><option value="populares">Más populares</option></select></div>}
      {comentarios.length === 0 ? (
        <p>Sin comentarios todavía.</p>
      ) : (
        <ul className="comentarios-lista">
          {hilosVisibles.map((hilo) => <ComentarioHilo key={hilo.idComentario} nodo={hilo} hilosContraidos={hilosContraidos} alternarHilo={alternarHilo} respondiendoA={respondiendoA} responder={setRespondiendoA} darLike={darLikeComentario} fechaLocal={fechaLocal} formularioRespuesta={() => formularioComentario(true)} />)}
        </ul>
      )}
      {comentarios.length > 5 && <div className="comentarios-paginacion">{comentariosVisibles < comentarios.length ? <button type="button" onClick={() => setComentariosVisibles(comentarios.length)}>Ver más comentarios</button> : <button type="button" onClick={() => setComentariosVisibles(5)}>Ver menos comentarios</button>}</div>}
      {!respondiendoA && formularioComentario()}
    </div>
  );

  // --- Layout CON imágenes: imagen protagonista + panel lateral ---
  if (tieneImagenes) {
    return (
      <div>
        <Link to="/" className="detalle-volver"><FontAwesomeIcon icon={faArrowLeft} /> Volver al feed</Link>

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
        {lightboxAbierto && createPortal(
          <div className="lightbox-overlay" onClick={() => setLightboxAbierto(false)} role="dialog" aria-modal="true" aria-label={`Vista ampliada de la imagen ${imagenActiva + 1}`}>
            <div className="lightbox-dialog ui-entrada" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-cerrar" type="button" onClick={() => setLightboxAbierto(false)} aria-label="Cerrar imagen ampliada">
              ✕
            </button>

            {imagenes.length > 1 && (
              <button
                className="lightbox-flecha izq"
                type="button"
                onClick={() => { imagenAnterior(); setZoomActivo(false); }}
                aria-label="Imagen anterior"
              >
                ‹
              </button>
            )}

            <div className="lightbox-imagen-wrap">
              <img
                src={imagenes[imagenActiva]}
                alt={`Imagen ${imagenActiva + 1}`}
                className={zoomActivo ? 'zoom' : ''}
                onClick={() => setZoomActivo((z) => !z)}
              />
            </div>
          
            {imagenes.length > 1 && <>
              <span className="lightbox-contador">{imagenActiva + 1} / {imagenes.length}</span>
              <button
                className="lightbox-flecha der"
                type="button"
                onClick={() => { imagenSiguiente(); setZoomActivo(false); }}
                aria-label="Imagen siguiente"
              >
                ›
              </button>
            </>}
            </div>
          </div>
        , document.body)}
      </div>
    );
  }

  // --- Layout SIN imágenes: una columna, tarjetas apiladas (como ya lo teníamos) ---
  return (
    <div>
      <Link to="/" className="detalle-volver"><FontAwesomeIcon icon={faArrowLeft} /> Volver al feed</Link>

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
