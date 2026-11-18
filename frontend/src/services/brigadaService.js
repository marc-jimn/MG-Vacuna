import api from "./api";

// Obtener brigadas, con filtros opcionales.
export const obtenerBrigadas = async (filtros = {}) => {
  const respuesta = await api.get("/brigadas", {
    params: filtros,
  });

  return respuesta.data;
};

// Obtener una brigada con sus integrantes y localidades.
export const obtenerBrigadaPorId = async (id) => {
  const respuesta = await api.get(`/brigadas/${id}`);
  return respuesta.data;
};

// Registrar una brigada.
export const crearBrigada = async (datos) => {
  const respuesta = await api.post("/brigadas", datos);
  return respuesta.data;
};

// Actualizar datos generales.
export const actualizarBrigada = async (id, datos) => {
  const respuesta = await api.put(`/brigadas/${id}`, datos);
  return respuesta.data;
};

// Asignar o reemplazar integrantes.
export const asignarIntegrantes = async (id, integrantes) => {
  const respuesta = await api.put(`/brigadas/${id}/integrantes`, {
    integrantes,
  });

  return respuesta.data;
};

// Asignar o reemplazar localidades.
export const asignarLocalidades = async (id, localidadIds) => {
  const respuesta = await api.put(`/brigadas/${id}/localidades`, {
    localidad_ids: localidadIds,
  });

  return respuesta.data;
};