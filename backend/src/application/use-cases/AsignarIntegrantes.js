export class AsignarIntegrantes {
  constructor(brigadaRepository) {
    this.brigadaRepository = brigadaRepository;
  }

  async ejecutar(brigadaId, integrantes) {
    return await this.brigadaRepository.asignarIntegrantes(
      brigadaId,
      integrantes
    );
  }
}