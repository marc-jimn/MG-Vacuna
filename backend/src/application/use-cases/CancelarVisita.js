export class CancelarVisita {
  constructor(visitaRepository) {
    this.visitaRepository = visitaRepository;
  }

  async ejecutar(id) {
    return await this.visitaRepository.cancelar(id);
  }
}