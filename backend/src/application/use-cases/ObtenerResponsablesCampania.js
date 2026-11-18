export class ObtenerResponsablesCampania {
  constructor(campaniaRepository) {
    this.campaniaRepository = campaniaRepository;
  }

  async ejecutar() {
    return await this.campaniaRepository.obtenerResponsables();
  }
}