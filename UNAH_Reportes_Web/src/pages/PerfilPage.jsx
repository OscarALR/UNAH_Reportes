import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useUser } from '../context/UserContext';
import { getAccessToken } from '../auth/getToken';
import { actualizarPerfil, cambiarContrasena, getCarrerasRegistro } from '../api/autenticacionApi';
import { ordenarAlfabeticamente } from '../utils/ordenarAlfabeticamente';
import './PerfilPage.css';

function CampoContrasena({ label, value, onChange }) {
  const [visible, setVisible] = useState(false);
  return <label>{label}<span className="perfil-contrasena"><input required type={visible ? 'text' : 'password'} minLength="8" value={value} onChange={onChange} /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}><FontAwesomeIcon icon={visible ? faEyeSlash : faEye} /></button></span></label>;
}

function PerfilPage() {
  const { instance, accounts } = useMsal();
  const { usuario, actualizarUsuario } = useUser();
  const [carreras, setCarreras] = useState([]);
  const [nombreCompleto, setNombreCompleto] = useState(usuario?.nombreCompleto ?? '');
  const [idCarrera, setIdCarrera] = useState('');
  const [correoRecuperacion, setCorreoRecuperacion] = useState(usuario?.correoRecuperacion ?? '');
  const [mensaje, setMensaje] = useState('');
  const [contrasenas, setContrasenas] = useState({ actual: '', nueva: '', confirmar: '' });
  const esLocal = usuario?.tipoAutenticacion === 'Local' || usuario?.tipoAutenticacion === 'Prueba';

  useEffect(() => { getCarrerasRegistro().then((datos) => { const carrerasOrdenadas = ordenarAlfabeticamente(datos, (carrera) => carrera.nombreCarrera); setCarreras(carrerasOrdenadas); setIdCarrera(String(carrerasOrdenadas.find((carrera) => carrera.nombreCarrera === usuario?.carrera)?.idCarrera ?? '')); }); }, [usuario?.carrera]);
  const token = () => getAccessToken(instance, accounts);
  const guardar = async (e) => { e.preventDefault(); setMensaje(''); try { const actualizado = await actualizarPerfil({ nombreCompleto, idCarrera: Number(idCarrera), ...(esLocal && { correoRecuperacion }) }, await token()); actualizarUsuario(actualizado); setMensaje('Tus datos se actualizaron correctamente.'); } catch { setMensaje('No se pudieron actualizar tus datos.'); } };
  const guardarContrasena = async (e) => { e.preventDefault(); if (contrasenas.nueva !== contrasenas.confirmar) { setMensaje('La nueva contraseña y su confirmación no coinciden.'); return; } try { await cambiarContrasena({ contrasenaActual: contrasenas.actual, nuevaContrasena: contrasenas.nueva }, await token()); setContrasenas({ actual: '', nueva: '', confirmar: '' }); setMensaje('Tu contraseña se actualizó correctamente.'); } catch (error) { setMensaje(error.response?.data || 'No se pudo actualizar la contraseña.'); } };

  return <div className="perfil-page"><p>Cuenta</p><h2>Mi perfil</h2><span>Actualiza tu nombre y carrera. El correo de acceso no se puede modificar.</span><form onSubmit={guardar}><label>Correo electrónico<input value={usuario?.correoInstitucional ?? ''} disabled /></label><label>Nombre completo<input required value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} /></label><label>Carrera<select required value={idCarrera} onChange={(e) => setIdCarrera(e.target.value)}><option value="">Selecciona tu carrera</option>{carreras.map((carrera) => <option key={carrera.idCarrera} value={carrera.idCarrera}>{carrera.nombreCarrera}</option>)}</select></label>{esLocal && <label>Correo de recuperación<input required type="email" value={correoRecuperacion} onChange={(e) => setCorreoRecuperacion(e.target.value)} /></label>}<button>Guardar cambios</button></form>{esLocal && <form className="perfil-seccion-contrasena" onSubmit={guardarContrasena}><h3>Seguridad</h3><p>Usaremos este correo para una futura recuperación de acceso.</p><CampoContrasena label="Contraseña actual" value={contrasenas.actual} onChange={(e) => setContrasenas({ ...contrasenas, actual: e.target.value })} /><CampoContrasena label="Nueva contraseña" value={contrasenas.nueva} onChange={(e) => setContrasenas({ ...contrasenas, nueva: e.target.value })} /><CampoContrasena label="Confirmar nueva contraseña" value={contrasenas.confirmar} onChange={(e) => setContrasenas({ ...contrasenas, confirmar: e.target.value })} /><button>Cambiar contraseña</button></form>}{mensaje && <p className="perfil-mensaje">{mensaje}</p>}</div>;
}
export default PerfilPage;
