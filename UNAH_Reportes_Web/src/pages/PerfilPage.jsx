import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useUser } from '../context/UserContext';
import { getAccessToken } from '../auth/getToken';
import { actualizarAvatar, actualizarPerfil, cambiarContrasena, getCarrerasRegistro } from '../api/autenticacionApi';
import { ordenarAlfabeticamente } from '../utils/ordenarAlfabeticamente';
import AvatarUsuario from '../components/AvatarUsuario';
import './PerfilPage.css';

const CONTRASENA_SEGURA = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const nombreCompletoValido = (nombre) => /^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$/u.test(nombre.trim());

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
  const [colorAvatar, setColorAvatar] = useState(usuario?.colorAvatar ?? '#2a9d70');
  const [mensaje, setMensaje] = useState('');
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
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
    setNombreCompleto(usuario?.nombreCompleto ?? ''); setCorreoRecuperacion(usuario?.correoRecuperacion ?? ''); setColorAvatar(usuario?.colorAvatar ?? '#2a9d70');
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
    try { setSubiendoAvatar(true); const actualizado = await actualizarAvatar(archivo, await token()); actualizarUsuario(actualizado); setMensaje('Tu imagen de perfil se actualizó correctamente.'); }
    catch (error) { setMensaje(error.response?.data || 'No se pudo actualizar la imagen de perfil.'); }
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
      <section className="perfil-avatar" aria-label="Personalización de avatar"><AvatarUsuario nombre={nombreCompleto || usuario?.nombreCompleto || 'U'} colorAvatar={colorAvatar} urlAvatar={usuario?.urlAvatar} className="perfil-avatar-vista" /><div><strong>Avatar</strong><small>Elige un color o sube una imagen JPEG, PNG, WEBP o GIF de hasta 5 MB.</small></div><label className="perfil-color">Color<input type="color" value={colorAvatar} onChange={(e) => setColorAvatar(e.target.value)} aria-label="Color del avatar" /></label><label className="perfil-imagen">{subiendoAvatar ? 'Subiendo imagen...' : 'Cambiar imagen'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={seleccionarAvatar} disabled={subiendoAvatar} /></label></section>
      <label>Correo electrónico<input value={usuario?.correoInstitucional ?? ''} disabled /></label><label>Nombre completo<input required minLength="5" maxLength="150" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} /></label><label>Carrera<select required value={idCarrera} onChange={(e) => setIdCarrera(e.target.value)}><option value="">Selecciona tu carrera</option>{carreras.map((carrera) => <option key={carrera.idCarrera} value={carrera.idCarrera}>{carrera.nombreCarrera}</option>)}</select></label>{esLocal && <label>Correo de recuperación<input required type="email" value={correoRecuperacion} onChange={(e) => setCorreoRecuperacion(e.target.value)} /></label>}<button>Guardar cambios</button>
    </form>
    {esLocal && <form className="perfil-seccion-contrasena" onSubmit={guardarContrasena}><h3>Seguridad</h3><p>Usaremos este correo para una futura recuperación de acceso.</p><CampoContrasena label="Contraseña actual" value={contrasenas.actual} onChange={(e) => setContrasenas({ ...contrasenas, actual: e.target.value })} /><CampoContrasena label="Nueva contraseña" value={contrasenas.nueva} validarSeguridad onChange={(e) => setContrasenas({ ...contrasenas, nueva: e.target.value })} /><CampoContrasena label="Confirmar nueva contraseña" value={contrasenas.confirmar} validarSeguridad onChange={(e) => setContrasenas({ ...contrasenas, confirmar: e.target.value })} /><button>Cambiar contraseña</button></form>}
    {mensaje && <p className="perfil-mensaje">{mensaje}</p>}
  </div>;
}

export default PerfilPage;
