import apiClient from './axiosConfig.js';

export async function getCategorias(){ 
    const response = await apiClient.get('/categorias');
    return response.data;
}

export async function getEdificios(){
    const response = await apiClient.get('/edificios');
    return response.data;
}

export async function getEspaciosSinEdificio(){
    const response = await apiClient.get('/espacios/sin-edificio');
    return response.data;
}

export async function getEspaciosDeEdificio(idEdificio){
    const response = await apiClient.get(`/edificios/${idEdificio}/espacios`);
    return response.data;
}

export async function getEstados(){
    const response = await apiClient.get('/estados');
    return response.data;
}