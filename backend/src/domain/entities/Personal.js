export class Personal {
  constructor({
    id = null,
    numero_empleado = null,
    nombres,
    apellido_paterno,
    apellido_materno = null,
    curp,
    telefono = null,
    correo = null,
    foto = null,
    fecha_nacimiento = null,
    estado = "activo",
    rol_id = null,
    fecha_creacion = null,
    fecha_actualizacion = null,
  }) {
    this.id = id;
    this.numero_empleado = numero_empleado;
    this.nombres = nombres;
    this.apellido_paterno = apellido_paterno;
    this.apellido_materno = apellido_materno;
    this.curp = curp;
    this.telefono = telefono;
    this.correo = correo;
    this.foto = foto;
    this.fecha_nacimiento = fecha_nacimiento;
    this.estado = estado;
    this.rol_id = rol_id;
    this.fecha_creacion = fecha_creacion;
    this.fecha_actualizacion = fecha_actualizacion;
  }

  validar() {
    if (!this.nombres?.trim()) {
      throw new Error("Los nombres son obligatorios.");
    }

    if (!this.apellido_paterno?.trim()) {
      throw new Error("El apellido paterno es obligatorio.");
    }

    if (!this.curp?.trim()) {
      throw new Error("La CURP es obligatoria.");
    }

    if (!/^[A-Z0-9]{18}$/.test(this.curp.trim().toUpperCase())) {
      throw new Error(
        "La CURP debe contener 18 caracteres alfanuméricos."
      );
    }

    const estadosPermitidos = [
      "activo",
      "vacaciones",
      "baja",
    ];

    if (!estadosPermitidos.includes(this.estado)) {
      throw new Error("El estado del personal no es válido.");
    }

    // El rol puede ser null para conservar registros antiguos.
    // Cuando se proporciona, debe ser un identificador positivo.
    if (
      this.rol_id !== null &&
      this.rol_id !== undefined &&
      !/^[1-9]\d*$/.test(String(this.rol_id))
    ) {
      throw new Error("El rol seleccionado no es válido.");
    }
  }
}