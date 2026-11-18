import { pool } from "../database/database.js";
import { RolRepository } from "../../domain/repositories/RolRepository.js";

export class RolRepositoryPostgres extends RolRepository {

  async obtenerTodos() {
    const consulta = `
      SELECT
        id,
        nombre,
        descripcion
      FROM rol
      ORDER BY id ASC;
    `;

    const resultado = await pool.query(consulta);

    return resultado.rows;
  }

  async obtenerPorId(id) {
    const consulta = `
      SELECT
        id,
        nombre,
        descripcion
      FROM rol
      WHERE id = $1;
    `;

    const resultado = await pool.query(consulta, [id]);

    return resultado.rows[0] || null;
  }
}