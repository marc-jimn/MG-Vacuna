export class AuthController {
  constructor({
    iniciarSesion,
    obtenerPerfil,
    cambiarPassword,
  }) {
    this.iniciarSesion = iniciarSesion;
    this.obtenerPerfil = obtenerPerfil;
    this.cambiarPassword = cambiarPassword;
  }

  login = async (req, res, next) => {
    try {

      const resultado = await this.iniciarSesion.ejecutar({
        correo: req.body.correo,
        password: req.body.password,
      });

      res.status(200).json({
        mensaje: "Inicio de sesión correcto.",
        datos: resultado,
      });

    } catch (error) {

      if (
        error.message === "Credenciales incorrectas." ||
        error.message === "La cuenta no se encuentra activa." ||
        error.message === "El personal asociado no se encuentra activo." ||
        error.message === "Este rol no tiene acceso al sistema."
      ) {
        return res.status(401).json({
          mensaje: error.message,
        });
      }

      next(error);
    }
  };

  perfil = async (req, res, next) => {
    try {

      const usuario = await this.obtenerPerfil.ejecutar(
        req.usuario.id
      );

      const {
        password_hash,
        ...datosUsuario
      } = usuario;

      res.status(200).json({
        datos: datosUsuario,
      });

    } catch (error) {

      if (error.message === "No se encontró el usuario.") {
        return res.status(404).json({
          mensaje: error.message,
        });
      }

      next(error);
    }
  };

  cambiar = async (req, res, next) => {
    try {
      const resultado = await this.cambiarPassword.ejecutar(
        req.usuario.id,
        req.body
      );

      res.status(200).json(resultado);

    } catch (error) {
      if (
        error.message === "Debes proporcionar ambas contraseñas." ||
        error.message === "La nueva contraseña debe tener al menos 10 caracteres." ||
        error.message === "La contraseña actual es incorrecta." ||
        error.message === "No se encontró el usuario."
      ) {
        return res.status(400).json({
          mensaje: error.message,
        });
      }

      next(error);
    }
  };
}