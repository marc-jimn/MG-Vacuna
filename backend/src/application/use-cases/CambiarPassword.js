import bcrypt from "bcryptjs";

export class CambiarPassword {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async ejecutar(usuarioId, { passwordActual, passwordNueva }) {

    if (!passwordActual || !passwordNueva) {
      throw new Error("Debes proporcionar ambas contraseñas.");
    }

    if (passwordNueva.length < 10) {
      throw new Error(
        "La nueva contraseña debe tener al menos 10 caracteres."
      );
    }

    // Consultamos la cuenta asociada al ID autenticado.
    const datos = await this.usuarioRepository.obtenerDatosPassword(usuarioId);

    if (!datos) {
      throw new Error("No se encontró el usuario.");
    }

    const coincide = await bcrypt.compare(
      passwordActual,
      datos.password_hash
    );

    if (!coincide) {
      throw new Error("La contraseña actual es incorrecta.");
    }

    const hash = await bcrypt.hash(passwordNueva, 12);

    await this.usuarioRepository.actualizarPassword(
      usuarioId,
      hash
    );

    return {
      mensaje: "Contraseña actualizada correctamente.",
    };
  }
}