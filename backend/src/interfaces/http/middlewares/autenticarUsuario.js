import jwt from "jsonwebtoken";

export const autenticarUsuario = (req, res, next) => {
  try {
    const autorizacion = req.headers.authorization;

    if (!autorizacion?.startsWith("Bearer ")) {
      return res.status(401).json({
        mensaje: "No se proporcionó un token de autenticación.",
      });
    }

    const token = autorizacion.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const usuarioId = Number(decoded.sub);

    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
      return res.status(401).json({
        mensaje: "El token no es válido.",
      });
    }

    req.usuario = {
      id: usuarioId,
    };

    next();

  } catch (error) {
    return res.status(401).json({
      mensaje: "La sesión no es válida o ha expirado.",
    });
  }
};