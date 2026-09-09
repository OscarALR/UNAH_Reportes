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

export async function cambiarContrasena(datos, token) {
  await apiClient.put('/autenticacion/contrasena', datos, { headers: { Authorization: `Bearer ${token}` } });
}
