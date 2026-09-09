import { useCallback, useEffect, useState } from 'react';
import { Navigate, NavLink } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { getAccessToken } from '../auth/getToken';
import { actualizarEdificio, crearEdificio, eliminarEdificio, getEdificiosAdministracion } from '../api/administracionApi';
import { useUser } from '../context/UserContext';
import './AdministracionCategoriasPage.css';

function AdministracionEdificiosPage() {
  const { instance, accounts } = useMsal();
  const { usuario } = useUser();
  const [edificios, setEdificios] = useState([]);
  const [formulario, setFormulario] = useState({ nombreEdificio: '', descripcion: '' });
  const [edificioEditando, setEdificioEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cargarEdificios = useCallback(async () => {
    try {
      setCargando(true);
      const token = await getAccessToken(instance, accounts);
      setEdificios(await getEdificiosAdministracion(token));
    } catch (error) {
      console.error('Error cargando edificios:', error);
      setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los edificios.' });
    } finally {
      setCargando(false);
    }
  }, [accounts, instance]);

  useEffect(() => {
    if (usuario?.rol === 'Administrador') cargarEdificios();
  }, [cargarEdificios, usuario?.rol]);

  if (usuario?.rol !== 'Administrador') return <Navigate to="/" replace />;

  const limpiarFormulario = () => {
    setFormulario({ nombreEdificio: '', descripcion: '' });
    setEdificioEditando(null);
  };

  const guardarEdificio = async (evento) => {
    evento.preventDefault();
    if (!formulario.nombreEdificio.trim()) return;

    try {
      setGuardando(true);
      setMensaje(null);
      const token = await getAccessToken(instance, accounts);
      if (edificioEditando) {
        await actualizarEdificio(edificioEditando, formulario, token);
        setMensaje({ tipo: 'exito', texto: 'Edificio actualizado.' });
      } else {
        await crearEdificio(formulario, token);
        setMensaje({ tipo: 'exito', texto: 'Edificio creado.' });
      }
      limpiarFormulario();
      await cargarEdificios();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data || 'No se pudo guardar el edificio.' });
    } finally {
      setGuardando(false);
    }
  };

  const borrarEdificio = async (edificio) => {
    if (!window.confirm(`¿Eliminar el edificio "${edificio.nombreEdificio}"?`)) return;
    try {
      const token = await getAccessToken(instance, accounts);
      await eliminarEdificio(edificio.idEdificio, token);
      setMensaje({ tipo: 'exito', texto: 'Edificio eliminado.' });
      await cargarEdificios();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data || 'No se pudo eliminar el edificio.' });
    }
  };

  return (
    <section className="administracion-page">
      <header className="administracion-header">
        <p>Administración</p>
        <h2>Edificios</h2>
        <span>Gestiona los edificios y la información de referencia.</span>
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
        <form className="administracion-formulario" onSubmit={guardarEdificio}>
          <h3>{edificioEditando ? 'Editar edificio' : 'Nuevo edificio'}</h3>
          <label htmlFor="nombreEdificio">Nombre</label>
          <input id="nombreEdificio" value={formulario.nombreEdificio} onChange={(e) => setFormulario({ ...formulario, nombreEdificio: e.target.value })} maxLength={100} placeholder="Ej. Edificio A" required />
          <label htmlFor="descripcionEdificio">Descripción <small>(opcional)</small></label>
          <textarea id="descripcionEdificio" value={formulario.descripcion} onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })} maxLength={255} placeholder="Ubicación o detalle del edificio" />
          <div className="administracion-acciones">
            <button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : edificioEditando ? 'Guardar cambios' : 'Crear edificio'}</button>
            {edificioEditando && <button type="button" className="secundario" onClick={limpiarFormulario}>Cancelar</button>}
          </div>
          {mensaje && <p className={`administracion-mensaje ${mensaje.tipo}`}>{mensaje.texto}</p>}
        </form>
        <div className="administracion-listado">
          <h3>Edificios registrados</h3>
          {cargando ? <p>Cargando edificios...</p> : edificios.length === 0 ? <p>No hay edificios registrados.</p> : (
            <ul>{edificios.map((edificio) => <li key={edificio.idEdificio}><span><strong>{edificio.nombreEdificio}</strong>{edificio.descripcion && <small className="administracion-descripcion">{edificio.descripcion}</small>}</span><div><button type="button" className="secundario" onClick={() => { setEdificioEditando(edificio.idEdificio); setFormulario({ nombreEdificio: edificio.nombreEdificio, descripcion: edificio.descripcion || '' }); setMensaje(null); }}>Editar</button><button type="button" className="peligro" onClick={() => borrarEdificio(edificio)}>Eliminar</button></div></li>)}</ul>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdministracionEdificiosPage;
