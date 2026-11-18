import api from "./api";

export const obtenerLocalidades = async () => {
  const respuesta = await api.get("/localidades");
  return respuesta.data;
};

export const obtenerLocalidadPorId = async (id) => {
  const respuesta = await api.get(`/localidades/${id}`);
  return respuesta.data;
};

export const crearLocalidad = async (datos) => {
  const respuesta = await api.post("/localidades", datos);
  return respuesta.data;
};

export const actualizarLocalidad = async (id, datos) => {
  const respuesta = await api.put(`/localidades/${id}`, datos);
  return respuesta.data;
};

export const cambiarEstadoLocalidad = async (id, activa) => {
  const respuesta = await api.patch(`/localidades/${id}/estado`, {
    activa,
  });

  return respuesta.data;
};

export const asignarCampaniasALocalidades = async (
  campaniaId,
  localidadIds
) => {
  const respuesta = await api.put("/localidades/campanias/asignaciones", {
    campania_id: campaniaId,
    localidad_ids: localidadIds,
  });

  return respuesta.data;
};