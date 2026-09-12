import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { getAccessToken } from '../auth/getToken';
import { getResumenDashboard } from '../api/dashboardApi';
import './DashboardPage.css';

function formatNumero(valor) {
  return new Intl.NumberFormat('es-HN').format(valor ?? 0);
}

function formatDia(fecha) {
  return new Intl.DateTimeFormat('es-HN', { day: 'numeric', month: 'short' })
    .format(new Date(`${fecha}T00:00:00`));
}

function Barras({ titulo, datos, limite = 6, colorido = false }) {
  const visibles = datos.slice(0, limite);
  const maximo = Math.max(...visibles.map((dato) => dato.valor), 1);

  return (
    <section className="dashboard-panel" aria-label={titulo}>
      <h3>{titulo}</h3>
      {visibles.length === 0 ? <p className="dashboard-vacio">No hay datos para este periodo.</p> : (
        <div className="dashboard-barras">
          {visibles.map((dato, indice) => (
            <div className="dashboard-barra-fila" key={dato.etiqueta} title={`${dato.etiqueta}: ${dato.valor}`}>
              <span className="dashboard-barra-etiqueta">{dato.etiqueta}</span>
              <div className="dashboard-barra-pista" aria-hidden="true">
                <span className={`dashboard-barra-relleno ${colorido ? `serie-${indice % 5}` : ''}`} style={{ width: `${(dato.valor / maximo) * 100}%` }} />
              </div>
              <strong>{formatNumero(dato.valor)}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Dona({ datos }) {
  const visibles = datos.slice(0, 6);
  const total = visibles.reduce((suma, dato) => suma + dato.valor, 0);
  if (!total) return <p className="dashboard-vacio">No hay datos para este periodo.</p>;
  let acumulado = 0;
  const segmentos = visibles.map((dato, indice) => {
    const inicio = (acumulado / total) * 100;
    acumulado += dato.valor;
    return `var(--dashboard-serie-${indice % 5}) ${inicio}% ${(acumulado / total) * 100}%`;
  });
  return <div className="dashboard-dona-contenido"><div className="dashboard-dona" style={{ background: `conic-gradient(${segmentos.join(', ')})` }} aria-label="Distribución por categoría" role="img"><span>{total}<small>reportes</small></span></div><ul className="dashboard-leyenda">{visibles.map((dato, indice) => <li key={dato.etiqueta}><i className={`serie-${indice % 5}`} />{dato.etiqueta}<strong>{dato.valor}</strong></li>)}</ul></div>;
}

function Tendencia({ datos }) {
  const { puntos, maximo, guiasHorizontales, guiasVerticales } = useMemo(() => {
    const max = Math.max(...datos.map((dato) => dato.valor), 1);
    const ancho = 600;
    const alto = 220;
    const margenX = 36;
    const margenY = 24;
    const espacio = Math.max(ancho - margenX * 2, 1);
    const puntosCalculados = datos.map((dato, indice) => ({
      ...dato,
      x: datos.length === 1 ? ancho / 2 : margenX + (indice * espacio) / (datos.length - 1),
      y: alto - margenY - (dato.valor / max) * (alto - margenY * 2),
    }));
    const indicesEtiquetas = [...new Set([0, ...Array.from({ length: Math.min(datos.length, 6) }, (_, indice) => Math.round((indice * (datos.length - 1)) / Math.max(Math.min(datos.length, 6) - 1, 1))), datos.length - 1])];
    return {
      puntos: puntosCalculados,
      maximo: max,
      guiasHorizontales: Array.from({ length: 5 }, (_, indice) => ({ valor: Math.round((max * indice) / 4), y: alto - margenY - (indice * (alto - margenY * 2)) / 4 })),
      guiasVerticales: indicesEtiquetas.map((indice) => puntosCalculados[indice]),
    };
  }, [datos]);

  if (datos.length === 0) return <p className="dashboard-vacio">No hay reportes en el periodo seleccionado.</p>;

  const polilinea = puntos.map((punto) => `${punto.x},${punto.y}`).join(' ');
  return (
    <svg className="dashboard-linea" viewBox="0 0 600 220" role="img" aria-label={`Tendencia diaria; máximo ${maximo} reportes`}>
      <title>Tendencia diaria de reportes</title>
      <g className="dashboard-grid" aria-hidden="true">
        {guiasHorizontales.map((guia) => <g key={guia.y}><line x1="36" y1={guia.y} x2="564" y2={guia.y} /><text x="28" y={guia.y + 4} textAnchor="end">{guia.valor}</text></g>)}
        {guiasVerticales.map((punto) => <line key={punto.fecha} x1={punto.x} y1="24" x2={punto.x} y2="196" />)}
      </g>
      <polyline points={polilinea} className="dashboard-linea-trazo" />
      {puntos.map((punto) => (
        <g key={punto.fecha}>
          <circle cx={punto.x} cy={punto.y} r="5" className="dashboard-linea-punto"><title>{`${formatDia(punto.fecha)}: ${punto.valor} reportes`}</title></circle>
          {datos.length <= 31 && <text x={punto.x} y={Math.max(punto.y - 10, 14)} textAnchor="middle">{punto.valor}</text>}
        </g>
      ))}
      {guiasVerticales.map((punto) => <text key={punto.fecha} x={punto.x} y="214" textAnchor="middle">{formatDia(punto.fecha)}</text>)}
    </svg>
  );
}

function DashboardPage() {
  const { instance, accounts } = useMsal();
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const hoy = new Date().toISOString().slice(0, 10);
  const inicioPredeterminado = new Date(new Date().setMonth(new Date().getMonth() - 5)).toISOString().slice(0, 10);
  const [fechaDesde, setFechaDesde] = useState(inicioPredeterminado);
  const [fechaHasta, setFechaHasta] = useState(hoy);
  const [vista, setVista] = useState('resumen');

  const cargarResumen = useCallback(async () => {
    try {
      setCargando(true);
      setError('');
      const token = await getAccessToken(instance, accounts);
      setResumen(await getResumenDashboard(token, fechaDesde, fechaHasta));
    } catch (err) {
      console.error('Error cargando dashboard:', err);
      setError(err.response?.data || 'No se pudo cargar el dashboard. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  }, [accounts, fechaDesde, fechaHasta, instance]);

  useEffect(() => {
    cargarResumen();
    const intervalo = window.setInterval(cargarResumen, 30000);
    return () => window.clearInterval(intervalo);
  }, [cargarResumen]);

  const metricas = resumen && [
    ['Reportes totales', resumen.totalReportes, 'En el periodo seleccionado'],
    ['Abiertos', resumen.reportesAbiertos, 'Requieren seguimiento'],
    ['Resueltos', resumen.reportesCerrados, 'Atendidos satisfactoriamente'],
    ['Alta prioridad', resumen.reportesAltaPrioridad, 'Atención prioritaria'],
  ];

  const cambiarVista = (nuevaVista) => {
    setVista(nuevaVista);
    window.scrollTo(0, 0);
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-encabezado">
        <div>
          <p className="dashboard-etiqueta">Panel de análisis</p>
          <h2>Dashboard de reportes</h2>
          <p>Indicadores operativos de incidencias en UNAH Valle de Sula. Se actualiza automáticamente cada 30 segundos.</p>
        </div>
        <div className="dashboard-filtros">
          <label>Desde<input type="date" value={fechaDesde} max={fechaHasta} onChange={(e) => setFechaDesde(e.target.value)} /></label>
          <label>Hasta<input type="date" value={fechaHasta} min={fechaDesde} max={hoy} onChange={(e) => setFechaHasta(e.target.value)} /></label>
          <button type="button" onClick={cargarResumen} disabled={cargando}>Actualizar</button>
        </div>
      </header>

      {cargando && <p className="dashboard-estado">Actualizando indicadores...</p>}
      {error && <div className="dashboard-error" role="alert">{error}</div>}
      {!cargando && resumen && <>
        <section className="dashboard-metricas" aria-label="Indicadores principales">
          {metricas.map(([titulo, valor, detalle]) => <article className="dashboard-metrica" key={titulo}><span>{titulo}</span><strong>{formatNumero(valor)}</strong><small>{detalle}</small></article>)}
        </section>

        <nav className="dashboard-pestanas" aria-label="Secciones del dashboard">
          <button type="button" className={vista === 'resumen' ? 'activa' : ''} onClick={() => cambiarVista('resumen')}>Resumen</button>
          <button type="button" className={vista === 'operacion' ? 'activa' : ''} onClick={() => cambiarVista('operacion')}>Operación</button>
          <button type="button" className={vista === 'infraestructura' ? 'activa' : ''} onClick={() => cambiarVista('infraestructura')}>Infraestructura</button>
        </nav>

        {vista === 'resumen' && <>
        <section className="dashboard-panel dashboard-tendencia-panel">
          <div><h3>Tendencia de reportes</h3><p>Reportes creados por día.</p></div>
          <Tendencia datos={resumen.tendenciaDiaria} />
        </section>

        <section className="dashboard-cuadricula">
          <Barras titulo="Reportes por estado" datos={resumen.porEstado} colorido />
          <Barras titulo="Reportes por prioridad" datos={resumen.porPrioridad} colorido />
          <section className="dashboard-panel" aria-label="Distribución por categoría"><h3>Distribución por categoría</h3><Dona datos={resumen.porCategoria} /></section>
          <Barras titulo="Categorías más reportadas" datos={resumen.porCategoria} colorido />
        </section>
        </>}

        {vista === 'operacion' && <>
        <section className="dashboard-operacion" aria-label="Métricas de operación">
          <article><span>Sin gestor asignado</span><strong>{formatNumero(resumen.reportesSinGestor)}</strong></article>
          <article><span>Tiempo promedio de resolución</span><strong>{resumen.tiempoPromedioResolucionHoras == null ? 'Sin datos' : `${resumen.tiempoPromedioResolucionHoras} h`}</strong></article>
          <article><span>Cumplimiento de SLA 72 h</span><strong>{resumen.cumplimientoSla72Horas == null ? 'Sin datos' : `${resumen.cumplimientoSla72Horas}%`}</strong></article>
        </section>
        <section className="dashboard-cuadricula dashboard-seccion-superior">
          <Barras titulo="Reportes abiertos por gestor" datos={resumen.porGestor} colorido />
          <Barras titulo="Cambios de estado por responsable" datos={resumen.cambiosPorResponsable} colorido />
        </section>
        <section className="dashboard-panel dashboard-tabla-panel"><h3>Matriz de operación</h3><p>Combinaciones con mayor volumen de reportes.</p><div className="dashboard-tabla-wrap"><table><thead><tr><th>Gestor</th><th>Categoría</th><th>Estado</th><th>Reportes</th></tr></thead><tbody>{resumen.matrizOperacion.map((fila) => <tr key={`${fila.gestor}-${fila.categoria}-${fila.estado}`}><td>{fila.gestor}</td><td>{fila.categoria}</td><td>{fila.estado}</td><td>{fila.valor}</td></tr>)}</tbody></table></div></section>
        </>}

        {vista === 'infraestructura' && <>
        <section className="dashboard-cuadricula">
          <Barras titulo="Incidencias por edificio" datos={resumen.porEdificio} colorido />
          <Barras titulo="Espacios con más reportes" datos={resumen.porEspacio} colorido />
          <Barras titulo="Reportes por carrera" datos={resumen.porCarrera} colorido />
          <Barras titulo="Reportes por tipo de espacio" datos={resumen.porTipoEspacio} colorido />
        </section>
        <section className="dashboard-panel dashboard-tabla-panel"><h3>Reportes recientes</h3><div className="dashboard-tabla-wrap"><table><thead><tr><th>Reporte</th><th>Ubicación</th><th>Categoría</th><th>Prioridad</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>{resumen.reportesRecientes.map((reporte) => <tr key={reporte.idReporte}><td><Link to={`/reporte/${reporte.idReporte}`}>{reporte.titulo}</Link></td><td>{reporte.edificio} · {reporte.espacio}</td><td>{reporte.categoria}</td><td>{reporte.prioridad}</td><td>{reporte.estado}</td><td>{new Date(reporte.fechaCreacion).toLocaleDateString('es-HN')}</td></tr>)}</tbody></table></div></section>
        </>}
      </>}
    </div>
  );
}

export default DashboardPage;
