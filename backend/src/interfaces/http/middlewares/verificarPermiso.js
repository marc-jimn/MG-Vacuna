import { pool } from "../../../infrastructure/database/database.js";

export const verificarPermiso = (permisoRequerido) => {

  return async (req, res, next) => {
    try {

      if (!req.usuario?.id) {
        return res.status(401).json({
          mensaje: "Debes iniciar sesión.",
        });
      }

      const consulta = `
        SELECT EXISTS (
          SELECT 1
          FROM usuarios u
          INNER JOIN personal p
            ON u.personal_id = p.id
          INNER JOIN rol_permiso rp
            ON rp.rol_id = p.rol_id
          INNER JOIN permiso pe
            ON pe.id = rp.permiso_id
          WHERE u.id = $1
            AND u.estado = 'activo'
            AND p.estado = 'activo'
            AND pe.clave = $2
        ) AS autorizado;
      `;

      const resultado = await pool.query(
        consulta,
        [req.usuario.id, permisoRequerido]
      );

      if (!resultado.rows[0].autorizado) {
        return res.status(403).json({
          mensaje: "No tienes permiso para realizar esta acción.",
        });
      }

      next();

    } catch (error) {
      next(error);
    }
  };
};