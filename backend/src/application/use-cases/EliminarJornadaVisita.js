export class EliminarJornadaVisita {
  constructor(visitaRepository) {
    this.visitaRepository = visitaRepository;
  }

  async ejecutar(visitaId, jornadaId) {
    return await this.visitaRepository.eliminarJornada(
      visitaId,
      jornadaId
    );
  }
}