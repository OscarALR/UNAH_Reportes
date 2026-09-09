import { useCallback, useEffect, useState } from 'react';
import { Navigate, NavLink } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { getAccessToken } from '../auth/getToken';
import {
  actualizarCarrera,
  crearCarrera,
  eliminarCarrera,
  getCarrerasAdministracion,
} from '../api/administracionApi';
import { useUser } from '../context/UserContext';
import './AdministracionCategoriasPage.css';

function AdministracionCarrerasPage() {
  const { instance, accounts } = useMsal();
  const { usuario } = useUser();
  const [carreras, setCarreras] = useState([]);
  const [nombreCarrera, setNombreCarrera] = useState('');
  const [carreraEditando, setCarreraEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cargarCarreras = useCallback(async () => {
    try {
      setCargando(true);
      const token = await getAccessToken(instance, accounts);
      setCarreras(await getCarrerasAdministracion(token));
    } catch (error) {
      console.error('Error cargando carreras:', error);
      setMensaje({ tipo: 'error', texto: 'No se pudieron cargar las carreras.' });
    } finally {
      setCargando(false);
    }
  }, [accounts, instance]);

  useEffect(() => {
    if (usuario?.rol === 'Administrador') cargarCarreras();
  }, [cargarCarreras, usuario?.rol]);

  if (usuario?.rol !== 'Administrador') return <Navigate to="/" replace />;

  const limpiarFormulario = () => {
    setNombreCarrera('');
    setCarreraEditando(null);
  };

  const guardarCarrera = async (evento) => {
    evento.preventDefault();
    const nombre = nombreCarrera.trim();
    if (!nombre) return;

    try {
      setGuardando(true);
      setMensaje(null);
      const token = await getAccessToken(instance, accounts);
      if (carreraEditando) {
        await actualizarCarrera(carreraEditando, nombre, token);
        setMensaje({ tipo: 'exito', texto: 'Carrera actualizada.' });
      } else {
        await crearCarrera(nombre, token);
        setMensaje({ tipo: 'exito', texto: 'Carrera creada.' });
      }
      limpiarFormulario();
      await cargarCarreras();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data || 'No se pudo guardar la carrera.' });
    } finally {
      setGuardando(false);
    }
  };

  const editarCarrera = (carrera) => {
    setCarreraEditando(carrera.idCarrera);
    setNombreCarrera(carrera.nombreCarrera);
    setMensaje(null);
  };

  const borrarCarrera = async (carrera) => {
    if (!window.confirm(`¿Eliminar la carrera "${carrera.nombreCarrera}"?`)) return;
    try {
      const token = await getAccessToken(instance, accounts);
      await eliminarCarrera(carrera.idCarrera, token);
      setMensaje({ tipo: 'exito', texto: 'Carrera eliminada.' });
      await cargarCarreras();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data || 'No se pudo eliminar la carrera.' });
    }
  };

  return (
    <section className="administracion-page">
      <header className="administracion-header">
        <p>Administración</p>
        <h2>Carreras</h2>
        <span>Gestiona las carreras de los usuarios y sus relaciones.</span>
        <nav className="administracion-subnav">
          <NavLink to="/administracion/categorias">Categorías</NavLink>
          <NavLink to="/administracion/carreras">Carreras</NavLink>
          <NavLink to="/administracion/edificios">Edificios</NavLink>
          <NavLink to="/administracion/tipos-espacio">Tipos de espacio</NavLink>
          <NavLink to="/administracion/espacios">Espacios</NavLink>
          <NavLink to="/administracion/estados">Estados</NavLink>
          <NavLink to="/administracion/usuarios">Usuarios</NavLink>
        </nav>
      </header>
      <div className="administracion-grid">
        <form className="administracion-formulario" onSubmit={guardarCarrera}>
          <h3>{carreraEditando ? 'Editar carrera' : 'Nueva carrera'}</h3>
          <label htmlFor="nombreCarrera">Nombre</label>
          <input id="nombreCarrera" value={nombreCarrera} onChange={(e) => setNombreCarrera(e.target.value)} maxLength={150} placeholder="Ej. Ingeniería en Sistemas" required />
          <div className="administracion-acciones">
            <button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : carreraEditando ? 'Guardar cambios' : 'Crear carrera'}</button>
            {carreraEditando && <button type="button" className="secundario" onClick={limpiarFormulario}>Cancelar</button>}
          </div>
          {mensaje && <p className={`administracion-mensaje ${mensaje.tipo}`}>{mensaje.texto}</p>}
        </form>
        <div className="administracion-listado">
          <h3>Carreras registradas</h3>
          {cargando ? <p>Cargando carreras...</p> : carreras.length === 0 ? <p>No hay carreras registradas.</p> : (
            <ul>{carreras.map((carrera) => <li key={carrera.idCarrera}><span>{carrera.nombreCarrera}</span><div><button type="button" className="secundario" onClick={() => editarCarrera(carrera)}>Editar</button><button type="button" className="peligro" onClick={() => borrarCarrera(carrera)}>Eliminar</button></div></li>)}</ul>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdministracionCarrerasPage;
