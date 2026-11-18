export default class CambiarEstadoLocalidad {
  constructor(localidadRepository) {
    this.localidadRepository = localidadRepository;
  }

  async ejecutar(id, activa) {
    const identificador = Number(id);

    if (!Number.isSafeInteger(identificador) || identificador <= 0) {
      const error = new Error("El identificador de la localidad no es válido.");
      error.statusCode = 400;
      throw error;
    }

    if (typeof activa !== "boolean") {
      const error = new Error("Debes indicar si la localidad estará activa o inactiva.");
      error.statusCode = 400;
      throw error;
    }

    const localidad = await this.localidadRepository.cambiarEstado(
      identificador,
      activa
    );

    if (!localidad) {
      const error = new Error("La localidad solicitada no existe.");
      error.statusCode = 404;
      throw error;
    }

    return localidad;
  }
}