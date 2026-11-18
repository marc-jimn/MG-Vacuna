export class CalcularRecorridosVisita {
  constructor(recorridoRepository) {
    this.recorridoRepository = recorridoRepository;
  }

  async ejecutar(visitaId) {
    return await this.recorridoRepository.calcularPorVisita(
      visitaId
    );
  }
}