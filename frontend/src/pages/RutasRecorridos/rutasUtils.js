export const ORIGEN = {
  nombre: "Jurisdicción Sanitaria 1",
  direccion: "Av. 10ª Norte Poniente #987, esquina con 9ª Norte Poniente, Col. Vista Hermosa / Centro, C.P. 29030",
  latitud: 16.7601,
  longitud: -93.1235,
};

export const PALETA_RUTAS = [
  "#4778C7",
  "#D38B3D",
  "#36927D",
  "#9368BB",
  "#C45D75",
  "#438CA6",
  "#9A8A42",
  "#6479A8",
];

export const ESTADOS_VISITA = {
  planeada: "Planeada",
  activa: "En curso",
  completada: "Completada",
  cancelada: "Cancelada",
};

export const ESTADOS_JORNADA = {
  programada: "Programada",
  en_curso: "En curso",
  completada: "Completada",
  cancelada: "Cancelada",
};

export function extraerLista(respuesta) {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.datos)) return respuesta.datos;
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  return [];
}

export function extraerRutas(respuesta) {
  const datos = respuesta?.datos ?? respuesta?.data ?? respuesta;
  if (Array.isArray(datos?.recorridos)) return datos.recorridos;
  if (Array.isArray(datos)) return datos;
  return [];
}

export function normalizarFecha(fecha) {
  if (!fecha) return null;
  // PostgreSQL puede devolver DATE como YYYY-MM-DD o como ISO con hora UTC.
  const texto = String(fecha).slice(0, 10);
  const [anio, mes, dia] = texto.split("-").map(Number);
  if (!anio || !mes || !dia) return null;
  return new Date(anio, mes - 1, dia);
}

export function formatearFecha(fecha, conAnio = false) {
  const valor = normalizarFecha(fecha);
  if (!valor) return "Fecha pendiente";
  return valor.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    ...(conAnio ? { year: "numeric" } : {}),
  });
}

export function formatearRango(inicio, fin) {
  const a = normalizarFecha(inicio);
  const b = normalizarFecha(fin);
  if (!a || !b) return "Fechas pendientes";
  if (a.getTime() === b.getTime()) return formatearFecha(inicio, true);

  const mismoMes =
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (mismoMes) {
    return `${a.getDate()}–${b.getDate()} ${b.toLocaleDateString("es-MX", {
      month: "short",
      year: "numeric",
    })}`;
  }

  return `${formatearFecha(inicio)} – ${formatearFecha(fin, true)}`;
}

export function formatearHora(hora) {
  return hora ? String(hora).slice(0, 5) : "--:--";
}

export function formatearDistancia(metros) {
  const valor = Number(metros);
  if (!Number.isFinite(valor)) return "Por calcular";
  if (valor >= 1000) return `${(valor / 1000).toFixed(1)} km`;
  return `${Math.round(valor)} m`;
}

export function formatearDuracion(segundos) {
  const valor = Number(segundos);
  if (!Number.isFinite(valor)) return "Por calcular";
  const minutos = Math.round(valor / 60);
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
}

export function obtenerMensajeError(error, predeterminado = "Ocurrió un error.") {
  return (
    error?.response?.data?.mensaje ||
    error?.response?.data?.message ||
    error?.message ||
    predeterminado
  );
}

export function agruparCampanias(visitas = []) {
  const grupos = new Map();

  visitas.forEach((visita) => {
    const clave = String(visita.campania_id ?? visita.campania_codigo ?? "sin-campania");
    if (!grupos.has(clave)) {
      grupos.set(clave, {
        id: clave,
        codigo: visita.campania_codigo || "Sin código",
        nombre: visita.campania_nombre || "Campaña sin nombre",
        icono: visita.campania_icono || null,
        categoria: visita.campania_categoria || "humana",
        brigadas: new Map(),
      });
    }

    const grupo = grupos.get(clave);
    const brigadaClave = String(visita.brigada_id ?? visita.brigada_codigo);

    if (!grupo.brigadas.has(brigadaClave)) {
      grupo.brigadas.set(brigadaClave, {
        id: brigadaClave,
        codigo: visita.brigada_codigo || "Sin brigada",
        nombre: visita.brigada_nombre || "Brigada sin nombre",
        estado: visita.brigada_estado || "disponible",
        visitas: [],
      });
    }

    grupo.brigadas.get(brigadaClave).visitas.push({
      ...visita,
      jornadas: [...(visita.jornadas || [])].sort((a, b) =>
        String(a.fecha_inicio).localeCompare(String(b.fecha_inicio))
      ),
    });
  });

  return [...grupos.values()]
    .map((grupo) => ({
      ...grupo,
      brigadas: [...grupo.brigadas.values()].sort((a, b) =>
        a.codigo.localeCompare(b.codigo, "es", { numeric: true })
      ).map((brigada) => ({
        ...brigada,
        visitas: brigada.visitas.sort((a, b) =>
          a.codigo.localeCompare(b.codigo, "es", { numeric: true })
        ),
      })),
    }))
    .sort((a, b) => a.codigo.localeCompare(b.codigo, "es", { numeric: true }));
}

export function colorDeRuta(indice) {
  return PALETA_RUTAS[indice % PALETA_RUTAS.length];
}

export function duracionPorTramo(instrucciones, tipo) {
  const tramo = instrucciones?.tramos?.find((item) => item.tipo === tipo);
  return tramo || null;
}
