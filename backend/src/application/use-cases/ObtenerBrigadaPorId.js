export class ObtenerBrigadaPorId {
  constructor(brigadaRepository) {
    this.brigadaRepository = brigadaRepository;
  }

  async ejecutar(id) {
    return await this.brigadaRepository.obtenerPorId(id);
  }
}