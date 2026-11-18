export class ObtenerPersonalPorId {
  constructor(personalRepository) {
    this.personalRepository = personalRepository;
  }

  async ejecutar(id) {
    return await this.personalRepository.obtenerPorId(id);
  }
}