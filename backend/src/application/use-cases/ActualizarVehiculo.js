export class ActualizarVehiculo {
  constructor(vehiculoRepository) {
    this.vehiculoRepository = vehiculoRepository;
  }

  async ejecutar(id, datos) {
    return await this.vehiculoRepository.actualizar(id, datos);
  }
}