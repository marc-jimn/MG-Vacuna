import { pool } from "../database/database.js";
import { Vehiculo } from "../../domain/entities/Vehiculo.js";
import { VehiculoRepository } from "../../domain/repositories/VehiculoRepository.js";

export class VehiculoRepositoryPostgres extends VehiculoRepository {
  async crear(datos) {
    const vehiculo = new Vehiculo(datos);
    vehiculo.validar();

    const consulta = `
      INSERT INTO vehiculos (
        numero_economico,
        marca,
        modelo,
        anio,
        placas,
        color,
        capacidad_personas,
        kilometraje,
        estado,
        conductor_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id;
    `;

    const valores = [
      vehiculo.numero_economico.trim(),
      vehiculo.marca.trim(),
      vehiculo.modelo.trim(),
      vehiculo.anio || null,
      vehiculo.placas?.trim() || null,
      vehiculo.color?.trim() || null,
      vehiculo.capacidad_personas || null,
      vehiculo.kilometraje,
      vehiculo.estado,
      vehiculo.conductor_id || null,
    ];

    const resultado = await pool.query(consulta, valores);

    return this.obtenerPorId(resultado.rows[0].id);
  }

  async obtenerTodos() {
    const consulta = `
      SELECT
        v.*,
        p.numero_empleado AS conductor_numero_empleado,
        p.nombres AS conductor_nombres,
        p.apellido_paterno AS conductor_apellido_paterno,
        p.apellido_materno AS conductor_apellido_materno,
        p.foto AS conductor_foto,
        p.telefono AS conductor_telefono,
        p.correo AS conductor_correo,
        p.estado AS conductor_estado,
        r.nombre AS conductor_rol
      FROM vehiculos v
      LEFT JOIN personal p ON v.conductor_id = p.id
      LEFT JOIN rol r ON p.rol_id = r.id
      ORDER BY v.id DESC;
    `;

    const resultado = await pool.query(consulta);

    return resultado.rows;
  }

  async obtenerPorId(id) {
    const consulta = `
      SELECT
        v.*,
        p.numero_empleado AS conductor_numero_empleado,
        p.nombres AS conductor_nombres,
        p.apellido_paterno AS conductor_apellido_paterno,
        p.apellido_materno AS conductor_apellido_materno,
        p.foto AS conductor_foto,
        p.telefono AS conductor_telefono,
        p.correo AS conductor_correo,
        p.estado AS conductor_estado,
        r.nombre AS conductor_rol
      FROM vehiculos v
      LEFT JOIN personal p ON v.conductor_id = p.id
      LEFT JOIN rol r ON p.rol_id = r.id
      WHERE v.id = $1;
    `;

    const resultado = await pool.query(consulta, [id]);

    return resultado.rows[0] || null;
  }

  async actualizar(id, datos) {
    const actual = await this.obtenerPorId(id);

    if (!actual) {
      return null;
    }

    const vehiculo = new Vehiculo({
      ...actual,
      ...datos,
      id,
    });

    vehiculo.validar();

    const consulta = `
      UPDATE vehiculos
      SET
        numero_economico = $1,
        marca = $2,
        modelo = $3,
        anio = $4,
        placas = $5,
        color = $6,
        capacidad_personas = $7,
        kilometraje = $8,
        estado = $9,
        conductor_id = $10,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $11;
    `;

    const valores = [
      vehiculo.numero_economico.trim(),
      vehiculo.marca.trim(),
      vehiculo.modelo.trim(),
      vehiculo.anio || null,
      vehiculo.placas?.trim() || null,
      vehiculo.color?.trim() || null,
      vehiculo.capacidad_personas || null,
      vehiculo.kilometraje,
      vehiculo.estado,
      vehiculo.conductor_id || null,
      id,
    ];

    await pool.query(consulta, valores);

    return this.obtenerPorId(id);
  }

  async guardarFoto(id, rutaFoto) {
    const consulta = `
      UPDATE vehiculos
      SET
        foto = $1,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id;
    `;

    const resultado = await pool.query(consulta, [rutaFoto, id]);

    if (resultado.rowCount === 0) {
      return null;
    }

    return this.obtenerPorId(id);
  }
}