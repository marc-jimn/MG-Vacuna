export default class AsignarCampaniasLocalidades {
  constructor(localidadRepository) {
    this.localidadRepository = localidadRepository;
  }

  async ejecutar(datos) {
    if (!datos || typeof datos !== "object") {
      const error = new Error("Los datos de asignación son obligatorios.");
      error.statusCode = 400;
      throw error;
    }

    const campaniaId = Number(datos.campania_id);

    if (!Number.isSafeInteger(campaniaId) || campaniaId <= 0) {
      const error = new Error("El identificador de la campaña no es válido.");
      error.statusCode = 400;
      throw error;
    }

    if (!Array.isArray(datos.localidad_ids)) {
      const error = new Error("Debes proporcionar una lista de localidades.");
      error.statusCode = 400;
      throw error;
    }

    const localidadIds = datos.localidad_ids.map(Number);

    if (
      localidadIds.some(
        (id) => !Number.isSafeInteger(id) || id <= 0
      )
    ) {
      const error = new Error("Uno o más identificadores de localidad no son válidos.");
      error.statusCode = 400;
      throw error;
    }

    // Evitar IDs duplicados.
    const localidadesUnicas = [...new Set(localidadIds)];

    return this.localidadRepository.asignarCampanias(
      campaniaId,
      localidadesUnicas
    );
  }
}