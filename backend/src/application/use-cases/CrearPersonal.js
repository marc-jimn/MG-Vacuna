export class CrearPersonal {
  constructor(personalRepository) {
    this.personalRepository = personalRepository;
  }

  async ejecutar(datos) {
    return await this.personalRepository.crear(datos);
  }
}