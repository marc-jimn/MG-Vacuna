import api from "./api";

const obtenerVehiculos = async () => {
  const respuesta = await api.get("/vehiculos");
  return respuesta.data;
};

const obtenerVehiculoPorId = async (id) => {
  const respuesta = await api.get(`/vehiculos/${id}`);
  return respuesta.data;
};

const crearVehiculo = async (datos) => {
  const respuesta = await api.post("/vehiculos", datos);
  return respuesta.data;
};

const actualizarVehiculo = async (id, datos) => {
  const respuesta = await api.put(`/vehiculos/${id}`, datos);
  return respuesta.data;
};

const vehiculoService = {
  obtenerVehiculos,
  obtenerVehiculoPorId,
  crearVehiculo,
  actualizarVehiculo,
};

export default vehiculoService;