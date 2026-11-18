export class ObtenerVisitas {
  constructor(visitaRepository) {
    this.visitaRepository = visitaRepository;
  }

  async ejecutar(filtros = {}) {
    return await this.visitaRepository.obtenerTodos(filtros);
  }
}