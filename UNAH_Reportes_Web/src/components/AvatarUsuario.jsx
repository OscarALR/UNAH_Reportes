import './AvatarUsuario.css';

export function inicialesUsuario(nombre = '') {
  return nombre.split(' ').filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || 'U';
}

function tonoAvatar(nombre = '') {
  return [...nombre].reduce((total, caracter) => total + caracter.charCodeAt(0), 0) % 360;
}

function AvatarUsuario({ nombre, className = '' }) {
  return <span className={`avatar-usuario ${className}`} style={{ '--tono-avatar': tonoAvatar(nombre) }} aria-label={`Avatar de ${nombre}`}>{inicialesUsuario(nombre)}</span>;
}

export default AvatarUsuario;
