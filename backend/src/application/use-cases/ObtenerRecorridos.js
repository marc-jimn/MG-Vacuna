export class ObtenerRecorridos {
  constructor(recorridoRepository) {
    this.recorridoRepository = recorridoRepository;
  }

  async ejecutar() {
    return await this.recorridoRepository.obtenerTodos();
  }
}