import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useUser } from '../context/UserContext';
import { getAccessToken } from '../auth/getToken';
import { getTodosLosReportes } from '../api/reportesApi';
import './GestionPage.css';

function slugTexto(texto = '') {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

function GestionPage() {
  const { instance, accounts } = useMsal();
  const { usuario } = useUser();

  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const esGestorOAdmin =
    usuario?.rol === 'Gestor' || usuario?.rol === 'Administrador';

  const cargarReportes = useCallback(async () => {
    try {
      setCargando(true);
      const token = await getAccessToken(instance, accounts);
      const data = await getTodosLosReportes(token);
      setReportes(data);
    } catch (err) {
      console.error('Error cargando reportes:', err);
      setError('No se pudieron cargar los reportes. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  }, [accounts, instance]);

  useEffect(() => {
    cargarReportes();
  }, [cargarReportes]);

  const estados = useMemo(
    () => [...new Set(reportes.map((reporte) => reporte.estado))],
    [reportes]
  );

  const categorias = useMemo(
    () => [...new Set(reportes.map((reporte) => reporte.categoria))],
    [reportes]
  );

  const resumen = useMemo(() => {
    const contarEstados = (estadosBuscados) =>
      reportes.filter((reporte) =>
        estadosBuscados.includes(slugTexto(reporte.estado))
      ).length;

    return {
      total: reportes.length,
      pendientes: contarEstados(['pendiente']),
      enProceso: contarEstados(['en-proceso', 'en-revision']),
      resueltos: contarEstados(['resuelto', 'cerrado']),
    };
  }, [reportes]);

  const reportesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return reportes.filter((reporte) => {
      const coincideBusqueda =
        !termino ||
        reporte.titulo.toLowerCase().includes(termino) ||
        reporte.espacio.toLowerCase().includes(termino) ||
        reporte.usuarioReporta.toLowerCase().includes(termino) ||
        (reporte.gestorAsignado ?? '').toLowerCase().includes(termino);

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

  if (!esGestorOAdmin) {
    return (
      <div className="gestion-sin-permiso">
        <h2>Acceso restringido</h2>
        <p>Esta sección está disponible únicamente para gestores y administradores.</p>
        <Link to="/">Volver al feed</Link>
      </div>
    );
  }

  if (cargando) {
    return <p className="gestion-estado-pagina">Cargando reportes...</p>;
  }

  if (error) {
    return (
      <div className="gestion-mensaje-error">
        <p>{error}</p>
        <button type="button" onClick={cargarReportes}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="gestion-page">
      <div className="gestion-encabezado">
        <div>
          <p className="gestion-etiqueta">Panel administrativo</p>
          <h2>Gestión de reportes</h2>
          <p>Consulta, filtra y da seguimiento a las incidencias de UNAH-VS.</p>
        </div>

        <button
          className="gestion-recargar"
          type="button"
          onClick={cargarReportes}
        >
          Actualizar lista
        </button>
      </div>

      <section className="gestion-resumen" aria-label="Resumen de reportes">
        <div className="gestion-resumen-tarjeta">
          <span className="gestion-resumen-label">Total</span>
          <strong>{resumen.total}</strong>
          <small>Reportes registrados</small>
        </div>

        <div className="gestion-resumen-tarjeta pendiente">
          <span className="gestion-resumen-label">Pendientes</span>
          <strong>{resumen.pendientes}</strong>
          <small>Requieren atención</small>
        </div>

        <div className="gestion-resumen-tarjeta proceso">
          <span className="gestion-resumen-label">En seguimiento</span>
          <strong>{resumen.enProceso}</strong>
          <small>En revisión o proceso</small>
        </div>

        <div className="gestion-resumen-tarjeta resuelto">
          <span className="gestion-resumen-label">Resueltos</span>
          <strong>{resumen.resueltos}</strong>
          <small>Finalizados o cerrados</small>
        </div>
      </section>

      <section className="gestion-listado">
        <div className="gestion-listado-cabecera">
          <div>
            <h3>Reportes</h3>
            <p>
              Mostrando {reportesFiltrados.length} de {reportes.length} reporte(s)
            </p>
          </div>

          <label className="gestion-busqueda">
            <span>Buscar</span>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Título, espacio o responsable..."
            />
          </label>
        </div>

        <div className="gestion-filtros">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
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
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>

          <button className="gestion-limpiar" type="button" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>

        {reportesFiltrados.length === 0 ? (
          <div className="gestion-vacio">
            <h3>No hay reportes que coincidan</h3>
            <p>Prueba cambiando o limpiando los filtros seleccionados.</p>
            <button type="button" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="gestion-tabla-contenedor">
            <table className="gestion-tabla">
              <thead>
                <tr>
                  <th>Reporte</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Reportado por</th>
                  <th>Gestor</th>
                  <th>Fecha</th>
                </tr>
              </thead>

              <tbody>
                {reportesFiltrados.map((reporte) => (
                  <tr key={reporte.idReporte}>
                    <td data-label="Reporte">
                      <Link
                        className="gestion-reporte-enlace"
                        to={`/reporte/${reporte.idReporte}`}
                      >
                        <strong>{reporte.titulo}</strong>
                        <span>{reporte.categoria} · {reporte.espacio}</span>
                      </Link>
                    </td>

                    <td data-label="Prioridad">
                      <span className={`gestion-badge prioridad-${slugTexto(reporte.prioridad)}`}>
                        {reporte.prioridad}
                      </span>
                    </td>

                    <td data-label="Estado">
                      <span className={`gestion-badge estado-${slugTexto(reporte.estado)}`}>
                        {reporte.estado}
                      </span>
                    </td>

                    <td data-label="Reportado por">{reporte.usuarioReporta}</td>

                    <td data-label="Gestor">
                      {reporte.gestorAsignado ?? (
                        <span className="gestion-sin-asignar">Sin asignar</span>
                      )}
                    </td>

                    <td data-label="Fecha">
                      {new Date(reporte.fechaCreacion).toLocaleDateString('es-HN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default GestionPage;
