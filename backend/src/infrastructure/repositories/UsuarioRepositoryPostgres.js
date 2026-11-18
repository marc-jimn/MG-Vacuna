import { pool } from "../database/database.js";

export class UsuarioRepositoryPostgres {

  async obtenerPorCorreo(correo) {
    const consulta = `
      SELECT
        u.id AS usuario_id,
        u.personal_id,
        u.username,
        u.correo,
        u.password_hash,
        u.estado AS estado_usuario,
        u.debe_cambiar_password,
        p.numero_empleado,
        p.nombres,
        p.apellido_paterno,
        p.apellido_materno,
        p.foto,
        p.telefono,
        p.fecha_nacimiento,
        p.estado AS estado_personal,
        r.id AS rol_id,
        r.nombre AS rol_nombre,
        COALESCE(
          ARRAY_AGG(DISTINCT pe.clave)
          FILTER (WHERE pe.clave IS NOT NULL),
          ARRAY[]::VARCHAR[]
        ) AS permisos
      FROM usuarios u
      INNER JOIN personal p
        ON u.personal_id = p.id
      INNER JOIN rol r
        ON p.rol_id = r.id
      LEFT JOIN rol_permiso rp
        ON rp.rol_id = r.id
      LEFT JOIN permiso pe
        ON pe.id = rp.permiso_id
      WHERE LOWER(u.correo) = LOWER($1)
      GROUP BY
        u.id,
        p.id,
        r.id;
    `;

    const resultado = await pool.query(consulta, [correo]);

    return resultado.rows[0] || null;
  }

  async obtenerPorId(usuarioId) {
    const consulta = `
      SELECT
        u.id AS usuario_id,
        u.personal_id,
        u.username,
        u.correo,
        u.estado AS estado_usuario,
        u.debe_cambiar_password,
        u.ultimo_acceso,
        p.numero_empleado,
        p.nombres,
        p.apellido_paterno,
        p.apellido_materno,
        p.foto,
        p.telefono,
        p.fecha_nacimiento,
        p.estado AS estado_personal,
        r.id AS rol_id,
        r.nombre AS rol_nombre,
        COALESCE(
          ARRAY_AGG(DISTINCT pe.clave)
          FILTER (WHERE pe.clave IS NOT NULL),
          ARRAY[]::VARCHAR[]
        ) AS permisos
      FROM usuarios u
      INNER JOIN personal p
        ON u.personal_id = p.id
      INNER JOIN rol r
        ON p.rol_id = r.id
      LEFT JOIN rol_permiso rp
        ON rp.rol_id = r.id
      LEFT JOIN permiso pe
        ON pe.id = rp.permiso_id
      WHERE u.id = $1
      GROUP BY
        u.id,
        p.id,
        r.id;
    `;

    const resultado = await pool.query(consulta, [usuarioId]);

    return resultado.rows[0] || null;
  }

  async actualizarUltimoAcceso(usuarioId) {
    const consulta = `
      UPDATE usuarios
      SET
        ultimo_acceso = CURRENT_TIMESTAMP,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $1;
    `;

    await pool.query(consulta, [usuarioId]);
  }

  async actualizarPassword(usuarioId, passwordHash) {
    const consulta = `
      UPDATE usuarios
      SET
        password_hash = $1,
        debe_cambiar_password = FALSE,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id;
    `;

    const resultado = await pool.query(
      consulta,
      [passwordHash, usuarioId]
    );

    return resultado.rows[0] || null;
  }

  async obtenerDatosPassword(usuarioId) {
    const consulta = `
      SELECT
        id,
        password_hash
      FROM usuarios
      WHERE id = $1
        AND estado = 'activo';
    `;

    const resultado = await pool.query(
      consulta,
      [usuarioId]
    );

    return resultado.rows[0] || null;
  }
}