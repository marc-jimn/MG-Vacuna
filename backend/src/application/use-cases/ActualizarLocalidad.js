import Localidad from "../../domain/entities/Localidad.js";

export default class ActualizarLocalidad {
  constructor(localidadRepository) {
    this.localidadRepository = localidadRepository;
  }

  async ejecutar(id, datos) {
    const identificador = Number(id);

    if (!Number.isSafeInteger(identificador) || identificador <= 0) {
      const error = new Error("El identificador de la localidad no es válido.");
      error.statusCode = 400;
      throw error;
    }

    const localidadValidada = Localidad.validar(datos);

    const localidad = await this.localidadRepository.actualizar(
      identificador,
      localidadValidada
    );

    if (!localidad) {
      const error = new Error("La localidad que intentas actualizar no existe.");
      error.statusCode = 404;
      throw error;
    }

    return localidad;
  }
}