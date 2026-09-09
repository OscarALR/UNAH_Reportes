import apiClient from './axiosConfig.js';

export async function getResumenDashboard(token, fechaDesde, fechaHasta) {
  const response = await apiClient.get('/dashboard/resumen', {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      ...(fechaDesde && { fechaDesde }),
      ...(fechaHasta && { fechaHasta }),
    },
  });
  return response.data;
}
