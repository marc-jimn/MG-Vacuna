export class ActualizarCampania {
  constructor(campaniaRepository) {
    this.campaniaRepository = campaniaRepository;
  }

  async ejecutar(id, datos) {
    return await this.campaniaRepository.actualizar(id, datos);
  }
}