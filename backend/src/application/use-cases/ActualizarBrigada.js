export class ActualizarBrigada {
  constructor(brigadaRepository) {
    this.brigadaRepository = brigadaRepository;
  }

  async ejecutar(id, datos) {
    return await this.brigadaRepository.actualizar(id, datos);
  }
}