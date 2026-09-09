import apiClient from './axiosConfig.js';

export async function getComentarios(idReporte, token) {
    const response = await apiClient.get(`/reportes/${idReporte}/comentarios`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

export async function crearComentario(idReporte, texto, token) {
    const response = await apiClient.post(
        `/reportes/${idReporte}/comentarios`,
        { texto },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;   
}