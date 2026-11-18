export class ObtenerVehiculos {
  constructor(vehiculoRepository) {
    this.vehiculoRepository = vehiculoRepository;
  }

  async ejecutar() {
    return await this.vehiculoRepository.obtenerTodos();
  }
}