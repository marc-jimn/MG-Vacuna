export class ActualizarEstadosVisitas {
  constructor(visitaRepository) {
    this.visitaRepository = visitaRepository;
  }

  async ejecutar() {
    return await this.visitaRepository.actualizarEstadosAutomaticos();
  }
}