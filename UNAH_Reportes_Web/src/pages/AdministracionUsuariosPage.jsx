import { useCallback, useEffect, useState } from 'react';
import { Navigate, NavLink } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { getAccessToken } from '../auth/getToken';
import {
  actualizarUsuario,
  crearUsuario,
  eliminarUsuario,
  getCatalogosUsuariosAdministracion,
  getUsuariosAdministracion,
} from '../api/administracionApi';
import { useUser } from '../context/UserContext';
import { ordenarAlfabeticamente } from '../utils/ordenarAlfabeticamente';
import './AdministracionCategoriasPage.css';

const formularioInicial = { correoInstitucional: '', nombreCompleto: '', idCarrera: '', idRol: '', estado: 'Activo' };

function AdministracionUsuariosPage() {
  const { instance, accounts } = useMsal();
  const { usuario } = useUser();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      const token = await getAccessToken(instance, accounts);
      const [usuariosCargados, catalogos] = await Promise.all([
        getUsuariosAdministracion(token),
        getCatalogosUsuariosAdministracion(token),
      ]);
      setUsuarios(usuariosCargados);
      setRoles(ordenarAlfabeticamente(catalogos.roles, (rol) => rol.nombreRol));
      setCarreras(ordenarAlfabeticamente(catalogos.carreras, (carrera) => carrera.nombreCarrera));
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los usuarios.' });
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
    setUsuarioEditando(null);
  };

  const guardarUsuario = async (evento) => {
    evento.preventDefault();
    if (!formulario.correoInstitucional.trim() || !formulario.nombreCompleto.trim() || !formulario.idRol) return;

    const datos = {
      correoInstitucional: formulario.correoInstitucional.trim(),
      nombreCompleto: formulario.nombreCompleto.trim(),
      idCarrera: formulario.idCarrera ? Number(formulario.idCarrera) : null,
      idRol: Number(formulario.idRol),
      estado: formulario.estado,
    };

    try {
      setGuardando(true);
      setMensaje(null);
      const token = await getAccessToken(instance, accounts);
      if (usuarioEditando) {
        await actualizarUsuario(usuarioEditando, datos, token);
        setMensaje({ tipo: 'exito', texto: 'Usuario actualizado.' });
      } else {
        await crearUsuario(datos, token);
        setMensaje({ tipo: 'exito', texto: 'Usuario creado.' });
      }
      limpiarFormulario();
      await cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data || 'No se pudo guardar el usuario.' });
    } finally {
      setGuardando(false);
    }
  };

  const editarUsuario = (usuarioSeleccionado) => {
    setUsuarioEditando(usuarioSeleccionado.idUsuario);
    setFormulario({
      correoInstitucional: usuarioSeleccionado.correoInstitucional,
      nombreCompleto: usuarioSeleccionado.nombreCompleto,
      idCarrera: usuarioSeleccionado.idCarrera?.toString() || '',
      idRol: usuarioSeleccionado.idRol.toString(),
      estado: usuarioSeleccionado.estado,
    });
    setMensaje(null);
  };

  const borrarUsuario = async (usuarioSeleccionado) => {
    if (!window.confirm(`¿Eliminar al usuario "${usuarioSeleccionado.nombreCompleto}"?`)) return;
    try {
      const token = await getAccessToken(instance, accounts);
      await eliminarUsuario(usuarioSeleccionado.idUsuario, token);
      setMensaje({ tipo: 'exito', texto: 'Usuario eliminado.' });
      await cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data || 'No se pudo eliminar el usuario.' });
    }
  };

  return (
    <section className="administracion-page">
      <header className="administracion-header">
        <p>Administración</p>
        <h2>Usuarios y roles</h2>
        <span>Administra el acceso, la carrera y el rol de cada cuenta registrada.</span>
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
        <form className="administracion-formulario" onSubmit={guardarUsuario}>
          <h3>{usuarioEditando ? 'Editar usuario' : 'Nuevo usuario'}</h3>
          <label htmlFor="correoUsuario">Correo institucional</label>
          <input id="correoUsuario" type="email" value={formulario.correoInstitucional} onChange={(e) => setFormulario({ ...formulario, correoInstitucional: e.target.value })} maxLength={150} placeholder="nombre@unah.edu.hn" required />
          <label htmlFor="nombreUsuario">Nombre completo</label>
          <input id="nombreUsuario" value={formulario.nombreCompleto} onChange={(e) => setFormulario({ ...formulario, nombreCompleto: e.target.value })} maxLength={150} placeholder="Nombre del usuario" required />
          <label htmlFor="rolUsuario">Rol</label>
          <select id="rolUsuario" value={formulario.idRol} onChange={(e) => setFormulario({ ...formulario, idRol: e.target.value })} required>
            <option value="">Selecciona un rol</option>
            {roles.map((rol) => <option key={rol.idRol} value={rol.idRol}>{rol.nombreRol}</option>)}
          </select>
          <label htmlFor="carreraUsuario">Carrera <small>(opcional)</small></label>
          <select id="carreraUsuario" value={formulario.idCarrera} onChange={(e) => setFormulario({ ...formulario, idCarrera: e.target.value })}>
            <option value="">Sin carrera asignada</option>
            {carreras.map((carrera) => <option key={carrera.idCarrera} value={carrera.idCarrera}>{carrera.nombreCarrera}</option>)}
          </select>
          <label htmlFor="estadoUsuario">Estado de acceso</label>
          <select id="estadoUsuario" value={formulario.estado} onChange={(e) => setFormulario({ ...formulario, estado: e.target.value })}>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
          <div className="administracion-acciones">
            <button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : usuarioEditando ? 'Guardar cambios' : 'Crear usuario'}</button>
            {usuarioEditando && <button type="button" className="secundario" onClick={limpiarFormulario}>Cancelar</button>}
          </div>
          {mensaje && <p className={`administracion-mensaje ${mensaje.tipo}`}>{mensaje.texto}</p>}
        </form>
        <div className="administracion-listado">
          <h3>Usuarios registrados</h3>
          {cargando ? <p>Cargando usuarios...</p> : usuarios.length === 0 ? <p>No hay usuarios registrados.</p> : (
            <ul>{usuarios.map((usuarioListado) => <li key={usuarioListado.idUsuario}><span><strong>{usuarioListado.nombreCompleto}</strong><small className="administracion-descripcion">{usuarioListado.correoInstitucional} · {usuarioListado.rol} · {usuarioListado.estado}{usuarioListado.carrera && ` · ${usuarioListado.carrera}`}</small></span><div><button type="button" className="secundario" onClick={() => editarUsuario(usuarioListado)}>Editar</button><button type="button" className="peligro" onClick={() => borrarUsuario(usuarioListado)}>Eliminar</button></div></li>)}</ul>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdministracionUsuariosPage;
