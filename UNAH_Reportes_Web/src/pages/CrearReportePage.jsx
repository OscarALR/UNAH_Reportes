import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { getAccessToken } from '../auth/getToken';
import { getCategorias, getEdificios, getEspaciosSinEdificio, getEspaciosDeEdificio } from '../api/catalogosApi';
import { crearReporte } from '../api/reportesApi';
import { subirImagen } from '../api/imagenesApi';
import { ordenarAlfabeticamente } from '../utils/ordenarAlfabeticamente';
import './CrearReportePage.css';

function CrearReportePage() {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [espaciosSinEdificio, setEspaciosSinEdificio] = useState([]);
  const [espaciosDelEdificio, setEspaciosDelEdificio] = useState([]);
  const [imagenesSeleccionadas, setImagenesSeleccionadas] = useState([]); 
  const imagenesSeleccionadasRef = useRef([]);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [idCategoria, setIdCategoria] = useState('');
  const [tipoUbicacion, setTipoUbicacion] = useState(''); // 'edificio' o 'sin-edificio'
  const [idEdificioSeleccionado, setIdEdificioSeleccionado] = useState('');
  const [idEspacio, setIdEspacio] = useState('');
  const [prioridad, setPrioridad] = useState('Media');

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const cargarCatalogos = useCallback(async () => {
    try {
      const [cats, edifs, sinEdif] = await Promise.all([
        getCategorias(),
        getEdificios(),
        getEspaciosSinEdificio(),
      ]);
      setCategorias(ordenarAlfabeticamente(cats, (categoria) => categoria.nombreCategoria));
      setEdificios(ordenarAlfabeticamente(edifs, (edificio) => edificio.nombreEdificio));
      setEspaciosSinEdificio(ordenarAlfabeticamente(sinEdif, (espacio) => espacio.nombreEspacio));
    } catch (err) {
      console.error('Error cargando catálogos:', err);
      setError('No se pudieron cargar los catálogos.');
    }
  }, []);

  const cargarEspaciosDelEdificio = useCallback(async (idEdificio) => {
    try {
      const espacios = await getEspaciosDeEdificio(idEdificio);
      setEspaciosDelEdificio(ordenarAlfabeticamente(espacios, (espacio) => espacio.nombreEspacio));
      setIdEspacio(''); // resetea la selección anterior de espacio
    } catch (err) {
      console.error('Error cargando espacios del edificio:', err);
    }
  }, []);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  useEffect(() => {
    if (idEdificioSeleccionado) {
      cargarEspaciosDelEdificio(idEdificioSeleccionado);
    } else {
      setEspaciosDelEdificio([]);
    }
  }, [cargarEspaciosDelEdificio, idEdificioSeleccionado]);

  useEffect(() => {
    imagenesSeleccionadasRef.current = imagenesSeleccionadas;
  }, [imagenesSeleccionadas]);

  useEffect(() => () => {
    imagenesSeleccionadasRef.current.forEach(({ vistaPrevia }) => URL.revokeObjectURL(vistaPrevia));
  }, []);

  const seleccionarImagenes = (evento) => {
    const archivos = Array.from(evento.target.files);
    imagenesSeleccionadas.forEach(({ vistaPrevia }) => URL.revokeObjectURL(vistaPrevia));
    setImagenesSeleccionadas(archivos.map((archivo, indice) => ({
      archivo,
      id: `${archivo.name}-${archivo.lastModified}-${indice}`,
      vistaPrevia: URL.createObjectURL(archivo),
    })));
    evento.target.value = '';
  };

  const quitarImagen = (id) => {
    setImagenesSeleccionadas((imagenes) => {
      const imagen = imagenes.find((elemento) => elemento.id === id);
      if (imagen) URL.revokeObjectURL(imagen.vistaPrevia);
      return imagenes.filter((elemento) => elemento.id !== id);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!titulo || !descripcion || !idCategoria || !idEspacio) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }

    setEnviando(true);
    try {
      const token = await getAccessToken(instance, accounts);
      const reporteCreado = await crearReporte(
        {
          titulo,
          descripcion,
          idCategoria: Number(idCategoria),
          idEspacio: Number(idEspacio),
          prioridad,
        },
        token
      );

      for (const { archivo } of imagenesSeleccionadas) {
        await subirImagen(reporteCreado.idReporte, archivo, token);
      }

      navigate('/?creado=1');
    } catch (err) {
      console.error('Error creando el reporte:', err);
      setError('No se pudo crear el reporte. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="crear-reporte">
      <div className="crear-reporte-encabezado">
        <div>
          <p className="crear-reporte-etiqueta">UNAH-VS · Incidencias</p>
          <h2>Crear nuevo reporte</h2>
          <p>Describe la incidencia para que el equipo responsable pueda atenderla.</p>
        </div>
        <span className="crear-reporte-paso">Paso 1 de 1</span>
      </div>

      <form className="crear-reporte-formulario" onSubmit={handleSubmit}>
        {error && (
          <div className="crear-reporte-error" role="alert">
            {error}
          </div>
        )}

        <section className="crear-reporte-seccion">
          <div className="crear-reporte-seccion-titulo">
            <span>1</span>
            <div>
              <h3>Información de la incidencia</h3>
              <p>Indica qué sucede y dónde ocurrió.</p>
            </div>
          </div>

          <div className="crear-reporte-campo">
            <label htmlFor="titulo">Título <strong>*</strong></label>
            <input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Lámpara dañada en el aula 302"
              maxLength={150}
            />
          </div>

          <div className="crear-reporte-campo">
            <label htmlFor="descripcion">Descripción <strong>*</strong></label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Explica el problema con el mayor detalle posible..."
              maxLength={1000}
            />
            <small>{descripcion.length}/1000 caracteres</small>
          </div>

          <div className="crear-reporte-grid">
            <div className="crear-reporte-campo">
              <label htmlFor="categoria">Categoría <strong>*</strong></label>
              <select
                id="categoria"
                value={idCategoria}
                onChange={(e) => setIdCategoria(e.target.value)}
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.idCategoria} value={cat.idCategoria}>
                    {cat.nombreCategoria}
                  </option>
                ))}
              </select>
            </div>

            <div className="crear-reporte-campo">
              <label htmlFor="prioridad">Prioridad</label>
              <select
                id="prioridad"
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value)}
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
          </div>
        </section>

        <section className="crear-reporte-seccion">
          <div className="crear-reporte-seccion-titulo">
            <span>2</span>
            <div>
              <h3>Ubicación</h3>
              <p>Selecciona el área relacionada con la incidencia.</p>
            </div>
          </div>

          <div className="crear-reporte-campo">
            <label htmlFor="tipo-ubicacion">¿Dónde ocurrió? <strong>*</strong></label>
            <select
              id="tipo-ubicacion"
              value={tipoUbicacion}
              onChange={(e) => {
                setTipoUbicacion(e.target.value);
                setIdEdificioSeleccionado('');
                setIdEspacio('');
              }}
            >
              <option value="">Selecciona una opción</option>
              <option value="sin-edificio">Área común</option>
              <option value="edificio">Dentro de un edificio</option>
            </select>
          </div>

          {tipoUbicacion === 'edificio' && (
            <div className="crear-reporte-grid">
              <div className="crear-reporte-campo">
                <label htmlFor="edificio">Edificio<strong>*</strong></label>
                <select
                  id="edificio"
                  value={idEdificioSeleccionado}
                  onChange={(e) => setIdEdificioSeleccionado(e.target.value)}
                >
                  <option value="">Selecciona un edificio</option>
                  {edificios.map((ed) => (
                    <option key={ed.idEdificio} value={ed.idEdificio}>
                      {ed.nombreEdificio}
                    </option>
                  ))}
                </select>
              </div>

              {idEdificioSeleccionado && (
                <div className="crear-reporte-campo">
                  <label htmlFor="espacio-edificio">Espacio <strong>*</strong></label>
                  <select
                    id="espacio-edificio"
                    value={idEspacio}
                    onChange={(e) => setIdEspacio(e.target.value)}
                  >
                    <option value="">Selecciona un espacio</option>
                    {espaciosDelEdificio.map((esp) => (
                      <option key={esp.idEspacio} value={esp.idEspacio}>
                        {esp.nombreEspacio} ({esp.tipoEspacio})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {tipoUbicacion === 'sin-edificio' && (
            <div className="crear-reporte-campo">
              <label htmlFor="area-comun">Área común <strong>*</strong></label>
              <select
                id="area-comun"
                value={idEspacio}
                onChange={(e) => setIdEspacio(e.target.value)}
              >
                <option value="">Selecciona un área</option>
                {espaciosSinEdificio.map((esp) => (
                  <option key={esp.idEspacio} value={esp.idEspacio}>
                    {esp.nombreEspacio} ({esp.tipoEspacio})
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        <section className="crear-reporte-seccion">
          <div className="crear-reporte-seccion-titulo">
            <span>3</span>
            <div>
              <h3>Fotografías</h3>
              <p>Opcional, pero ayudan a identificar la incidencia.</p>
            </div>
          </div>

          <label className="crear-reporte-archivo" htmlFor="imagenes">
            <span className="crear-reporte-archivo-icono">+</span>
            <span>
              <strong>Seleccionar fotografías</strong>
              <small>Formatos de imagen; puedes elegir varias.</small>
            </span>
            <input
              id="imagenes"
              type="file"
              accept="image/*"
              multiple
              onChange={seleccionarImagenes}
            />
          </label>

          {imagenesSeleccionadas.length > 0 && (
            <div className="crear-reporte-vistas-previas" aria-label="Imágenes seleccionadas">
              {imagenesSeleccionadas.map(({ archivo, id, vistaPrevia }) => (
                <article className="crear-reporte-vista-previa" key={id}>
                  <img src={vistaPrevia} alt={`Vista previa de ${archivo.name}`} />
                  <div>
                    <strong title={archivo.name}>{archivo.name}</strong>
                    <small>{Math.ceil(archivo.size / 1024)} KB</small>
                  </div>
                  <button type="button" onClick={() => quitarImagen(id)} aria-label={`Quitar ${archivo.name}`}>
                    Quitar
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="crear-reporte-acciones">
          <button className="crear-reporte-boton" type="submit" disabled={enviando}>
            {enviando ? 'Creando reporte...' : 'Crear reporte'}
          </button>
          <p>Los campos marcados con <strong>*</strong> son obligatorios.</p>
        </div>
      </form>
    </div>
  );
}

export default CrearReportePage;
