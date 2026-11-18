import { pool } from "../database/database.js";
import { Personal } from "../../domain/entities/Personal.js";
import { PersonalRepository } from "../../domain/repositories/PersonalRepository.js";

export class PersonalRepositoryPostgres extends PersonalRepository {

  // Registrar personal
  async crear(datos) {
    const personal = new Personal({
      ...datos,
      numero_empleado: null,
      foto: null,
    });

    personal.validar();

    const consulta = `
      INSERT INTO personal (
        nombres,
        apellido_paterno,
        apellido_materno,
        curp,
        telefono,
        correo,
        fecha_nacimiento,
        estado,
        rol_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id
    `;

    const valores = [
      personal.nombres.trim(),
      personal.apellido_paterno.trim(),
      personal.apellido_materno?.trim() || null,
      personal.curp.trim().toUpperCase(),
      personal.telefono,
      personal.correo,
      personal.fecha_nacimiento,
      personal.estado,
      personal.rol_id || null,
    ];

    const resultado = await pool.query(consulta, valores);

    return await this.obtenerPorId(resultado.rows[0].id);
  }

  // Obtener todo el personal con su rol
  async obtenerTodos() {
    const consulta = `
      SELECT
        p.*,
        r.nombre AS rol_nombre
      FROM personal p
      LEFT JOIN rol r ON p.rol_id = r.id
      ORDER BY p.id DESC;
    `;

    const resultado = await pool.query(consulta);

    return resultado.rows;
  }

  // Obtener personal por su Id con su rol
  async obtenerPorId(id) {
    const consulta = `
      SELECT
        p.*,
        r.nombre AS rol_nombre
      FROM personal p
      LEFT JOIN rol r ON p.rol_id = r.id
      WHERE p.id = $1;
    `;

    const resultado = await pool.query(consulta, [id]);

    return resultado.rows[0] || null;
  }

  // Actualizar datos del personal
  async actualizar(id, datos) {
    const actual = await this.obtenerPorId(id);

    if (!actual) {
      return null;
    }

    const personal = new Personal({
      ...actual,
      ...datos,
      id,
      numero_empleado: actual.numero_empleado,
      foto: actual.foto,
    });

    personal.validar();

    const consulta = `
      UPDATE personal SET
        nombres = $1,
        apellido_paterno = $2,
        apellido_materno = $3,
        curp = $4,
        telefono = $5,
        correo = $6,
        fecha_nacimiento = $7,
        estado = $8,
        rol_id = $9,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING id;
    `;

    const valores = [
      personal.nombres.trim(),
      personal.apellido_paterno.trim(),
      personal.apellido_materno?.trim() || null,
      personal.curp.trim().toUpperCase(),
      personal.telefono,
      personal.correo,
      personal.fecha_nacimiento,
      personal.estado,
      personal.rol_id || null,
      id,
    ];

    const resultado = await pool.query(consulta, valores);

    if (!resultado.rows[0]) {
      return null;
    }

    return await this.obtenerPorId(id);
  }

  // Guardar o cambiar campaña
  async guardarFoto(id, rutaFoto) {
    const consulta = `
      UPDATE personal
      SET
        foto = $1,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;

    const resultado = await pool.query(
      consulta,
      [rutaFoto, id]
    );

    return resultado.rows[0] || null;
  }
}