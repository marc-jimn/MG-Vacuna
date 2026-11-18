export default class ObtenerReportes {
  constructor(tableroRepository) {
    this.tableroRepository = tableroRepository;
  }

  ejecutar(filtros) {
    return this.tableroRepository.obtenerReportes(filtros);
  }
}
