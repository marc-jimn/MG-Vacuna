import api from "./api";

const extraerCuerpo = (respuesta) => respuesta?.data ?? respuesta;

export const obtenerInicioTablero = async () => {
  const respuesta = await api.get("/tablero/inicio");
  const cuerpo = extraerCuerpo(respuesta);
  return cuerpo?.datos ?? cuerpo;
};

export const obtenerReportes = async (filtros = {}) => {
  const respuesta = await api.get("/reportes", { params: filtros });
  const cuerpo = extraerCuerpo(respuesta);
  return cuerpo?.datos ?? cuerpo;
};
