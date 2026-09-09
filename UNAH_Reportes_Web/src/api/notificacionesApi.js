import apiClient from './axiosConfig';

export async function getNotificaciones(idUsuario, token) {
  const response = await apiClient.get(`/usuarios/${idUsuario}/notificaciones`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function marcarLeida(idUsuario, idNotificacion, token) {
  const response = await apiClient.put(
    `/usuarios/${idUsuario}/notificaciones/${idNotificacion}/leida`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}