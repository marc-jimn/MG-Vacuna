export default class ObtenerLocalidades {
  constructor(localidadRepository) {
    this.localidadRepository = localidadRepository;
  }

  async ejecutar() {
    return this.localidadRepository.obtenerTodos();
  }
}