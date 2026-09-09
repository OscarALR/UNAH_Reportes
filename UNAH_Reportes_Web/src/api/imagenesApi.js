import apiClient from './axiosConfig.js';

export async function getImagenes(idReporte, token) {
    const response = await apiClient.get(`/reportes/${idReporte}/imagenes`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

export async function subirImagen(idReporte, archivo, token) {
  const formData = new FormData();
  formData.append('archivo', archivo);

  const response = await apiClient.post(
    `/reportes/${idReporte}/imagenes`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}