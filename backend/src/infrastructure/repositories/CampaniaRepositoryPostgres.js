import { pool } from "../database/database.js";
import { Campania } from "../../domain/entities/Campania.js";
import { CampaniaRepository } from "../../domain/repositories/CampaniaRepository.js";

export class CampaniaRepositoryPostgres extends CampaniaRepository {

  // Verificar que el responsable sea coordinador activo
  async validarResponsable(responsableId) {
    if (responsableId === null || responsableId === undefined) {
      return;
    }

    const consulta = `
      SELECT id
      FROM personal
      WHERE id = $1
        AND rol_id = 2
        AND estado = 'activo';
    `;

    const resultado = await pool.query(
      consulta,
      [responsableId]
    );

    if (resultado.rows.length === 0) {
      throw new Error(
        "El responsable debe ser un coordinador de campaña activo."
      );
    }
  }

  // Registrar campaña
  async crear(datos) {
    const campania = new Campania(datos);

    campania.validar();

    await this.validarResponsable(campania.responsable_id);

    const consulta = `
      INSERT INTO campanias (
        codigo,
        nombre,
        descripcion,
        categoria,
        icono,
        fecha_inicio,
        fecha_fin,
        dosis_asignadas,
        objetivo_dosis,
        estado,
        responsable_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id;
    `;

    const valores = [
      campania.codigo.trim(),
      campania.nombre.trim(),
      campania.descripcion?.trim() || null,
      campania.categoria,
      campania.icono?.trim() || null,
      campania.fecha_inicio,
      campania.fecha_fin,
      Number(campania.dosis_asignadas),
      Number(campania.objetivo_dosis),
      campania.estado,
      campania.responsable_id || null,
    ];

    const resultado = await pool.query(consulta, valores);

    return await this.obtenerPorId(resultado.rows[0].id);
  }

  // Obtener todas las campañas
  async obtenerTodos() {
    const consulta = `
      SELECT
        c.*,
        CASE
          WHEN p.id IS NOT NULL THEN
            CONCAT_WS(
              ' ',
              p.nombres,
              p.apellido_paterno,
              p.apellido_materno
            )
          ELSE NULL
        END AS responsable_nombre

      FROM campanias c

      LEFT JOIN personal p
        ON c.responsable_id = p.id

      ORDER BY c.fecha_creacion DESC;
    `;

    const resultado = await pool.query(consulta);

    return resultado.rows;
  }

  // Obtener campaña por Id
  async obtenerPorId(id) {
    const consulta = `
      SELECT
        c.*,
        CASE
          WHEN p.id IS NOT NULL THEN
            CONCAT_WS(
              ' ',
              p.nombres,
              p.apellido_paterno,
              p.apellido_materno
            )
          ELSE NULL
        END AS responsable_nombre

      FROM campanias c

      LEFT JOIN personal p
        ON c.responsable_id = p.id

      WHERE c.id = $1;
    `;

    const resultado = await pool.query(
      consulta,
      [id]
    );

    return resultado.rows[0] || null;
  }

  // Actualizar campaña
  async actualizar(id, datos) {
    const actual = await this.obtenerPorId(id);

    if (!actual) {
      return null;
    }

    const campania = new Campania({
      ...actual,
      ...datos,
      id,
    });

    campania.validar();

    await this.validarResponsable(campania.responsable_id);

    const consulta = `
      UPDATE campanias SET
        codigo = $1,
        nombre = $2,
        descripcion = $3,
        categoria = $4,
        icono = $5,
        fecha_inicio = $6,
        fecha_fin = $7,
        dosis_asignadas = $8,
        objetivo_dosis = $9,
        estado = $10,
        responsable_id = $11,
        fecha_actualizacion = CURRENT_TIMESTAMP

      WHERE id = $12

      RETURNING id;
    `;

    const valores = [
      campania.codigo.trim(),
      campania.nombre.trim(),
      campania.descripcion?.trim() || null,
      campania.categoria,
      campania.icono?.trim() || null,
      campania.fecha_inicio,
      campania.fecha_fin,
      Number(campania.dosis_asignadas),
      Number(campania.objetivo_dosis),
      campania.estado,
      campania.responsable_id || null,
      id,
    ];

    const resultado = await pool.query(
      consulta,
      valores
    );

    if (!resultado.rows[0]) {
      return null;
    }

    return await this.obtenerPorId(id);
  }

  // Obtener coordinadores activos
  async obtenerResponsables() {
    const consulta = `
      SELECT
        id,
        numero_empleado,
        nombres,
        apellido_paterno,
        apellido_materno

      FROM personal

      WHERE rol_id = 2
        AND estado = 'activo'

      ORDER BY nombres ASC;
    `;

    const resultado = await pool.query(consulta);

    return resultado.rows;
  }
}