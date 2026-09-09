import { useCallback, useEffect, useState } from 'react';
import { Navigate, NavLink } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { getAccessToken } from '../auth/getToken';
import {
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
  getCategoriasAdministracion,
} from '../api/administracionApi';
import { useUser } from '../context/UserContext';
import './AdministracionCategoriasPage.css';

function AdministracionCategoriasPage() {
  const { instance, accounts } = useMsal();
  const { usuario } = useUser();
  const [categorias, setCategorias] = useState([]);
  const [nombreCategoria, setNombreCategoria] = useState('');
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cargarCategorias = useCallback(async () => {
    try {
      setCargando(true);
      const token = await getAccessToken(instance, accounts);
      setCategorias(await getCategoriasAdministracion(token));
    } catch (error) {
      console.error('Error cargando categorías:', error);
      setMensaje({ tipo: 'error', texto: 'No se pudieron cargar las categorías.' });
    } finally {
      setCargando(false);
    }
  }, [accounts, instance]);

  useEffect(() => {
    if (usuario?.rol === 'Administrador') {
      cargarCategorias();
    }
  }, [cargarCategorias, usuario?.rol]);

  if (usuario?.rol !== 'Administrador') {
    return <Navigate to="/" replace />;
  }

  const limpiarFormulario = () => {
    setNombreCategoria('');
    setCategoriaEditando(null);
  };

  const guardarCategoria = async (evento) => {
    evento.preventDefault();
    const nombre = nombreCategoria.trim();
    if (!nombre) return;

    try {
      setGuardando(true);
      setMensaje(null);
      const token = await getAccessToken(instance, accounts);

      if (categoriaEditando) {
        await actualizarCategoria(categoriaEditando, nombre, token);
        setMensaje({ tipo: 'exito', texto: 'Categoría actualizada.' });
      } else {
        await crearCategoria(nombre, token);
        setMensaje({ tipo: 'exito', texto: 'Categoría creada.' });
      }

      limpiarFormulario();
      await cargarCategorias();
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data || 'No se pudo guardar la categoría.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const editarCategoria = (categoria) => {
    setCategoriaEditando(categoria.idCategoria);
    setNombreCategoria(categoria.nombreCategoria);
    setMensaje(null);
  };

  const borrarCategoria = async (categoria) => {
    if (!window.confirm(`¿Eliminar la categoría "${categoria.nombreCategoria}"?`)) return;

    try {
      const token = await getAccessToken(instance, accounts);
      await eliminarCategoria(categoria.idCategoria, token);
      setMensaje({ tipo: 'exito', texto: 'Categoría eliminada.' });
      await cargarCategorias();
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data || 'No se pudo eliminar la categoría.',
      });
    }
  };

  return (
    <section className="administracion-page">
      <header className="administracion-header">
        <div>
          <p>Administración</p>
          <h2>Categorías de reportes</h2>
          <span>Gestiona las categorías disponibles al crear un reporte.</span>
          <nav className="administracion-subnav">
            <NavLink to="/administracion/categorias">Categorías</NavLink>
            <NavLink to="/administracion/carreras">Carreras</NavLink>
            <NavLink to="/administracion/edificios">Edificios</NavLink>
            <NavLink to="/administracion/tipos-espacio">Tipos de espacio</NavLink>
            <NavLink to="/administracion/espacios">Espacios</NavLink>
            <NavLink to="/administracion/estados">Estados</NavLink>
            <NavLink to="/administracion/usuarios">Usuarios</NavLink>
          </nav>
        </div>
      </header>

      <div className="administracion-grid">
        <form className="administracion-formulario" onSubmit={guardarCategoria}>
          <h3>{categoriaEditando ? 'Editar categoría' : 'Nueva categoría'}</h3>
          <label htmlFor="nombreCategoria">Nombre</label>
          <input
            id="nombreCategoria"
            value={nombreCategoria}
            onChange={(evento) => setNombreCategoria(evento.target.value)}
            maxLength={100}
            placeholder="Ej. Infraestructura"
            required
          />
          <div className="administracion-acciones">
            <button type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : categoriaEditando ? 'Guardar cambios' : 'Crear categoría'}
            </button>
            {categoriaEditando && (
              <button type="button" className="secundario" onClick={limpiarFormulario}>
                Cancelar
              </button>
            )}
          </div>
          {mensaje && <p className={`administracion-mensaje ${mensaje.tipo}`}>{mensaje.texto}</p>}
        </form>

        <div className="administracion-listado">
          <h3>Categorías registradas</h3>
          {cargando ? (
            <p>Cargando categorías...</p>
          ) : categorias.length === 0 ? (
            <p>No hay categorías registradas.</p>
          ) : (
            <ul>
              {categorias.map((categoria) => (
                <li key={categoria.idCategoria}>
                  <span>{categoria.nombreCategoria}</span>
                  <div>
                    <button type="button" className="secundario" onClick={() => editarCategoria(categoria)}>
                      Editar
                    </button>
                    <button type="button" className="peligro" onClick={() => borrarCategoria(categoria)}>
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdministracionCategoriasPage;
