export class CrearVehiculo {
  constructor(vehiculoRepository) {
    this.vehiculoRepository = vehiculoRepository;
  }

  async ejecutar(datos) {
    return await this.vehiculoRepository.crear(datos);
  }
}