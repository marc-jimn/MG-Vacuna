export default class ObtenerInicioTablero {
  constructor(tableroRepository) {
    this.tableroRepository = tableroRepository;
  }

  ejecutar() {
    return this.tableroRepository.obtenerInicio();
  }
}
