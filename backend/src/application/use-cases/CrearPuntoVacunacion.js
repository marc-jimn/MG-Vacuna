export class CrearPuntoVacunacion {
  constructor(visitaRepository) {
    this.visitaRepository = visitaRepository;
  }

  async ejecutar(datos) {
    return await this.visitaRepository.crearPuntoVacunacion(datos);
  }
}