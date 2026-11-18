export class GuardarFotoPersonal {
  constructor(personalRepository) {
    this.personalRepository = personalRepository;
  }

  async ejecutar(id, rutaFoto) {
    return await this.personalRepository.guardarFoto(
      id,
      rutaFoto
    );
  }
}