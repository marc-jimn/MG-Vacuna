export const numero = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

export const cantidad = (valor) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(numero(valor));
export const porcentaje = (valor) => `${numero(valor).toLocaleString("es-MX", { maximumFractionDigits: 1 })}%`;

export const fechaISO = (fecha) => {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const etiquetaCategoria = (categoria) => categoria === "veterinaria" ? "Veterinaria" : categoria === "humana" ? "Humana" : categoria || "—";

export const estadoBrigada = (estado) => ({
  disponible: "Disponible",
  asignada: "Asignada",
  en_ruta: "En ruta",
  en_visita: "En visita",
  terminada: "Terminada",
  cancelada: "Cancelada",
}[estado] || estado || "Sin estado");
