export default class ObtenerLocalidadPorId {
  constructor(localidadRepository) {
    this.localidadRepository = localidadRepository;
  }

  async ejecutar(id) {
    const identificador = Number(id);

    if (!Number.isSafeInteger(identificador) || identificador <= 0) {
      const error = new Error("El identificador de la localidad no es válido.");
      error.statusCode = 400;
      throw error;
    }

    const localidad = await this.localidadRepository.obtenerPorId(identificador);

    if (!localidad) {
      const error = new Error("La localidad solicitada no existe.");
      error.statusCode = 404;
      throw error;
    }

    return localidad;
  }
}