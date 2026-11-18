import api from "./api";

export const obtenerRoles = async () => {
  const respuesta = await api.get("/roles");
  return respuesta.data.datos;
};