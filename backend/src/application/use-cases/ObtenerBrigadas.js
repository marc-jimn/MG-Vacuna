export class ObtenerBrigadas {
  constructor(brigadaRepository) {
    this.brigadaRepository = brigadaRepository;
  }

  async ejecutar(filtros = {}) {
    return await this.brigadaRepository.obtenerTodos(filtros);
  }
}