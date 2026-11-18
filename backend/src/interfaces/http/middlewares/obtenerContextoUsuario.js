import { pool } from "../../../infrastructure/database/database.js";

export const obtenerContextoUsuario = async (req, res, next) => {
  try {
    if (!req.usuario?.id) {
      return res.status(401).json({
        mensaje: "Debes iniciar sesión.",
      });
    }

    const consulta = `
      SELECT
        u.id AS usuario_id,
        u.personal_id,
        p.rol_id
      FROM usuarios u
      INNER JOIN personal p ON p.id = u.personal_id
      WHERE u.id = $1
        AND u.estado = 'activo'
        AND p.estado = 'activo';
    `;

    const resultado = await pool.query(consulta, [req.usuario.id]);

    if (!resultado.rows.length) {
      return res.status(403).json({
        mensaje: "La cuenta no está activa.",
      });
    }

    req.contextoUsuario = resultado.rows[0];

    next();
  } catch (error) {
    next(error);
  }
};