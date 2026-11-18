export class Vehiculo {
  constructor({
    id = null,
    numero_economico,
    marca,
    modelo,
    anio = null,
    placas = null,
    color = null,
    capacidad_personas = null,
    kilometraje = 0,
    foto = null,
    estado = "disponible",
    conductor_id = null,
    fecha_creacion = null,
    fecha_actualizacion = null,
  }) {
    this.id = id;
    this.numero_economico = numero_economico;
    this.marca = marca;
    this.modelo = modelo;
    this.anio = anio;
    this.placas = placas;
    this.color = color;
    this.capacidad_personas = capacidad_personas;
    this.kilometraje = kilometraje;
    this.foto = foto;
    this.estado = estado;
    this.conductor_id = conductor_id;
    this.fecha_creacion = fecha_creacion;
    this.fecha_actualizacion = fecha_actualizacion;
  }

  validar() {
    if (!this.numero_economico?.trim()) {
      throw new Error("El número económico es obligatorio.");
    }

    if (this.numero_economico.trim().length > 30) {
      throw new Error("El número económico no puede superar 30 caracteres.");
    }

    if (!this.marca?.trim()) {
      throw new Error("La marca del vehículo es obligatoria.");
    }

    if (!this.modelo?.trim()) {
      throw new Error("El modelo del vehículo es obligatorio.");
    }

    if (
      this.anio !== null &&
      this.anio !== undefined &&
      (!Number.isInteger(Number(this.anio)) ||
        Number(this.anio) < 1980 ||
        Number(this.anio) > 2100)
    ) {
      throw new Error("El año del vehículo no es válido.");
    }

    if (
      this.capacidad_personas !== null &&
      this.capacidad_personas !== undefined &&
      (!Number.isInteger(Number(this.capacidad_personas)) ||
        Number(this.capacidad_personas) <= 0)
    ) {
      throw new Error("La capacidad de personas debe ser mayor que cero.");
    }

    if (
      !Number.isInteger(Number(this.kilometraje)) ||
      Number(this.kilometraje) < 0
    ) {
      throw new Error("El kilometraje no puede ser negativo.");
    }

    const estadosPermitidos = [
      "disponible",
      "en_uso",
      "mantenimiento",
      "fuera_servicio",
    ];

    if (!estadosPermitidos.includes(this.estado)) {
      throw new Error("El estado del vehículo no es válido.");
    }

    if (
      this.conductor_id !== null &&
      this.conductor_id !== undefined &&
      !/^[1-9]\d*$/.test(String(this.conductor_id))
    ) {
      throw new Error("El conductor seleccionado no es válido.");
    }
  }
}