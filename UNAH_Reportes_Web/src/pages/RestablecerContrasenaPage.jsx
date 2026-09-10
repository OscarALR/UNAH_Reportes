import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { restablecerContrasena } from '../api/autenticacionApi';
import './RestablecerContrasenaPage.css';

function RestablecerContrasenaPage() {
  const [searchParams] = useSearchParams();
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [completado, setCompletado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const token = searchParams.get('token') ?? '';

  const enviar = async (event) => {
    event.preventDefault();
    setError('');
    if (!token) { setError('El enlace de recuperación no es válido.'); return; }
    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(nuevaContrasena)) { setError('La contraseña debe tener 8+ caracteres e incluir letras, números y símbolos.'); return; }
    if (nuevaContrasena !== confirmacion) { setError('Las contraseñas no coinciden.'); return; }
    setEnviando(true);
    try {
      await restablecerContrasena(token, nuevaContrasena);
      setCompletado(true);
    } catch (respuesta) {
      setError(respuesta.response?.data || 'El enlace no es válido o ya venció. Solicita uno nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return <main className="restablecer-page"><section className="restablecer-tarjeta"><p className="restablecer-etiqueta">RiUVS · Seguridad</p><h1>Restablece tu contraseña</h1>{completado ? <><p>Tu contraseña se actualizó. Ya puedes iniciar sesión.</p><Link to="/" className="restablecer-boton">Ir al inicio de sesión</Link></> : <form onSubmit={enviar}><p>Elige una contraseña nueva y segura para tu cuenta local.</p><label>Nueva contraseña<span className="restablecer-contrasena"><input required type={mostrarNueva ? 'text' : 'password'} minLength="8" value={nuevaContrasena} onChange={(event) => setNuevaContrasena(event.target.value)} /><button type="button" onClick={() => setMostrarNueva((visible) => !visible)} aria-label={mostrarNueva ? 'Ocultar contraseña' : 'Mostrar contraseña'} title={mostrarNueva ? 'Ocultar contraseña' : 'Mostrar contraseña'}><FontAwesomeIcon icon={mostrarNueva ? faEyeSlash : faEye} /></button></span></label><label>Confirmar contraseña<span className="restablecer-contrasena"><input required type={mostrarConfirmacion ? 'text' : 'password'} minLength="8" value={confirmacion} onChange={(event) => setConfirmacion(event.target.value)} /><button type="button" onClick={() => setMostrarConfirmacion((visible) => !visible)} aria-label={mostrarConfirmacion ? 'Ocultar contraseña' : 'Mostrar contraseña'} title={mostrarConfirmacion ? 'Ocultar contraseña' : 'Mostrar contraseña'}><FontAwesomeIcon icon={mostrarConfirmacion ? faEyeSlash : faEye} /></button></span></label>{error && <p className="restablecer-error" role="alert">{error}</p>}<button disabled={enviando}>{enviando ? 'Actualizando...' : 'Restablecer contraseña'}</button><Link to="/">Volver al inicio de sesión</Link></form>}</section></main>;
}

export default RestablecerContrasenaPage;
