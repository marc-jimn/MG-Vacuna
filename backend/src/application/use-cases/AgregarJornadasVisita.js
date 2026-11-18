export class AgregarJornadasVisita {
  constructor(visitaRepository) {
    this.visitaRepository = visitaRepository;
  }

  async ejecutar(visitaId, jornadas) {
    return await this.visitaRepository.agregarJornadas(
      visitaId,
      jornadas
    );
  }
}