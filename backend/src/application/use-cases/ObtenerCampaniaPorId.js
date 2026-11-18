export class ObtenerCampaniaPorId {
  constructor(campaniaRepository) {
    this.campaniaRepository = campaniaRepository;
  }

  async ejecutar(id) {
    return await this.campaniaRepository.obtenerPorId(id);
  }
}