import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useUser } from '../context/UserContext';
import { getAccessToken } from '../auth/getToken';
import { getMisReportes, getReportesArchivados } from '../api/reportesApi';
import './ColeccionReportesPage.css';

function claseEstado(estado = '') {
  return `estado-${estado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}`;
}

function ColeccionReportesPage({ tipo }) {
  const { instance, accounts } = useMsal();
  const { usuario } = useUser();
  const { pathname } = useLocation();
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState(tipo === 'mios' ? '' : 'todos');
  const [alcance, setAlcance] = useState('mios');
  const esMios = tipo === 'mios';

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const token = await getAccessToken(instance, accounts);
      setReportes(esMios ? await getMisReportes(token) : await getReportesArchivados(filtro === 'todos' ? null : filtro, alcance, token));
    } finally { setCargando(false); }
  }, [accounts, alcance, esMios, filtro, instance]);

  useEffect(() => { cargar(); }, [cargar, pathname]);
  const filtrados = useMemo(() => reportes.filter((reporte) => `${reporte.titulo} ${reporte.descripcion} ${reporte.espacio} ${reporte.estado}`.toLowerCase().includes(busqueda.toLowerCase())), [busqueda, reportes]);

  return <div className="coleccion-page">
    <header><div><p>{esMios ? 'Seguimiento personal' : alcance === 'mios' ? 'Historial personal' : 'Historial de tu carrera'}</p><h2>{esMios ? 'Mis reportes' : alcance === 'mios' ? 'Mis reportes archivados' : 'Reportes archivados por carrera'}</h2><span>{esMios ? 'Encuentra todas las incidencias que has registrado.' : alcance === 'mios' ? 'Consulta tus reportes resueltos o archivados.' : 'Consulta los reportes archivados vinculados a tu carrera.'}</span></div>{!esMios && <div className="coleccion-selectores"><select value={alcance} onChange={(e) => setAlcance(e.target.value)}><option value="mios">Mis archivados</option>{usuario?.carrera && <option value="carrera">Por mi carrera</option>}</select><select value={filtro} onChange={(e) => setFiltro(e.target.value)}><option value="todos">Todos</option><option value="resueltos">Resueltos</option><option value="eliminados">Archivados por gestión</option></select></div>}</header>
    <div className="coleccion-herramientas"><input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por título, estado o espacio" /><button type="button" onClick={cargar}>Actualizar</button></div>
    {cargando ? <p>Cargando reportes...</p> : filtrados.length === 0 ? <div className="coleccion-vacio">No hay reportes para mostrar.</div> : <div className="coleccion-lista">{filtrados.map((reporte) => <Link to={`/reporte/${reporte.idReporte}`} key={reporte.idReporte} className="coleccion-item"><div><div className="coleccion-etiquetas"><span className={claseEstado(reporte.estado)}>{reporte.estado}</span>{reporte.eliminado && <span className="eliminado">Archivado</span>}</div><h3>{reporte.titulo}</h3><p>{reporte.categoria} · {reporte.espacio}</p>{reporte.eliminado && <small>Motivo: {reporte.motivoEliminacion}</small>}</div><time>{new Date(reporte.fechaEliminacion ?? reporte.fechaCreacion).toLocaleDateString('es-HN')}</time></Link>)}</div>}
  </div>;
}

export default ColeccionReportesPage;
