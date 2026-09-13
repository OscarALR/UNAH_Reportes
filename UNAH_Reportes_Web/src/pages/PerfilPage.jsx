import { useEffect, useRef, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useUser } from '../context/UserContext';
import { getAccessToken } from '../auth/getToken';
import { actualizarAvatar, actualizarPerfil, cambiarContrasena, eliminarAvatar, getCarrerasRegistro } from '../api/autenticacionApi';
import { ordenarAlfabeticamente } from '../utils/ordenarAlfabeticamente';
import AvatarUsuario from '../components/AvatarUsuario';
import './PerfilPage.css';

const CONTRASENA_SEGURA = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const COLORES_AVATAR = ['#1F6F8B', '#1E8449', '#6C3483', '#7B241C', '#7D6608', '#2C3E50', '#117864', '#AF601A'];
const nombreCompletoValido = (nombre) => /^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$/u.test(nombre.trim());
const TAMANO_RECORTADOR = 300;

function limitarDesplazamiento(desplazamiento, imagen, escala, tamanoRecorte) {
  const limiteX = Math.max(0, (imagen.ancho * escala - tamanoRecorte) / 2);
  const limiteY = Math.max(0, (imagen.alto * escala - tamanoRecorte) / 2);
  return {
    x: Math.min(limiteX, Math.max(-limiteX, desplazamiento.x)),
    y: Math.min(limiteY, Math.max(-limiteY, desplazamiento.y)),
  };
}

function RecortadorAvatar({ archivo, onCancelar, onConfirmar }) {
  const [imagen, setImagen] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [desplazamiento, setDesplazamiento] = useState({ x: 0, y: 0 });
  const [arrastre, setArrastre] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const imagenRef = useRef(null);
  const marcoRef = useRef(null);
  const [url] = useState(() => URL.createObjectURL(archivo));
  const [tamanoRecorte, setTamanoRecorte] = useState(TAMANO_RECORTADOR);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  useEffect(() => {
    const actualizarTamano = () => setTamanoRecorte(marcoRef.current?.clientWidth || TAMANO_RECORTADOR);
    actualizarTamano();
    const observador = new ResizeObserver(actualizarTamano);
    if (marcoRef.current) observador.observe(marcoRef.current);
    return () => observador.disconnect();
  }, []);

  const escala = imagen ? imagen.escalaBase * zoom : 1;
  const mover = (x, y) => {
    if (!arrastre || !imagen) return;
    setDesplazamiento(limitarDesplazamiento({ x: arrastre.origen.x + x - arrastre.x, y: arrastre.origen.y + y - arrastre.y }, imagen, escala, tamanoRecorte));
  };
  const ajustarZoom = (nuevoZoom) => {
    const valor = Number(nuevoZoom);
    setZoom(valor);
    if (imagen) setDesplazamiento((actual) => limitarDesplazamiento(actual, imagen, imagen.escalaBase * valor, tamanoRecorte));
  };
  const cargarImagen = () => {
    const elemento = imagenRef.current;
    if (!elemento) return;
    const datos = { ancho: elemento.naturalWidth, alto: elemento.naturalHeight, escalaBase: Math.max(tamanoRecorte / elemento.naturalWidth, tamanoRecorte / elemento.naturalHeight) };
    setImagen(datos);
    setDesplazamiento({ x: 0, y: 0 });
  };
  const recortar = () => {
    if (!imagen || !imagenRef.current) return;
    setProcesando(true);
    const lienzo = document.createElement('canvas');
    lienzo.width = 512; lienzo.height = 512;
    const contexto = lienzo.getContext('2d');
    const origenX = imagen.ancho / 2 - (tamanoRecorte / 2 + desplazamiento.x) / escala;
    const origenY = imagen.alto / 2 - (tamanoRecorte / 2 + desplazamiento.y) / escala;
    const ladoOrigen = tamanoRecorte / escala;
    contexto.drawImage(imagenRef.current, origenX, origenY, ladoOrigen, ladoOrigen, 0, 0, 512, 512);
    lienzo.toBlob((blob) => {
      setProcesando(false);
      if (blob) onConfirmar(new File([blob], 'avatar.png', { type: 'image/png' }));
    }, 'image/png', 0.92);
  };

  return <div className="recortador-fondo" role="presentation" onMouseDown={onCancelar}>
    <section className="recortador" role="dialog" aria-modal="true" aria-labelledby="recortador-titulo" onMouseDown={(e) => e.stopPropagation()}>
      <h3 id="recortador-titulo">Ajustar imagen de perfil</h3><p>Arrastra la imagen y usa el control para acercar o alejar.</p>
      <div ref={marcoRef} className="recortador-marco" onPointerDown={(e) => { if (!imagen) return; e.currentTarget.setPointerCapture(e.pointerId); setArrastre({ x: e.clientX, y: e.clientY, origen: desplazamiento }); }} onPointerMove={(e) => mover(e.clientX, e.clientY)} onPointerUp={() => setArrastre(null)} onPointerCancel={() => setArrastre(null)}>
        <img ref={imagenRef} src={url} alt="Vista previa para recortar" onLoad={cargarImagen} draggable="false" style={imagen ? { width: `${imagen.ancho}px`, height: `${imagen.alto}px`, transform: `translate(${desplazamiento.x}px, ${desplazamiento.y}px) scale(${escala})` } : undefined} />
        <span className="recortador-cuadricula" aria-hidden="true" />
      </div>
      <label className="recortador-zoom">Zoom<input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => ajustarZoom(e.target.value)} disabled={!imagen || procesando} /></label>
      <div className="recortador-acciones"><button type="button" className="recortador-cancelar" onClick={onCancelar} disabled={procesando}>Cancelar</button><button type="button" onClick={recortar} disabled={!imagen || procesando}>{procesando ? 'Preparando imagen...' : 'Usar esta imagen'}</button></div>
    </section>
  </div>;
}

