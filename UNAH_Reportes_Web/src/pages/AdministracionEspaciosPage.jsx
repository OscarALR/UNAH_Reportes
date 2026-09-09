import { useCallback, useEffect, useState } from 'react';
import { Navigate, NavLink } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { getAccessToken } from '../auth/getToken';
import {
  actualizarEspacio,
  crearEspacio,
  eliminarEspacio,
  getEdificiosAdministracion,
  getEspaciosAdministracion,
  getTiposEspacioAdministracion,
} from '../api/administracionApi';
import { useUser } from '../context/UserContext';
import './AdministracionCategoriasPage.css';

const formularioInicial = { nombreEspacio: '', idEdificio: '', idTipoEspacio: '' };

function AdministracionEspaciosPage() {
  const { instance, accounts } = useMsal();
  const { usuario } = useUser();
  const [espacios, setEspacios] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [tiposEspacio, setTiposEspacio] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [espacioEditando, setEspacioEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      const token = await getAccessToken(instance, accounts);
      const [espaciosCargados, edificiosCargados, tiposCargados] = await Promise.all([
        getEspaciosAdministracion(token),
        getEdificiosAdministracion(token),
        getTiposEspacioAdministracion(token),
      ]);
      setEspacios(espaciosCargados);
      setEdificios(edificiosCargados);
      setTiposEspacio(tiposCargados);
    } catch (error) {
      console.error('Error cargando espacios:', error);
      setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los datos de espacios.' });
    } finally {
      setCargando(false);
    }
  }, [accounts, instance]);

  useEffect(() => {
    if (usuario?.rol === 'Administrador') cargarDatos();
  }, [cargarDatos, usuario?.rol]);

  if (usuario?.rol !== 'Administrador') return <Navigate to="/" replace />;

  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setEspacioEditando(null);
  };

  const guardarEspacio = async (evento) => {
    evento.preventDefault();
    if (!formulario.nombreEspacio.trim() || !formulario.idTipoEspacio) return;

    const datos = {
      nombreEspacio: formulario.nombreEspacio.trim(),
      idEdificio: formulario.idEdificio ? Number(formulario.idEdificio) : null,
      idTipoEspacio: Number(formulario.idTipoEspacio),
    };

    try {
      setGuardando(true);
      setMensaje(null);
      const token = await getAccessToken(instance, accounts);
      if (espacioEditando) {
        await actualizarEspacio(espacioEditando, datos, token);
        setMensaje({ tipo: 'exito', texto: 'Espacio actualizado.' });
      } else {
        await crearEspacio(datos, token);
        setMensaje({ tipo: 'exito', texto: 'Espacio creado.' });
      }
      limpiarFormulario();
      await cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data || 'No se pudo guardar el espacio.' });
    } finally {
      setGuardando(false);
    }
  };

  const editarEspacio = (espacio) => {
    setEspacioEditando(espacio.idEspacio);
    setFormulario({
      nombreEspacio: espacio.nombreEspacio,
      idEdificio: espacio.idEdificio?.toString() || '',
      idTipoEspacio: espacio.idTipoEspacio.toString(),
    });
    setMensaje(null);
  };

  const borrarEspacio = async (espacio) => {
    if (!window.confirm(`¿Eliminar el espacio "${espacio.nombreEspacio}"?`)) return;
    try {
      const token = await getAccessToken(instance, accounts);
      await eliminarEspacio(espacio.idEspacio, token);
      setMensaje({ tipo: 'exito', texto: 'Espacio eliminado.' });
      await cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data || 'No se pudo eliminar el espacio.' });
    }
  };

  return (
    <section className="administracion-page">
      <header className="administracion-header">
        <p>Administración</p>
        <h2>Espacios</h2>
        <span>Gestiona aulas, laboratorios y áreas comunes.</span>
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
        <form className="administracion-formulario" onSubmit={guardarEspacio}>
          <h3>{espacioEditando ? 'Editar espacio' : 'Nuevo espacio'}</h3>
          <label htmlFor="nombreEspacio">Nombre</label>
          <input id="nombreEspacio" value={formulario.nombreEspacio} onChange={(e) => setFormulario({ ...formulario, nombreEspacio: e.target.value })} maxLength={150} placeholder="Ej. Aula 302" required />
          <label htmlFor="tipoEspacio">Tipo de espacio</label>
          <select id="tipoEspacio" value={formulario.idTipoEspacio} onChange={(e) => setFormulario({ ...formulario, idTipoEspacio: e.target.value })} required>
            <option value="">Selecciona un tipo</option>
            {tiposEspacio.map((tipo) => <option key={tipo.idTipoEspacio} value={tipo.idTipoEspacio}>{tipo.nombreTipo}</option>)}
          </select>
          <label htmlFor="edificioEspacio">Ubicación</label>
          <select id="edificioEspacio" value={formulario.idEdificio} onChange={(e) => setFormulario({ ...formulario, idEdificio: e.target.value })}>
            <option value="">Área común / sin edificio</option>
            {edificios.map((edificio) => <option key={edificio.idEdificio} value={edificio.idEdificio}>{edificio.nombreEdificio}</option>)}
          </select>
          <div className="administracion-acciones">
            <button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : espacioEditando ? 'Guardar cambios' : 'Crear espacio'}</button>
            {espacioEditando && <button type="button" className="secundario" onClick={limpiarFormulario}>Cancelar</button>}
          </div>
          {mensaje && <p className={`administracion-mensaje ${mensaje.tipo}`}>{mensaje.texto}</p>}
        </form>
        <div className="administracion-listado">
          <h3>Espacios registrados</h3>
          {cargando ? <p>Cargando espacios...</p> : espacios.length === 0 ? <p>No hay espacios registrados.</p> : (
            <ul>{espacios.map((espacio) => <li key={espacio.idEspacio}><span><strong>{espacio.nombreEspacio}</strong><small className="administracion-descripcion">{espacio.tipoEspacio} · {espacio.edificio || 'Área común'}</small></span><div><button type="button" className="secundario" onClick={() => editarEspacio(espacio)}>Editar</button><button type="button" className="peligro" onClick={() => borrarEspacio(espacio)}>Eliminar</button></div></li>)}</ul>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdministracionEspaciosPage;
