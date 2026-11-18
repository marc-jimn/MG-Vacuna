export const numero = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

export const cantidad = (valor) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(numero(valor));

export const fechaCorta = (valor) => {
  if (!valor) return "Fecha pendiente";
  const fecha = new Date(`${String(valor).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return "Fecha pendiente";
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(fecha);
};

export const hora = (valor) => String(valor || "").slice(0, 5);

export const fechaLargaActual = () => new Intl.DateTimeFormat("es-MX", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
}).format(new Date());

export const iconoAviso = (severidad) => ({
  danger: "error",
  warning: "warning",
  success: "task_alt",
  info: "info",
}[severidad] || "notifications");

export const textoEstadoJornada = (estado) => ({
  programada: "Programada",
  en_curso: "En curso",
  completada: "Completada",
  cancelada: "Cancelada",
}[estado] || estado || "Sin estado");

export const textoMovimiento = (tipo) => ({
  recepcion_campania: "Recepción de biológico",
  recepcion_programada: "Recepción programada",
  entrega_brigada: "Entrega a brigada",
  entrega_visita: "Entrega a visita",
  entrega_jornada: "Entrega a jornada",
  aplicacion: "Dosis aplicadas",
  devolucion_jornada: "Devolución de jornada",
  devolucion_visita: "Devolución de visita",
  devolucion_brigada: "Devolución de brigada",
  devolucion_campania: "Devolución a campaña",
  merma: "Merma registrada",
  entrada: "Entrada de insumos",
  salida: "Salida de insumos",
  ajuste_positivo: "Ajuste positivo",
  ajuste_negativo: "Ajuste negativo",
}[tipo] || String(tipo || "Movimiento").replaceAll("_", " "));
