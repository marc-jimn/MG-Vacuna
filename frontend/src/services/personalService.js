import api from "./api";

export const obtenerPersonal = async (filtros = {}) => {
  const respuesta = await api.get("/personal", {
    params: filtros,
  });

  return respuesta.data;
};

export const obtenerPersonalPorId = async (id) => {
  const respuesta = await api.get(`/personal/${id}`);
  return respuesta.data.datos;
};

export const crearPersonal = async (datos) => {
  const respuesta = await api.post("/personal", datos);
  return respuesta.data;
};

export const actualizarPersonal = async (id, datos) => {
  const respuesta = await api.put(`/personal/${id}`, datos);
  return respuesta.data;
};

export const subirFotoPersonal = async (id, archivo) => {
  const formulario = new FormData();

  formulario.append("foto", archivo);

  const respuesta = await api.post(
    `/personal/${id}/foto`,
    formulario
  );

  return respuesta.data;
};