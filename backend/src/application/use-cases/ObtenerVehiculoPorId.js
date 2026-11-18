export class ObtenerVehiculoPorId {
  constructor(vehiculoRepository) {
    this.vehiculoRepository = vehiculoRepository;
  }

  async ejecutar(id) {
    return await this.vehiculoRepository.obtenerPorId(id);
  }
}