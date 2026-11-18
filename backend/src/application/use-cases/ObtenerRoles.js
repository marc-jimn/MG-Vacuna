export class ObtenerRoles {
  constructor(rolRepository) {
    this.rolRepository = rolRepository;
  }

  async ejecutar() {
    return await this.rolRepository.obtenerTodos();
  }
}