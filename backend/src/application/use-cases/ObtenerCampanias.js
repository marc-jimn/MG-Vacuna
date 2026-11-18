export class ObtenerCampanias {
  constructor(campaniaRepository) {
    this.campaniaRepository = campaniaRepository;
  }

  async ejecutar() {
    return await this.campaniaRepository.obtenerTodos();
  }
}