import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useUser } from '../context/UserContext';
import { getAccessToken } from '../auth/getToken';
import { getFeed } from '../api/reportesApi';
import { ordenarAlfabeticamente } from '../utils/ordenarAlfabeticamente';
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

    return reportes.filter((reporte) => {
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
      );
    });
  }, [reportes, busqueda, filtroEstado, filtroPrioridad, filtroCategoria]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('');
    setFiltroPrioridad('');
    setFiltroCategoria('');
  };

  const cerrarConfirmacion = () => {
    setSearchParams({});
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
          <p>Los reportes relevantes para tu carrera aparecen primero.</p>
        </div>

        <Link to="/crear-reporte" className="feed-crear-boton">
          Crear reporte
        </Link>
      </div>

      {reporteCreado && (
        <div className="feed-confirmacion" role="status">
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
              <div className="reporte-card-top">
                {reporte.esRelevante && (
                  <span className="badge badge-relevante">Relevante</span>
                )}

                <span className={`badge badge-prioridad-${slugTexto(reporte.prioridad)}`}>
                  {reporte.prioridad}
                </span>
              </div>

              <h3>{reporte.titulo}</h3>
              <p>{reporte.espacio}</p>

              <div className="reporte-card-footer">
                <span>{reporte.categoria}</span>
                <span className={`badge badge-estado-${slugTexto(reporte.estado)}`}>
                  {reporte.estado}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default FeedPage;
