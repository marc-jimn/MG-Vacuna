import Localidad from "../../domain/entities/Localidad.js";

export default class CrearLocalidad {
  constructor(localidadRepository) {
    this.localidadRepository = localidadRepository;
  }

  async ejecutar(datos) {
    const localidadValidada = Localidad.validar(datos);

    return this.localidadRepository.crear(localidadValidada);
  }
}