export class ActualizarPersonal {
  constructor(personalRepository) {
    this.personalRepository = personalRepository;
  }

  async ejecutar(id, datos) {
    return await this.personalRepository.actualizar(id, datos);
  }
}