export class Campania {
  constructor({
    id = null,
    codigo,
    nombre,
    descripcion = null,
    categoria = "humana",
    icono = null,
    fecha_inicio,
    fecha_fin,
    dosis_asignadas = 0,
    objetivo_dosis = 0,
    estado = "planeada",
    responsable_id = null,
  }) {
    this.id = id;
    this.codigo = codigo;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.categoria = categoria;
    this.icono = icono;
    this.fecha_inicio = fecha_inicio;
    this.fecha_fin = fecha_fin;
    this.dosis_asignadas = dosis_asignadas;
    this.objetivo_dosis = objetivo_dosis;
    this.estado = estado;
    this.responsable_id = responsable_id;
  }

  validar() {
    const estadosPermitidos = [
      "planeada",
      "activa",
      "finalizada",
      "cancelada",
    ];

    const categoriasPermitidas = [
      "humana",
      "veterinaria",
    ];

    if (!this.codigo || !this.codigo.trim()) {
      throw new Error("El código de campaña es obligatorio.");
    }

    if (this.codigo.trim().length > 30) {
      throw new Error("El código no puede superar 30 caracteres.");
    }

    if (!this.nombre || !this.nombre.trim()) {
      throw new Error("El nombre de la campaña es obligatorio.");
    }

    if (this.nombre.trim().length > 150) {
      throw new Error("El nombre no puede superar 150 caracteres.");
    }

    if (!categoriasPermitidas.includes(this.categoria)) {
      throw new Error(
        "La categoría debe ser humana o veterinaria."
      );
    }

    if (
      !this.fecha_inicio ||
      !this.fecha_fin ||
      !/^\d{4}-\d{2}-\d{2}$/.test(this.fecha_inicio) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(this.fecha_fin) ||
      !Number.isFinite(Date.parse(this.fecha_inicio)) ||
      !Number.isFinite(Date.parse(this.fecha_fin))
    ) {
      throw new Error("Las fechas de la campaña no son válidas.");
    }

    if (this.fecha_fin < this.fecha_inicio) {
      throw new Error(
        "La fecha de finalización no puede ser anterior a la fecha de inicio."
      );
    }

    if (
      !Number.isInteger(Number(this.dosis_asignadas)) ||
      Number(this.dosis_asignadas) < 0
    ) {
      throw new Error(
        "Las dosis asignadas deben ser un número entero igual o mayor a cero."
      );
    }

    if (
      !Number.isInteger(Number(this.objetivo_dosis)) ||
      Number(this.objetivo_dosis) < 0
    ) {
      throw new Error(
        "El objetivo de dosis debe ser un número entero igual o mayor a cero."
      );
    }

    if (
      Number(this.dosis_asignadas) >
      Number(this.objetivo_dosis)
    ) {
      throw new Error(
        "Las dosis asignadas no pueden superar el objetivo de dosis."
      );
    }

    if (!estadosPermitidos.includes(this.estado)) {
      throw new Error("El estado de la campaña no es válido.");
    }

    if (!estadosPermitidos.includes(this.estado)) {
      throw new Error("El estado de la campaña no es válido.");
    }

    if (
      this.responsable_id !== null &&
      this.responsable_id !== undefined &&
      (!Number.isSafeInteger(Number(this.responsable_id)) ||
        Number(this.responsable_id) <= 0)
    ) {
      throw new Error("El responsable seleccionado no es válido.");
    }

    return true;
  }
}