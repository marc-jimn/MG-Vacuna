export class CrearCampania {
  constructor(campaniaRepository) {
    this.campaniaRepository = campaniaRepository;
  }

  async ejecutar(datos) {
    return await this.campaniaRepository.crear(datos);
  }
}