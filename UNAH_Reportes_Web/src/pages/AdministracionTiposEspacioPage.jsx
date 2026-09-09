import { useCallback, useEffect, useState } from 'react';
import { Navigate, NavLink } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { getAccessToken } from '../auth/getToken';
import {
  actualizarTipoEspacio,
  crearTipoEspacio,
  eliminarTipoEspacio,
  getTiposEspacioAdministracion,
} from '../api/administracionApi';
import { useUser } from '../context/UserContext';
import './AdministracionCategoriasPage.css';

function AdministracionTiposEspacioPage() {
  const { instance, accounts } = useMsal();
  const { usuario } = useUser();
  const [tiposEspacio, setTiposEspacio] = useState([]);
  const [nombreTipo, setNombreTipo] = useState('');
  const [tipoEditando, setTipoEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cargarTiposEspacio = useCallback(async () => {
    try {
      setCargando(true);
      const token = await getAccessToken(instance, accounts);
      setTiposEspacio(await getTiposEspacioAdministracion(token));
    } catch (error) {
      console.error('Error cargando tipos de espacio:', error);
      setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los tipos de espacio.' });
    } finally {
      setCargando(false);
    }
  }, [accounts, instance]);

  useEffect(() => {
    if (usuario?.rol === 'Administrador') cargarTiposEspacio();
  }, [cargarTiposEspacio, usuario?.rol]);

  if (usuario?.rol !== 'Administrador') return <Navigate to="/" replace />;

  const limpiarFormulario = () => {
    setNombreTipo('');
    setTipoEditando(null);
  };

  const guardarTipoEspacio = async (evento) => {
    evento.preventDefault();
    const nombre = nombreTipo.trim();
    if (!nombre) return;

    try {
      setGuardando(true);
      setMensaje(null);
      const token = await getAccessToken(instance, accounts);
      if (tipoEditando) {
        await actualizarTipoEspacio(tipoEditando, nombre, token);
        setMensaje({ tipo: 'exito', texto: 'Tipo de espacio actualizado.' });
      } else {
        await crearTipoEspacio(nombre, token);
        setMensaje({ tipo: 'exito', texto: 'Tipo de espacio creado.' });
      }
      limpiarFormulario();
      await cargarTiposEspacio();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data || 'No se pudo guardar el tipo de espacio.' });
    } finally {
      setGuardando(false);
    }
  };

  const editarTipoEspacio = (tipo) => {
    setTipoEditando(tipo.idTipoEspacio);
    setNombreTipo(tipo.nombreTipo);
    setMensaje(null);
  };

  const borrarTipoEspacio = async (tipo) => {
    if (!window.confirm(`¿Eliminar el tipo de espacio "${tipo.nombreTipo}"?`)) return;
    try {
      const token = await getAccessToken(instance, accounts);
      await eliminarTipoEspacio(tipo.idTipoEspacio, token);
      setMensaje({ tipo: 'exito', texto: 'Tipo de espacio eliminado.' });
      await cargarTiposEspacio();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data || 'No se pudo eliminar el tipo de espacio.' });
    }
  };

  return (
    <section className="administracion-page">
      <header className="administracion-header">
        <p>Administración</p>
        <h2>Tipos de espacio</h2>
        <span>Gestiona los tipos disponibles antes de registrar espacios.</span>
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
        <form className="administracion-formulario" onSubmit={guardarTipoEspacio}>
          <h3>{tipoEditando ? 'Editar tipo de espacio' : 'Nuevo tipo de espacio'}</h3>
          <label htmlFor="nombreTipoEspacio">Nombre</label>
          <input id="nombreTipoEspacio" value={nombreTipo} onChange={(e) => setNombreTipo(e.target.value)} maxLength={50} placeholder="Ej. Aula" required />
          <div className="administracion-acciones">
            <button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : tipoEditando ? 'Guardar cambios' : 'Crear tipo de espacio'}</button>
            {tipoEditando && <button type="button" className="secundario" onClick={limpiarFormulario}>Cancelar</button>}
          </div>
          {mensaje && <p className={`administracion-mensaje ${mensaje.tipo}`}>{mensaje.texto}</p>}
        </form>
        <div className="administracion-listado">
          <h3>Tipos de espacio registrados</h3>
          {cargando ? <p>Cargando tipos de espacio...</p> : tiposEspacio.length === 0 ? <p>No hay tipos de espacio registrados.</p> : (
            <ul>{tiposEspacio.map((tipo) => <li key={tipo.idTipoEspacio}><span>{tipo.nombreTipo}</span><div><button type="button" className="secundario" onClick={() => editarTipoEspacio(tipo)}>Editar</button><button type="button" className="peligro" onClick={() => borrarTipoEspacio(tipo)}>Eliminar</button></div></li>)}</ul>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdministracionTiposEspacioPage;
