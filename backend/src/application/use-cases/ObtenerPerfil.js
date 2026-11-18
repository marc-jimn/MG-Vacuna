export class ObtenerPerfil {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async ejecutar(usuarioId) {
    const usuario =
      await this.usuarioRepository.obtenerPorId(usuarioId);

    if (!usuario) {
      throw new Error("No se encontró el usuario.");
    }

    return usuario;
  }
}