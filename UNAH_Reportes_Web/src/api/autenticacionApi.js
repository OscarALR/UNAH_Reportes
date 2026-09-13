import apiClient from './axiosConfig.js';

export async function getCarrerasRegistro() {
  const response = await apiClient.get('/autenticacion/carreras');
  return response.data;
}

export async function registrarCuenta(datos) {
  const response = await apiClient.post('/autenticacion/registro', datos);
  return response.data;
}

export async function ingresarCuenta(correo, contrasena) {
  const response = await apiClient.post('/autenticacion/ingresar', { correo, contrasena });
  return response.data;
}

export async function actualizarPerfil(datos, token) {
  const response = await apiClient.put('/autenticacion/perfil', datos, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
}

export async function actualizarAvatar(archivo, token) {
  const datos = new FormData();
  datos.append('archivo', archivo);
  const response = await apiClient.put('/autenticacion/perfil/avatar', datos, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
}

export async function cambiarContrasena(datos, token) {
  await apiClient.put('/autenticacion/contrasena', datos, { headers: { Authorization: `Bearer ${token}` } });
}

export async function solicitarRecuperacionContrasena(correo) {
  const response = await apiClient.post('/autenticacion/recuperar-contrasena', { correo });
  return response.data;
}

export async function restablecerContrasena(token, nuevaContrasena) {
  await apiClient.post('/autenticacion/restablecer-contrasena', { token, nuevaContrasena });
}
