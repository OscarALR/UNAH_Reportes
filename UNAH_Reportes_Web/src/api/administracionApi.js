import apiClient from './axiosConfig.js';

function configuracion(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export async function getCategoriasAdministracion(token) {
  const response = await apiClient.get('/administracion/categorias', configuracion(token));
  return response.data;
}

export async function crearCategoria(nombreCategoria, token) {
  const response = await apiClient.post(
    '/administracion/categorias',
    { nombreCategoria },
    configuracion(token)
  );
  return response.data;
}

export async function actualizarCategoria(idCategoria, nombreCategoria, token) {
  const response = await apiClient.put(
    `/administracion/categorias/${idCategoria}`,
    { nombreCategoria },
    configuracion(token)
  );
  return response.data;
}

export async function eliminarCategoria(idCategoria, token) {
  await apiClient.delete(`/administracion/categorias/${idCategoria}`, configuracion(token));
}

export async function getCarrerasAdministracion(token) {
  const response = await apiClient.get('/administracion/carreras', configuracion(token));
  return response.data;
}

export async function crearCarrera(nombreCarrera, token) {
  const response = await apiClient.post('/administracion/carreras', { nombreCarrera }, configuracion(token));
  return response.data;
}

export async function actualizarCarrera(idCarrera, nombreCarrera, token) {
  const response = await apiClient.put(`/administracion/carreras/${idCarrera}`, { nombreCarrera }, configuracion(token));
  return response.data;
}

export async function eliminarCarrera(idCarrera, token) {
  await apiClient.delete(`/administracion/carreras/${idCarrera}`, configuracion(token));
}

export async function getEdificiosAdministracion(token) {
  const response = await apiClient.get('/administracion/edificios', configuracion(token));
  return response.data;
}

export async function crearEdificio(datos, token) {
  const response = await apiClient.post('/administracion/edificios', datos, configuracion(token));
  return response.data;
}

export async function actualizarEdificio(idEdificio, datos, token) {
  const response = await apiClient.put(`/administracion/edificios/${idEdificio}`, datos, configuracion(token));
  return response.data;
}

export async function eliminarEdificio(idEdificio, token) {
  await apiClient.delete(`/administracion/edificios/${idEdificio}`, configuracion(token));
}

export async function getTiposEspacioAdministracion(token) {
  const response = await apiClient.get('/administracion/tipos-espacio', configuracion(token));
  return response.data;
}

export async function crearTipoEspacio(nombreTipo, token) {
  const response = await apiClient.post('/administracion/tipos-espacio', { nombreTipo }, configuracion(token));
  return response.data;
}

export async function actualizarTipoEspacio(idTipoEspacio, nombreTipo, token) {
  const response = await apiClient.put(`/administracion/tipos-espacio/${idTipoEspacio}`, { nombreTipo }, configuracion(token));
  return response.data;
}

export async function eliminarTipoEspacio(idTipoEspacio, token) {
  await apiClient.delete(`/administracion/tipos-espacio/${idTipoEspacio}`, configuracion(token));
}

export async function getEspaciosAdministracion(token) {
  const response = await apiClient.get('/administracion/espacios', configuracion(token));
  return response.data;
}

export async function crearEspacio(datos, token) {
  const response = await apiClient.post('/administracion/espacios', datos, configuracion(token));
  return response.data;
}

export async function actualizarEspacio(idEspacio, datos, token) {
  const response = await apiClient.put(`/administracion/espacios/${idEspacio}`, datos, configuracion(token));
  return response.data;
}

export async function eliminarEspacio(idEspacio, token) {
  await apiClient.delete(`/administracion/espacios/${idEspacio}`, configuracion(token));
}

export async function getEstadosAdministracion(token) {
  const response = await apiClient.get('/administracion/estados', configuracion(token));
  return response.data;
}

export async function crearEstado(nombreEstado, token) {
  const response = await apiClient.post('/administracion/estados', { nombreEstado }, configuracion(token));
  return response.data;
}

export async function actualizarEstado(idEstado, nombreEstado, token) {
  const response = await apiClient.put(`/administracion/estados/${idEstado}`, { nombreEstado }, configuracion(token));
  return response.data;
}

export async function eliminarEstado(idEstado, token) {
  await apiClient.delete(`/administracion/estados/${idEstado}`, configuracion(token));
}

export async function getUsuariosAdministracion(token) {
  const response = await apiClient.get('/administracion/usuarios', configuracion(token));
  return response.data;
}

export async function getCatalogosUsuariosAdministracion(token) {
  const response = await apiClient.get('/administracion/usuarios/catalogos', configuracion(token));
  return response.data;
}

export async function crearUsuario(datos, token) {
  const response = await apiClient.post('/administracion/usuarios', datos, configuracion(token));
  return response.data;
}

export async function actualizarUsuario(idUsuario, datos, token) {
  const response = await apiClient.put(`/administracion/usuarios/${idUsuario}`, datos, configuracion(token));
  return response.data;
}

export async function eliminarUsuario(idUsuario, token) {
  await apiClient.delete(`/administracion/usuarios/${idUsuario}`, configuracion(token));
}
