export class CrearBrigada {
  constructor(brigadaRepository) {
    this.brigadaRepository = brigadaRepository;
  }

  async ejecutar(datos) {
    return await this.brigadaRepository.crear(datos);
  }
}