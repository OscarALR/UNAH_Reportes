import { useCallback, useEffect, useState } from 'react';
import { Navigate, NavLink } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { getAccessToken } from '../auth/getToken';
import {
  actualizarEstado,
  crearEstado,
  eliminarEstado,
  getEstadosAdministracion,
} from '../api/administracionApi';
import { useUser } from '../context/UserContext';
import './AdministracionCategoriasPage.css';

function AdministracionEstadosPage() {
  const { instance, accounts } = useMsal();
  const { usuario } = useUser();
  const [estados, setEstados] = useState([]);
  const [nombreEstado, setNombreEstado] = useState('');
  const [estadoEditando, setEstadoEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cargarEstados = useCallback(async () => {
    try {
      setCargando(true);
      const token = await getAccessToken(instance, accounts);
      setEstados(await getEstadosAdministracion(token));
    } catch (error) {
      console.error('Error cargando estados:', error);
      setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los estados.' });
    } finally {
      setCargando(false);
    }
  }, [accounts, instance]);

  useEffect(() => {
    if (usuario?.rol === 'Administrador') cargarEstados();
  }, [cargarEstados, usuario?.rol]);

  if (usuario?.rol !== 'Administrador') return <Navigate to="/" replace />;

  const limpiarFormulario = () => {
    setNombreEstado('');
    setEstadoEditando(null);
  };

  const guardarEstado = async (evento) => {
    evento.preventDefault();
    const nombre = nombreEstado.trim();
    if (!nombre) return;

    try {
      setGuardando(true);
      setMensaje(null);
      const token = await getAccessToken(instance, accounts);
      if (estadoEditando) {
        await actualizarEstado(estadoEditando, nombre, token);
        setMensaje({ tipo: 'exito', texto: 'Estado actualizado.' });
      } else {
        await crearEstado(nombre, token);
        setMensaje({ tipo: 'exito', texto: 'Estado creado.' });
      }
      limpiarFormulario();
      await cargarEstados();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data || 'No se pudo guardar el estado.' });
    } finally {
      setGuardando(false);
    }
  };

  const editarEstado = (estado) => {
    setEstadoEditando(estado.idEstado);
    setNombreEstado(estado.nombreEstado);
    setMensaje(null);
  };

  const borrarEstado = async (estado) => {
    if (!window.confirm(`¿Eliminar el estado "${estado.nombreEstado}"?`)) return;
    try {
      const token = await getAccessToken(instance, accounts);
      await eliminarEstado(estado.idEstado, token);
      setMensaje({ tipo: 'exito', texto: 'Estado eliminado.' });
      await cargarEstados();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data || 'No se pudo eliminar el estado.' });
    }
  };

  return (
    <section className="administracion-page">
      <header className="administracion-header">
        <p>Administración</p>
        <h2>Estados de reportes</h2>
        <span>Gestiona los estados disponibles para el seguimiento de reportes.</span>
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
        <form className="administracion-formulario" onSubmit={guardarEstado}>
          <h3>{estadoEditando ? 'Editar estado' : 'Nuevo estado'}</h3>
          <label htmlFor="nombreEstado">Nombre</label>
          <input id="nombreEstado" value={nombreEstado} onChange={(e) => setNombreEstado(e.target.value)} maxLength={50} placeholder="Ej. En proceso" required />
          <div className="administracion-acciones">
            <button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : estadoEditando ? 'Guardar cambios' : 'Crear estado'}</button>
            {estadoEditando && <button type="button" className="secundario" onClick={limpiarFormulario}>Cancelar</button>}
          </div>
          {mensaje && <p className={`administracion-mensaje ${mensaje.tipo}`}>{mensaje.texto}</p>}
        </form>
        <div className="administracion-listado">
          <h3>Estados registrados</h3>
          {cargando ? <p>Cargando estados...</p> : estados.length === 0 ? <p>No hay estados registrados.</p> : (
            <ul>{estados.map((estado) => <li key={estado.idEstado}><span>{estado.nombreEstado}</span><div><button type="button" className="secundario" onClick={() => editarEstado(estado)}>Editar</button><button type="button" className="peligro" onClick={() => borrarEstado(estado)}>Eliminar</button></div></li>)}</ul>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdministracionEstadosPage;
