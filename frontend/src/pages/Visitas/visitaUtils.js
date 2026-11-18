export const nombresEstados = {
  planeada: "Planeada",
  activa: "En curso",
  completada: "Completada",
  cancelada: "Cancelada",
};

export const nombresEstadosJornada = {
  programada: "Programada",
  en_curso: "En curso",
  completada: "Completada",
  cancelada: "Cancelada",
};

export const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function obtenerLista(respuesta) {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.datos)) return respuesta.datos;
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  return [];
}

export function obtenerDatos(respuesta) {
  return respuesta?.datos ?? respuesta?.data ?? respuesta;
}

export function obtenerMensajeError(error, predeterminado = "Ocurrió un error.") {
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return "La solicitud tardó demasiado. Comprueba que el backend esté activo e inténtalo nuevamente.";
  }
  return error.response?.data?.mensaje || error.response?.data?.message || error.message || predeterminado;
}

export function fechaLocal(fecha) {
  if (!fecha) return null;
  const [anio, mes, dia] = String(fecha).slice(0, 10).split("-").map(Number);
  if (!anio || !mes || !dia) return null;
  return new Date(anio, mes - 1, dia);
}

export function fechaISO(fecha) {
  if (!fecha) return "";
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export function obtenerHoy() {
  const ahora = new Date();
  return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
}

export function agregarDias(fecha, cantidad) {
  const resultado = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  resultado.setDate(resultado.getDate() + cantidad);
  return resultado;
}

export function diferenciaDias(fechaA, fechaB) {
  const a = Date.UTC(fechaA.getFullYear(), fechaA.getMonth(), fechaA.getDate());
  const b = Date.UTC(fechaB.getFullYear(), fechaB.getMonth(), fechaB.getDate());
  return Math.round((b - a) / 86400000);
}

export function formatearFecha(fecha, incluirAnio = false) {
  const valor = fechaLocal(fecha);
  if (!valor) return "Sin fecha";
  return valor.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    ...(incluirAnio ? { year: "numeric" } : {}),
  });
}

export function formatearRango(inicio, fin) {
  const a = fechaLocal(inicio);
  const b = fechaLocal(fin);
  if (!a || !b) return "Sin fechas";
  if (inicio === fin) return formatearFecha(inicio, true);
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) {
    return `${a.getDate()}–${b.getDate()} de ${b.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}`;
  }
  return `${formatearFecha(inicio)} – ${formatearFecha(fin, true)}`;
}

export function formatearHora(hora) {
  return hora ? String(hora).slice(0, 5) : "--:--";
}

export function formatoNumero(valor) {
  return Number(valor || 0).toLocaleString("es-MX");
}

export function colorCampania(visita) {
  if (visita.campania_codigo === "CAM-006") return "vph";
  if (visita.campania_codigo === "CAM-007") return "influenza";
  if (visita.campania_codigo === "CAM-010") return "rabia";
  return visita.campania_categoria === "veterinaria" ? "rabia" : "vph";
}

export function codigoSiguiente(visitas) {
  const mayor = visitas.reduce((maximo, visita) => {
    const valor = Number(String(visita.codigo || "").replace("VIS-", ""));
    return Number.isFinite(valor) ? Math.max(maximo, valor) : maximo;
  }, 0);
  return `VIS-${String(mayor + 1).padStart(3, "0")}`;
}

export function jornadaVacia() {
  return {
    punto_vacunacion_id: "",
    fecha_inicio: "",
    fecha_fin: "",
    hora_inicio: "08:00",
    hora_fin: "14:00",
    dosis_asignadas: "",
    objetivo_dosis: "",
    observaciones: "",
  };
}
