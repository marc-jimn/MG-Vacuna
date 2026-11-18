import api from "./api";

const respuestaBackend = (respuesta) => respuesta?.data ?? respuesta;

export const extraerDatosRespuesta = (respuesta) => {
  const cuerpo = respuestaBackend(respuesta);
  return cuerpo?.datos ?? cuerpo?.data?.datos ?? cuerpo?.data ?? cuerpo;
};

export const obtenerMensajeErrorInventario = (
  error,
  respaldo = "No fue posible completar la operación."
) =>
  error?.response?.data?.mensaje ||
  error?.response?.data?.detalle ||
  error?.message ||
  respaldo;

export const obtenerResumenInventario = async () =>
  respuestaBackend(await api.get("/inventario/resumen"));

export const obtenerBiologicos = async () =>
  respuestaBackend(await api.get("/inventario/biologicos"));

export const obtenerDetalleCampaniaBiologica = async (campaniaId) =>
  respuestaBackend(
    await api.get(
      `/inventario/biologicos/campanias/${encodeURIComponent(campaniaId)}`
    )
  );

export const obtenerMovimientosBiologicos = async (filtros = {}) =>
  respuestaBackend(
    await api.get("/inventario/biologicos/movimientos", { params: filtros })
  );

export const registrarRecepcionBiologica = async (datos) =>
  respuestaBackend(await api.post("/inventario/biologicos/recepciones", datos));

export const confirmarRecepcionProgramada = async (id, datos) =>
  respuestaBackend(
    await api.post(`/inventario/biologicos/recepciones/${id}/confirmar`, datos)
  );

export const actualizarLoteBiologico = async (id, datos) =>
  respuestaBackend(await api.patch(`/inventario/biologicos/lotes/${id}`, datos));

export const registrarMovimientoBiologico = async (datos) =>
  respuestaBackend(await api.post("/inventario/biologicos/movimientos", datos));

export const obtenerInsumos = async () =>
  respuestaBackend(await api.get("/inventario/insumos"));

export const obtenerMovimientosInsumos = async (filtros = {}) =>
  respuestaBackend(
    await api.get("/inventario/insumos/movimientos", { params: filtros })
  );

export const registrarMovimientoInsumo = async (datos) =>
  respuestaBackend(await api.post("/inventario/insumos/movimientos", datos));

export const crearInsumo = async (datos) =>
  respuestaBackend(await api.post("/inventario/insumos", datos));

export const actualizarInsumo = async (id, datos) =>
  respuestaBackend(await api.patch(`/inventario/insumos/${id}`, datos));

export const obtenerNotificaciones = async (filtros = {}) =>
  respuestaBackend(
    await api.get("/inventario/notificaciones", { params: filtros })
  );

export const marcarNotificacionLeida = async (id) =>
  respuestaBackend(await api.patch(`/inventario/notificaciones/${id}/leer`));

export const resolverNotificacion = async (id) =>
  respuestaBackend(await api.patch(`/inventario/notificaciones/${id}/resolver`));