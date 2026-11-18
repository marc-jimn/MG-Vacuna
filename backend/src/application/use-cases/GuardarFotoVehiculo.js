export class GuardarFotoVehiculo {
  constructor(vehiculoRepository) {
    this.vehiculoRepository = vehiculoRepository;
  }

  async ejecutar(id, rutaFoto) {
    return await this.vehiculoRepository.guardarFoto(id, rutaFoto);
  }
}