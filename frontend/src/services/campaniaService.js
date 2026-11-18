import api from "./api";

export const obtenerCampanias = async () => {
  const respuesta = await api.get("/campanias");
  return respuesta.data;
};

export const obtenerCampaniaPorId = async (id) => {
  const respuesta = await api.get(`/campanias/${id}`);
  return respuesta.data;
};

export const obtenerResponsablesCampania = async () => {
  const respuesta = await api.get("/campanias/responsables");
  return respuesta.data;
};

export const crearCampania = async (datos) => {
  const respuesta = await api.post("/campanias", datos);
  return respuesta.data;
};

export const actualizarCampania = async (id, datos) => {
  const respuesta = await api.put(`/campanias/${id}`, datos);
  return respuesta.data;
};