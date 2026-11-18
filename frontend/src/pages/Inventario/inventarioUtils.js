export const numero = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

export const formatearCantidad = (valor, decimales = 0) =>
  new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: decimales,
  }).format(numero(valor));

export const formatearFecha = (valor) => {
  if (!valor) return "Sin registro";
  const texto = String(valor).slice(0, 10);
  const partes = texto.split("-");
  if (partes.length !== 3) return texto;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

export const fechaHoy = () => {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export const fechaRelativa = (valor) => {
  if (!valor) return "";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha);
};

/** Normaliza cuerpos de Axios y sobres { ok, mensaje, datos }. */
export const extraerDatosRespuesta = (respuesta) => {
  const cuerpo = respuesta?.data ?? respuesta;
  return cuerpo?.datos ?? cuerpo?.data?.datos ?? cuerpo?.data ?? cuerpo;
};

export const extraerLista = (respuesta, propiedadPreferida) => {
  const datos = extraerDatosRespuesta(respuesta);
  if (Array.isArray(datos)) return datos;
  if (propiedadPreferida && Array.isArray(datos?.[propiedadPreferida])) {
    return datos[propiedadPreferida];
  }
  for (const clave of ["notificaciones", "insumos", "campanias", "movimientos", "lotes"]) {
    if (Array.isArray(datos?.[clave])) return datos[clave];
  }
  return [];
};

export const agruparPor = (items, clave) => {
  const lista = Array.isArray(items) ? items : [];
  return lista.reduce((resultado, item) => {
    const valor = item?.[clave] ?? "Sin grupo";
    if (!resultado[valor]) resultado[valor] = [];
    resultado[valor].push(item);
    return resultado;
  }, {});
};

export const estadoConciliacion = (estado) => {
  const mapa = {
    cuadrado: { etiqueta: "Conciliado", clase: "ok", icono: "check_circle" },
    faltante: { etiqueta: "Por aclarar", clase: "danger", icono: "warning" },
    exceso_registrado: {
      etiqueta: "Revisar exceso",
      clase: "warning",
      icono: "priority_high",
    },
    sin_entrega: { etiqueta: "Sin entrega", clase: "neutral", icono: "schedule" },
  };
  return mapa[estado] || mapa.sin_entrega;
};
