export class Brigada {
  constructor({
    id = null,
    campania_id,
    codigo,
    nombre,
    descripcion = null,
    estado = "disponible",
    capacidad_personal = 5,
    dosis_asignadas = 0,
    objetivo_dosis = 0,
    created_at = null,
    updated_at = null,
  }) {
    this.id = id;
    this.campania_id = campania_id;
    this.codigo = codigo;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.estado = estado;
    this.capacidad_personal = capacidad_personal;
    this.dosis_asignadas = Number(dosis_asignadas);
    this.objetivo_dosis = Number(objetivo_dosis);
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  validar() {
    const estadosPermitidos = [
      "disponible",
      "asignada",
      "en_ruta",
      "en_visita",
      "terminada",
      "cancelada",
    ];

    const campaniaId = Number(this.campania_id);

    if (!Number.isSafeInteger(campaniaId) || campaniaId <= 0) {
      throw new Error("La campaña seleccionada no es válida.");
    }

    if (!this.codigo || !this.codigo.trim()) {
      throw new Error("El código de la brigada es obligatorio.");
    }

    if (this.codigo.trim().length > 30) {
      throw new Error("El código no puede superar 30 caracteres.");
    }

    if (!this.nombre || !this.nombre.trim()) {
      throw new Error("El nombre de la brigada es obligatorio.");
    }

    if (this.nombre.trim().length > 120) {
      throw new Error("El nombre no puede superar 120 caracteres.");
    }

    if (
      this.descripcion !== null &&
      this.descripcion !== undefined &&
      typeof this.descripcion !== "string"
    ) {
      throw new Error("La descripción no es válida.");
    }

    if (this.descripcion && this.descripcion.length > 5000) {
      throw new Error("La descripción no puede superar 5000 caracteres.");
    }

    if (!estadosPermitidos.includes(this.estado)) {
      throw new Error("El estado de la brigada no es válido.");
    }

    if (Number(this.capacidad_personal) !== 5) {
      throw new Error("Cada brigada debe tener una capacidad de 5 personas.");
    }

    const dosisAsignadas = this.dosis_asignadas;
    const objetivoDosis = this.objetivo_dosis;

    if (
      !Number.isSafeInteger(dosisAsignadas) ||
      dosisAsignadas < 0 ||
      dosisAsignadas > 2147483647
    ) {
      throw new Error(
        "Las dosis asignadas deben ser un número entero no negativo."
      );
    }

    if (
      !Number.isSafeInteger(objetivoDosis) ||
      objetivoDosis < 0 ||
      objetivoDosis > 2147483647
    ) {
      throw new Error(
        "El objetivo de dosis debe ser un número entero no negativo."
      );
    }

    return true;
  }
}