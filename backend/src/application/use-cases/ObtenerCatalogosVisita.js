export class ObtenerCatalogosVisita {
  constructor(visitaRepository) {
    this.visitaRepository = visitaRepository;
  }

  async ejecutar() {
    return await this.visitaRepository.obtenerCatalogos();
  }
}