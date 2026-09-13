import './AvatarUsuario.css';

export function inicialesUsuario(nombre = '') {
  return nombre.split(' ').filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || 'U';
}

function tonoAvatar(nombre = '') {
  return [...nombre].reduce((total, caracter) => total + caracter.charCodeAt(0), 0) % 360;
}

function AvatarUsuario({ nombre, className = '', colorAvatar, urlAvatar }) {
  const estilo = colorAvatar ? { '--color-avatar': colorAvatar } : { '--tono-avatar': tonoAvatar(nombre) };
  return <span className={`avatar-usuario ${className}`} style={estilo} aria-label={`Avatar de ${nombre}`}>{urlAvatar ? <img src={urlAvatar} alt="" /> : inicialesUsuario(nombre)}</span>;
}

export default AvatarUsuario;
