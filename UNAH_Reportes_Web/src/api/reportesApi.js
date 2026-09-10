import apiClient from './axiosConfig.js';

export async function getFeed(idUsuario, token) { 
    const response = await apiClient.get(`/reportes/feed/${idUsuario}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

export async function crearReporte(reporteData, token) {
    const response = await apiClient.post('/reportes', reporteData, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

export async function getReportePorId(idReporte, token) { 
    const response = await apiClient.get(`/reportes/${idReporte}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

export async function getTodosLosReportes(token) {
  const response = await apiClient.get('/reportes', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function cambiarEstado(idReporte, idEstado, comentario, token) {
  const response = await apiClient.put(
    `/reportes/${idReporte}/estado`,
    { idEstado, comentario },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

export async function asignarGestor(idReporte, idGestorAsignado, token) {
  const response = await apiClient.put(
    `/reportes/${idReporte}/asignar`,
    { idGestorAsignado },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

export async function getMisReportes(token) {
  const response = await apiClient.get('/reportes/mios', { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
}

export async function getReportesArchivados(tipo, alcance, token) {
  const response = await apiClient.get('/reportes/archivados', {
    headers: { Authorization: `Bearer ${token}` },
    params: { ...(tipo && { tipo }), ...(alcance && { alcance }) },
  });
  return response.data;
}

export async function archivarReporte(idReporte, motivo, token) {
  await apiClient.put(`/reportes/${idReporte}/archivar`, { motivo }, { headers: { Authorization: `Bearer ${token}` } });
}

export async function alternarLikeReporte(idReporte, token) {
  const response = await apiClient.post(`/reportes/${idReporte}/likes`, {}, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
}
