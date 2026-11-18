export class ObtenerVisitaPorId {
  constructor(visitaRepository) {
    this.visitaRepository = visitaRepository;
  }

  async ejecutar(id) {
    return await this.visitaRepository.obtenerPorId(id);
  }
}