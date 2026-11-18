export class Visita {
  constructor({
    id = null,
    brigada_localidad_id,
    codigo,
    nombre,
    observaciones = null,
    estado = "planeada",
    jornadas = [],
  }) {
    this.id = id;
    this.brigada_localidad_id = brigada_localidad_id;
    this.codigo = codigo;
    this.nombre = nombre;
    this.observaciones = observaciones;
    this.estado = estado;
    this.jornadas = jornadas;
  }

  validar() {
    const brigadaLocalidadId = Number(this.brigada_localidad_id);

    if (
      !Number.isSafeInteger(brigadaLocalidadId) ||
      brigadaLocalidadId <= 0
    ) {
      throw new Error("La localidad asignada a la brigada no es válida.");
    }

    if (!this.codigo || !this.codigo.trim()) {
      throw new Error("El código de la visita es obligatorio.");
    }

    if (this.codigo.trim().length > 30) {
      throw new Error("El código de la visita no puede superar 30 caracteres.");
    }

    if (!this.nombre || !this.nombre.trim()) {
      throw new Error("El nombre de la visita es obligatorio.");
    }

    if (this.nombre.trim().length > 150) {
      throw new Error("El nombre de la visita no puede superar 150 caracteres.");
    }

    if (
      this.observaciones !== null &&
      this.observaciones !== undefined &&
      typeof this.observaciones !== "string"
    ) {
      throw new Error("Las observaciones no son válidas.");
    }

    if (!Array.isArray(this.jornadas) || this.jornadas.length === 0) {
      throw new Error("La visita debe tener al menos una jornada.");
    }

    return true;
  }
}