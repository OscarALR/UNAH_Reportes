import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp } from '@fortawesome/free-solid-svg-icons';
import { useMsal } from '@azure/msal-react';
import { useUser } from '../context/UserContext';
import { getAccessToken } from '../auth/getToken';
import { alternarLikeReporte, getFeed } from '../api/reportesApi';
import { ordenarAlfabeticamente } from '../utils/ordenarAlfabeticamente';
import reporteSinImagen from '../assets/reporte-sin-imagen.svg';
import './FeedPage.css';

function slugTexto(texto = '') {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

function FeedPage() {
  const { instance, accounts } = useMsal();
  const { usuario } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();

  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [vistaFeed, setVistaFeed] = useState('todos');

  const idUsuario = usuario?.idUsuario;
  const reporteCreado = searchParams.get('creado') === '1';

  const cargarFeed = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);

      const token = await getAccessToken(instance, accounts);
      const data = await getFeed(idUsuario, token);
      setReportes(data);
    } catch (err) {
      console.error('Error cargando el feed:', err);
      setError('No se pudo cargar el feed de reportes.');
    } finally {
      setCargando(false);
    }
  }, [accounts, idUsuario, instance]);

  useEffect(() => {
    if (idUsuario) {
      cargarFeed();
    }
  }, [cargarFeed, idUsuario]);

  const estados = useMemo(
    () => ordenarAlfabeticamente([...new Set(reportes.map((reporte) => reporte.estado))]),
    [reportes]
  );

  const categorias = useMemo(
    () => ordenarAlfabeticamente([...new Set(reportes.map((reporte) => reporte.categoria))]),
    [reportes]
  );

  const reportesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    const filtrados = reportes.filter((reporte) => {
      const coincideBusqueda =
        !termino ||
        reporte.titulo.toLowerCase().includes(termino) ||
        reporte.descripcion.toLowerCase().includes(termino) ||
        reporte.espacio.toLowerCase().includes(termino);

      return (
        coincideBusqueda &&
        (!filtroEstado || reporte.estado === filtroEstado) &&
        (!filtroPrioridad || reporte.prioridad === filtroPrioridad) &&
        (!filtroCategoria || reporte.categoria === filtroCategoria)
        && (vistaFeed === 'todos' || (vistaFeed === 'populares' && reporte.numeroLikes > 0) || (vistaFeed === 'carrera' && reporte.esDeMiCarrera) || (vistaFeed === 'otros' && !reporte.esDeMiCarrera))
      );
    });
    return vistaFeed === 'populares'
      ? filtrados.sort((a, b) => b.numeroLikes - a.numeroLikes || new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
      : filtrados;
  }, [reportes, busqueda, filtroEstado, filtroPrioridad, filtroCategoria, vistaFeed]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('');
    setFiltroPrioridad('');
    setFiltroCategoria('');
  };

  const cerrarConfirmacion = () => {
    setSearchParams({});
  };

  const darLike = async (evento, idReporte) => {
    evento.preventDefault();
    evento.stopPropagation();
    try {
      const token = await getAccessToken(instance, accounts);
      const resultado = await alternarLikeReporte(idReporte, token);
      setReportes((actuales) => actuales.map((reporte) => reporte.idReporte === idReporte ? { ...reporte, leGustaUsuarioActual: resultado.leGusta, numeroLikes: resultado.numeroLikes } : reporte));
    } catch (err) { console.error('No se pudo registrar el me gusta:', err); }
  };

  if (cargando) {
    return <p className="feed-estado-pagina">Cargando reportes...</p>;
  }

  if (error) {
    return (
      <div className="feed-error">
        <p>{error}</p>
        <button type="button" onClick={cargarFeed}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="feed-page">
      <div className="feed-header">
        <div>
          <p className="feed-etiqueta">UNAH-VS · Comunidad</p>
          <h2>Feed de reportes</h2>
          <p>Explora los reportes de tu comunidad y apoya los más importantes.</p>
        </div>

        <Link to="/crear-reporte" className="feed-crear-boton">
          Crear reporte
        </Link>
      </div>

      {reporteCreado && (
        <div className="feed-confirmacion ui-entrada" role="status">
          <div>
            <strong>Reporte creado correctamente</strong>
            <span>Tu incidencia ya está disponible para seguimiento.</span>
          </div>
          <button type="button" onClick={cerrarConfirmacion} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      )}

      <section className="feed-herramientas">
        <label className="feed-busqueda">
          <span>Buscar reportes</span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Título, descripción o espacio..."
          />
        </label>

        <div className="feed-filtros">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            {estados.map((estado) => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>

          <select
            value={filtroPrioridad}
            onChange={(e) => setFiltroPrioridad(e.target.value)}
            aria-label="Filtrar por prioridad"
          >
            <option value="">Todas las prioridades</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>{categoria}</option>
            ))}
          </select>

          <button className="feed-limpiar" type="button" onClick={limpiarFiltros}>
            Limpiar
          </button>
        </div>
      </section>

      <div className="feed-vistas" role="group" aria-label="Vista del feed">
        <button type="button" className={vistaFeed === 'todos' ? 'activo' : ''} onClick={() => setVistaFeed('todos')}>Todos</button>
        <button type="button" className={vistaFeed === 'populares' ? 'activo' : ''} onClick={() => setVistaFeed('populares')}>Reportes populares</button>
        <button type="button" className={vistaFeed === 'carrera' ? 'activo' : ''} onClick={() => setVistaFeed('carrera')}>Reportes de mi carrera</button>
        <button type="button" className={vistaFeed === 'otros' ? 'activo' : ''} onClick={() => setVistaFeed('otros')}>Otros</button>
      </div>

      <p className="feed-resultados">
        Mostrando {reportesFiltrados.length} de {reportes.length} reporte(s)
      </p>

      {reportes.length === 0 ? (
        <div className="feed-vacio">
          <div className="feed-vacio-icono">+</div>
          <h3>Aún no hay reportes</h3>
          <p>Cuando detectes una incidencia, crea un reporte para darle seguimiento.</p>
          <Link to="/crear-reporte">Crear el primer reporte</Link>
        </div>
      ) : reportesFiltrados.length === 0 ? (
        <div className="feed-vacio">
          <div className="feed-vacio-icono">0</div>
          <h3>No encontramos coincidencias</h3>
          <p>Prueba con otros términos o elimina los filtros seleccionados.</p>
          <button type="button" onClick={limpiarFiltros}>Limpiar filtros</button>
        </div>
      ) : (
        <div className="feed-grid">
          {reportesFiltrados.map((reporte) => (
            <Link
              key={reporte.idReporte}
              to={`/reporte/${reporte.idReporte}`}
              className="reporte-card"
            >
              <div className="reporte-card-imagen">
                <img src={reporte.imagenPortada || reporteSinImagen} alt={reporte.imagenPortada ? `Imagen del reporte: ${reporte.titulo}` : 'Ilustración de reporte sin fotografías'} onError={(evento) => { evento.currentTarget.onerror = null; evento.currentTarget.src = reporteSinImagen; }} />
                <div className="reporte-card-top">
                  <span className={`badge badge-prioridad-${slugTexto(reporte.prioridad)}`}>{reporte.prioridad}</span>
                  <button type="button" className={`reporte-like ${reporte.leGustaUsuarioActual ? 'activo' : ''}`} onClick={(evento) => darLike(evento, reporte.idReporte)} aria-label="Me gusta"><FontAwesomeIcon icon={faThumbsUp} /> {reporte.numeroLikes}</button>
                </div>
              </div>
              <div className="reporte-card-contenido">
                <h3>{reporte.titulo}</h3>
                <p className="reporte-card-ubicacion"><span>Ubicación</span>{reporte.ubicacion ?? reporte.espacio}</p>
                <span className="reporte-card-carrera">{reporte.carreraUsuarioReporta ?? 'Sin carrera asignada'}</span>
                <div className="reporte-card-footer">
                  <span>{reporte.categoria}</span>
                  <span className={`badge badge-estado-${slugTexto(reporte.estado)}`}>{reporte.estado}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default FeedPage;