function CampoContrasena({ label, value, onChange, validarSeguridad = false }) {
  const [visible, setVisible] = useState(false);
  return <label>{label}<span className="perfil-contrasena"><input required type={visible ? 'text' : 'password'} minLength="8" value={value} onChange={onChange} pattern={validarSeguridad ? '(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}' : undefined} /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}><FontAwesomeIcon icon={visible ? faEyeSlash : faEye} /></button></span></label>;
}

function PerfilPage() {
  const { instance, accounts } = useMsal();
  const { usuario, actualizarUsuario } = useUser();
  const [carreras, setCarreras] = useState([]);
  const [nombreCompleto, setNombreCompleto] = useState(usuario?.nombreCompleto ?? '');
  const [idCarrera, setIdCarrera] = useState('');
  const [correoRecuperacion, setCorreoRecuperacion] = useState(usuario?.correoRecuperacion ?? '');
  const [colorAvatar, setColorAvatar] = useState(COLORES_AVATAR.includes(usuario?.colorAvatar) ? usuario.colorAvatar : COLORES_AVATAR[0]);
  const [mensaje, setMensaje] = useState('');
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [archivoParaRecortar, setArchivoParaRecortar] = useState(null);
  const [contrasenas, setContrasenas] = useState({ actual: '', nueva: '', confirmar: '' });
  const esLocal = usuario?.tipoAutenticacion === 'Local' || usuario?.tipoAutenticacion === 'Prueba';
  const token = () => getAccessToken(instance, accounts);

  useEffect(() => {
    getCarrerasRegistro().then((datos) => {
      const ordenadas = ordenarAlfabeticamente(datos, (carrera) => carrera.nombreCarrera);
      setCarreras(ordenadas);
      setIdCarrera(String(ordenadas.find((carrera) => carrera.nombreCarrera === usuario?.carrera)?.idCarrera ?? ''));
    });
  }, [usuario?.carrera]);

  useEffect(() => {
    setNombreCompleto(usuario?.nombreCompleto ?? ''); setCorreoRecuperacion(usuario?.correoRecuperacion ?? ''); setColorAvatar(COLORES_AVATAR.includes(usuario?.colorAvatar) ? usuario.colorAvatar : COLORES_AVATAR[0]);
  }, [usuario]);

  const guardar = async (e) => {
    e.preventDefault(); setMensaje('');
    if (nombreCompleto.trim().length < 5 || !nombreCompletoValido(nombreCompleto)) { setMensaje('El nombre completo debe tener al menos 5 caracteres y contener solo letras y espacios.'); return; }
    try {
      const actualizado = await actualizarPerfil({ nombreCompleto: nombreCompleto.trim(), idCarrera: Number(idCarrera), colorAvatar, ...(esLocal && { correoRecuperacion }) }, await token());
      actualizarUsuario(actualizado); setMensaje('Tus datos y color de avatar se actualizaron correctamente.');
    } catch (error) { setMensaje(error.response?.data || 'No se pudieron actualizar tus datos.'); }
  };

  const seleccionarAvatar = async (e) => {
    const archivo = e.target.files?.[0]; e.target.value = '';
    if (!archivo) return;
    if (!TIPOS_IMAGEN.includes(archivo.type) || archivo.size > 5 * 1024 * 1024) { setMensaje('Selecciona una imagen JPEG, PNG, WEBP o GIF de hasta 5 MB.'); return; }
    setArchivoParaRecortar(archivo);
  };

  const subirAvatarRecortado = async (archivo) => {
    setArchivoParaRecortar(null);
    try { setSubiendoAvatar(true); const actualizado = await actualizarAvatar(archivo, await token()); actualizarUsuario(actualizado); setMensaje('Tu imagen de perfil se actualizó correctamente.'); }
    catch (error) { setMensaje(error.response?.data || 'No se pudo actualizar la imagen de perfil.'); }
    finally { setSubiendoAvatar(false); }
  };

  const quitarAvatar = async () => {
    if (!window.confirm('¿Deseas quitar tu imagen de perfil?')) return;
    try { setSubiendoAvatar(true); const actualizado = await eliminarAvatar(await token()); actualizarUsuario(actualizado); setMensaje('Tu imagen de perfil se eliminó correctamente.'); }
    catch (error) { setMensaje(error.response?.data || 'No se pudo eliminar la imagen de perfil.'); }
    finally { setSubiendoAvatar(false); }
  };

  const guardarContrasena = async (e) => {
    e.preventDefault();
    if (!CONTRASENA_SEGURA.test(contrasenas.nueva)) { setMensaje('La nueva contraseña debe tener 8+ caracteres e incluir letras, números y símbolos.'); return; }
    if (contrasenas.nueva !== contrasenas.confirmar) { setMensaje('La nueva contraseña y su confirmación no coinciden.'); return; }
    try { await cambiarContrasena({ contrasenaActual: contrasenas.actual, nuevaContrasena: contrasenas.nueva }, await token()); setContrasenas({ actual: '', nueva: '', confirmar: '' }); setMensaje('Tu contraseña se actualizó correctamente.'); } catch (error) { setMensaje(error.response?.data || 'No se pudo actualizar la contraseña.'); }
  };

  return <div className="perfil-page">
    <p>Cuenta</p><h2>Mi perfil</h2><span>Actualiza tu nombre, carrera y avatar. El correo de acceso no se puede modificar.</span>
    <form onSubmit={guardar}>
      <section className="perfil-avatar" aria-label="Personalización de avatar"><AvatarUsuario nombre={nombreCompleto || usuario?.nombreCompleto || 'U'} colorAvatar={colorAvatar} urlAvatar={usuario?.urlAvatar} className="perfil-avatar-vista" /><div><strong>Avatar</strong><small>Elige un color de alto contraste o sube una imagen JPEG, PNG, WEBP o GIF de hasta 5 MB.</small></div><div className="perfil-colores" role="radiogroup" aria-label="Color del avatar">{COLORES_AVATAR.map((color) => <button key={color} type="button" className={colorAvatar === color ? 'seleccionado' : ''} style={{ background: color }} onClick={() => setColorAvatar(color)} aria-label={`Seleccionar color ${color}`} aria-pressed={colorAvatar === color}>OL</button>)}</div><div className="perfil-acciones-imagen"><label className="perfil-imagen">{subiendoAvatar ? 'Subiendo imagen...' : 'Cambiar imagen'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={seleccionarAvatar} disabled={subiendoAvatar} /></label>{usuario?.urlAvatar && <button type="button" className="perfil-quitar-imagen" onClick={quitarAvatar} disabled={subiendoAvatar}>Quitar imagen</button>}</div></section>
      <label>Correo electrónico<input value={usuario?.correoInstitucional ?? ''} disabled /></label><label>Nombre completo<input required minLength="5" maxLength="150" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} /></label><label>Carrera<select required value={idCarrera} onChange={(e) => setIdCarrera(e.target.value)}><option value="">Selecciona tu carrera</option>{carreras.map((carrera) => <option key={carrera.idCarrera} value={carrera.idCarrera}>{carrera.nombreCarrera}</option>)}</select></label>{esLocal && <label>Correo de recuperación<input required type="email" value={correoRecuperacion} onChange={(e) => setCorreoRecuperacion(e.target.value)} /></label>}<button>Guardar cambios</button>
    </form>
    {esLocal && <form className="perfil-seccion-contrasena" onSubmit={guardarContrasena}><h3>Seguridad</h3><p>Usaremos este correo para una futura recuperación de acceso.</p><CampoContrasena label="Contraseña actual" value={contrasenas.actual} onChange={(e) => setContrasenas({ ...contrasenas, actual: e.target.value })} /><CampoContrasena label="Nueva contraseña" value={contrasenas.nueva} validarSeguridad onChange={(e) => setContrasenas({ ...contrasenas, nueva: e.target.value })} /><CampoContrasena label="Confirmar nueva contraseña" value={contrasenas.confirmar} validarSeguridad onChange={(e) => setContrasenas({ ...contrasenas, confirmar: e.target.value })} /><button>Cambiar contraseña</button></form>}
    {mensaje && <p className="perfil-mensaje">{mensaje}</p>}
    {archivoParaRecortar && <RecortadorAvatar archivo={archivoParaRecortar} onCancelar={() => setArchivoParaRecortar(null)} onConfirmar={subirAvatarRecortado} />}
  </div>;
}

export default PerfilPage;
