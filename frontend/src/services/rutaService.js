import api from "./api";

// Consulta las visitas que alimentan el acordeón de campañas y brigadas.
export const obtenerVisitasParaRutas = async () => {
  const respuesta = await api.get("/visitas");
  return respuesta.data;
};

// Consulta rutas y coordenadas de los puntos de una visita.
export const obtenerRecorridosPorVisita = async (visitaId) => {
  const respuesta = await api.get(`/rutas/visitas/${visitaId}`);
  return respuesta.data;
};

// Calcula y guarda las rutas que todavía no existen.
export const calcularRecorridosVisita = async (visitaId) => {
  const respuesta = await api.post(`/rutas/visitas/${visitaId}/calcular`);
  return respuesta.data;
};
