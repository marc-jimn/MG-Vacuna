export class ActualizarJornadaVisita {
  constructor(visitaRepository) {
    this.visitaRepository = visitaRepository;
  }

  async ejecutar(visitaId, jornadaId, datos) {
    return await this.visitaRepository.actualizarJornada(
      visitaId,
      jornadaId,
      datos
    );
  }
}