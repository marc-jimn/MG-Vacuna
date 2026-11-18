export class ObtenerPersonal {
  constructor(personalRepository) {
    this.personalRepository = personalRepository;
  }

  async ejecutar() {
    return await this.personalRepository.obtenerTodos();
  }
}