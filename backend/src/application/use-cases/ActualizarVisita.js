export class ActualizarVisita {
  constructor(visitaRepository) {
    this.visitaRepository = visitaRepository;
  }

  async ejecutar(id, datos) {
    return await this.visitaRepository.actualizar(id, datos);
  }
}