import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class IniciarSesion {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async ejecutar({ correo, password }) {

    if (!correo?.trim() || !password) {
      throw new Error("El correo y la contraseña son obligatorios.");
    }

    const usuario =
      await this.usuarioRepository.obtenerPorCorreo(correo.trim());

    if (!usuario) {
      throw new Error("Credenciales incorrectas.");
    }

    if (usuario.estado_usuario !== "activo") {
      throw new Error("La cuenta no se encuentra activa.");
    }

    if (usuario.estado_personal !== "activo") {
      throw new Error("El personal asociado no se encuentra activo.");
    }

    if (![1, 2, 3, 4].includes(Number(usuario.rol_id))) {
      throw new Error("Este rol no tiene acceso al sistema.");
    }

    const passwordValida = await bcrypt.compare(
      password,
      usuario.password_hash
    );

    if (!passwordValida) {
      throw new Error("Credenciales incorrectas.");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("No está configurada la clave de autenticación.");
    }

    await this.usuarioRepository.actualizarUltimoAcceso(
      usuario.usuario_id
    );

    const token = jwt.sign(
      {
        sub: String(usuario.usuario_id),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "8h",
      }
    );

    const {
      password_hash,
      ...datosUsuario
    } = usuario;

    return {
      token,
      usuario: datosUsuario,
    };
  }
}