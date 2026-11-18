import { pool } from "../database/database.js";
import LocalidadRepository from "../../domain/repositories/LocalidadRepository.js";

export default class LocalidadRepositoryPostgres extends LocalidadRepository {

  async obtenerTodos(personalId = null) {
    const consulta = `
      SELECT
        l.id,
        l.codigo,
        l.nombre,
        l.tipo,
        l.municipio,
        l.estado,
        l.codigo_postal,
        l.poblacion,

        ST_Y(l.ubicacion::geometry) AS latitud,
        ST_X(l.ubicacion::geometry) AS longitud,

        l.color_marcador,
        l.activa,
        l.created_at,
        l.updated_at,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', c.id,
                'codigo', c.codigo,
                'nombre', c.nombre,
                'categoria', c.categoria,
                'icono', c.icono,
                'fecha_inicio', c.fecha_inicio,
                'fecha_fin', c.fecha_fin,
                'estado', c.estado
              )
              ORDER BY c.fecha_inicio ASC NULLS LAST, c.nombre ASC
            )
            FROM campanias_localidades cl
            INNER JOIN campanias c ON c.id = cl.campania_id
            WHERE cl.localidad_id = l.id
              AND (
                $1::BIGINT IS NULL
                OR c.responsable_id = $1
              )
          ),
          '[]'::json
        ) AS campanias

      FROM localidades l

      WHERE
        $1::BIGINT IS NULL
        OR EXISTS (
          SELECT 1
          FROM campanias_localidades cl
          INNER JOIN campanias c ON c.id = cl.campania_id
          WHERE cl.localidad_id = l.id
            AND c.responsable_id = $1
        )

      ORDER BY l.nombre ASC;
    `;

    const resultado = await pool.query(consulta, [personalId]);

    return resultado.rows;
  }

  async obtenerPorId(id, personalId = null) {
    const consulta = `
      SELECT
        l.id,
        l.codigo,
        l.nombre,
        l.tipo,
        l.municipio,
        l.estado,
        l.codigo_postal,
        l.poblacion,

        ST_Y(l.ubicacion::geometry) AS latitud,
        ST_X(l.ubicacion::geometry) AS longitud,

        l.color_marcador,
        l.activa,
        l.created_at,
        l.updated_at,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', c.id,
                'codigo', c.codigo,
                'nombre', c.nombre,
                'categoria', c.categoria,
                'icono', c.icono,
                'fecha_inicio', c.fecha_inicio,
                'fecha_fin', c.fecha_fin,
                'estado', c.estado
              )
              ORDER BY
                c.fecha_inicio ASC NULLS LAST,
                c.nombre ASC
            )
            FROM campanias_localidades cl
            INNER JOIN campanias c
              ON c.id = cl.campania_id
            WHERE cl.localidad_id = l.id
          ),
          '[]'::json
        ) AS campanias

      FROM localidades l
      WHERE l.id = $1
      AND (
        $2::BIGINT IS NULL
        OR EXISTS (
          SELECT 1
          FROM campanias_localidades cl
          INNER JOIN campanias c ON c.id = cl.campania_id
          WHERE cl.localidad_id = l.id
            AND c.responsable_id = $2
        )
      );
    `;

    const resultado = await pool.query(consulta, [id, personalId]);

    return resultado.rows[0] || null;
  }


  async crear(datos) {
    const consulta = `
      INSERT INTO localidades (
        codigo,
        nombre,
        tipo,
        municipio,
        estado,
        codigo_postal,
        poblacion,
        ubicacion,
        color_marcador,
        activa
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,

        CASE
          WHEN $8::DOUBLE PRECISION IS NULL
            OR $9::DOUBLE PRECISION IS NULL
          THEN NULL
          ELSE ST_SetSRID(
            ST_MakePoint($9, $8),
            4326
          )::geography
        END,

        $10,
        $11
      )
      RETURNING id;
    `;

    const valores = [
      datos.codigo,
      datos.nombre,
      datos.tipo,
      datos.municipio,
      datos.estado,
      datos.codigo_postal,
      datos.poblacion,
      datos.latitud,
      datos.longitud,
      datos.color_marcador,
      datos.activa,
    ];

    const resultado = await pool.query(consulta, valores);

    return this.obtenerPorId(resultado.rows[0].id);
  }


  async actualizar(id, datos) {
    const consulta = `
      UPDATE localidades
      SET
        codigo = $1,
        nombre = $2,
        tipo = $3,
        municipio = $4,
        estado = $5,
        codigo_postal = $6,
        poblacion = $7,

        ubicacion = CASE
          WHEN $8::DOUBLE PRECISION IS NULL
            OR $9::DOUBLE PRECISION IS NULL
          THEN NULL
          ELSE ST_SetSRID(
            ST_MakePoint($9, $8),
            4326
          )::geography
        END,

        color_marcador = $10,
        activa = $11,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = $12

      RETURNING id;
    `;

    const valores = [
      datos.codigo,
      datos.nombre,
      datos.tipo,
      datos.municipio,
      datos.estado,
      datos.codigo_postal,
      datos.poblacion,
      datos.latitud,
      datos.longitud,
      datos.color_marcador,
      datos.activa,
      id,
    ];

    const resultado = await pool.query(consulta, valores);

    if (resultado.rowCount === 0) {
      return null;
    }

    return this.obtenerPorId(id);
  }


  async cambiarEstado(id, activa) {
    const consulta = `
      UPDATE localidades
      SET
        activa = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id;
    `;

    const resultado = await pool.query(consulta, [activa, id]);

    if (resultado.rowCount === 0) {
      return null;
    }

    return this.obtenerPorId(id);
  }

  async asignarCampanias(campaniaId, localidadIds) {
    const cliente = await pool.connect();

    try {
      await cliente.query("BEGIN");

      // Verificar que la campaña exista.
      const campania = await cliente.query(
        "SELECT id FROM campanias WHERE id = $1",
        [campaniaId]
      );

      if (campania.rowCount === 0) {
        const error = new Error("La campaña seleccionada no existe.");
        error.statusCode = 404;
        throw error;
      }

      // Verificar que todas las localidades existan.
      const localidades = await cliente.query(
        `
          SELECT id
          FROM localidades
          WHERE id = ANY($1::BIGINT[])
        `,
        [localidadIds]
      );

      const idsEncontrados = new Set(
        localidades.rows.map((localidad) => String(localidad.id))
      );

      const idsNoEncontrados = localidadIds.filter(
        (id) => !idsEncontrados.has(String(id))
      );

      if (idsNoEncontrados.length > 0) {
        const error = new Error(
          `No existen las siguientes localidades: ${idsNoEncontrados.join(", ")}.`
        );

        error.statusCode = 404;
        throw error;
      }

      // Reemplazar las asignaciones anteriores
      // únicamente de la campaña seleccionada.
      await cliente.query(
        `
          DELETE FROM campanias_localidades
          WHERE campania_id = $1
        `,
        [campaniaId]
      );

      // Insertar las nuevas asignaciones.
      if (localidadIds.length > 0) {
        await cliente.query(
          `
            INSERT INTO campanias_localidades (
              campania_id,
              localidad_id
            )
            SELECT
              $1,
              UNNEST($2::BIGINT[])
          `,
          [campaniaId, localidadIds]
        );
      }

      await cliente.query("COMMIT");

      return {
        campania_id: campaniaId,
        localidad_ids: localidadIds,
      };

    } catch (error) {
      await cliente.query("ROLLBACK");
      throw error;

    } finally {
      cliente.release();
    }
  }
}