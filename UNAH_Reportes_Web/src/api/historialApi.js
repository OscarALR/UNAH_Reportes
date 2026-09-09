import apiClient from './axiosConfig.js';

export async function getHistorial(idReporte, token) { 
    const response = await apiClient.get(`/reportes/${idReporte}/historial`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}