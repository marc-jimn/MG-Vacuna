export class AsignarLocalidades {
  constructor(brigadaRepository) {
    this.brigadaRepository = brigadaRepository;
  }

  async ejecutar(brigadaId, localidadIds) {
    return await this.brigadaRepository.asignarLocalidades(
      brigadaId,
      localidadIds
    );
  }
}