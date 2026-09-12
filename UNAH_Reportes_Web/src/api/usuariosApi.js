import apiClient from './axiosConfig';

export async function getPerfilPublicoUsuario(idUsuario, token) {
  const response = await apiClient.get(`/usuarios/${idUsuario}/perfil`, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
}
