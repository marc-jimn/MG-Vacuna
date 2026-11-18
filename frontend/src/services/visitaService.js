import api from "./api";

const tiempoLimite = { timeout: 15000 };

export const obtenerVisitas = async (filtros = {}) => {
  const respuesta = await api.get("/visitas", {
    params: filtros,
    ...tiempoLimite,
  });
  return respuesta.data;
};

export const obtenerCatalogosVisita = async () => {
  const respuesta = await api.get("/visitas/catalogos", tiempoLimite);
  return respuesta.data;
};

export const crearVisita = async (datos) => {
  const respuesta = await api.post("/visitas", datos, tiempoLimite);
  return respuesta.data;
};

export const actualizarVisita = async (id, datos) => {
  const respuesta = await api.put(`/visitas/${id}`, datos, tiempoLimite);
  return respuesta.data;
};

export const agregarJornadas = async (id, jornadas) => {
  const respuesta = await api.post(`/visitas/${id}/jornadas`, { jornadas }, tiempoLimite);
  return respuesta.data;
};

export const actualizarJornada = async (id, jornadaId, datos) => {
  const respuesta = await api.put(`/visitas/${id}/jornadas/${jornadaId}`, datos, tiempoLimite);
  return respuesta.data;
};

export const eliminarJornada = async (id, jornadaId) => {
  const respuesta = await api.delete(`/visitas/${id}/jornadas/${jornadaId}`, tiempoLimite);
  return respuesta.data;
};

export const cancelarVisita = async (id) => {
  const respuesta = await api.patch(`/visitas/${id}/cancelar`, {}, tiempoLimite);
  return respuesta.data;
};

export const crearPuntoVacunacion = async (datos) => {
  const respuesta = await api.post("/visitas/puntos", datos, tiempoLimite);
  return respuesta.data;
};
