export class ObtenerRecorridosPorVisita {
  constructor(recorridoRepository) {
    this.recorridoRepository = recorridoRepository;
  }

  async ejecutar(visitaId) {
    return await this.recorridoRepository.obtenerPorVisita(visitaId);
  }
}