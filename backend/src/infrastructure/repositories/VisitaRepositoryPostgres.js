import { pool } from "../database/database.js";
import { VisitaRepository } from "../../domain/repositories/VisitaRepository.js";
import { Visita } from "../../domain/entities/Visita.js";

export class VisitaRepositoryPostgres extends VisitaRepository {
  manejarError(error) {
    if (error.statusCode) {
      throw error;
    }

    if (error.code === "23505") {
      const nuevoError = new Error(
        "El código o el registro que intentas guardar ya existe."
      );
      nuevoError.statusCode = 409;
      throw nuevoError;
    }

    if (error.code === "23503") {
      const nuevoError = new Error(
        "No se encontró alguno de los registros relacionados."
      );
      nuevoError.statusCode = 400;
      throw nuevoError;
    }

    if (
      error.code === "23514" ||
      error.code === "22007" ||
      error.code === "22008"
    ) {
      const nuevoError = new Error(
        "Las fechas, horarios o cantidades proporcionadas no son válidas."
      );
      nuevoError.statusCode = 400;
      throw nuevoError;
    }

    throw error;
  }

  errorPersonalizado(mensaje, statusCode = 400) {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
  }

  obtenerFechaMexico() {
    const partes = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const valores = {};

    for (const parte of partes) {
      if (parte.type !== "literal") {
        valores[parte.type] = parte.value;
      }
    }

    return `${valores.year}-${valores.month}-${valores.day}`;
  }

  async obtenerTodos(filtros = {}) {
    try {
      const consulta = `
        SELECT
          v.id,
          v.brigada_localidad_id,
          v.codigo,
          v.nombre,
          v.estado,
          v.observaciones,
          v.created_at,
          v.updated_at,

          bl.localidad_id,

          l.codigo AS localidad_codigo,
          l.nombre AS localidad,
          l.municipio AS localidad_municipio,

          b.id AS brigada_id,
          b.codigo AS brigada_codigo,
          b.nombre AS brigada_nombre,
          b.estado AS brigada_estado,

          c.id AS campania_id,
          c.codigo AS campania_codigo,
          c.nombre AS campania_nombre,
          c.icono AS campania_icono,
          c.categoria AS campania_categoria,

          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', bio.id,
                  'codigo', bio.codigo,
                  'nombre', bio.nombre,
                  'nombre_corto', bio.nombre_corto
                )
                ORDER BY bio.nombre
              )
              FROM campanias_biologicos cb
              INNER JOIN biologicos bio
                ON bio.id = cb.biologico_id
              WHERE cb.campania_id = c.id
            ),
            '[]'::json
          ) AS biologicos,

          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', j.id,
                  'visita_id', j.visita_id,
                  'punto_vacunacion_id', p.id,
                  'punto_vacunacion', p.nombre,
                  'direccion', p.direccion,
                  'referencia', p.referencia,
                  'fecha_inicio', j.fecha_inicio,
                  'fecha_fin', j.fecha_fin,
                  'hora_inicio', j.hora_inicio,
                  'hora_fin', j.hora_fin,
                  'dosis_asignadas', j.dosis_asignadas,
                  'objetivo_dosis', j.objetivo_dosis,
                  'estado', j.estado,
                  'observaciones', j.observaciones
                )
                ORDER BY j.fecha_inicio, j.hora_inicio
              )
              FROM visita_jornadas j
              INNER JOIN puntos_vacunacion p
                ON p.id = j.punto_vacunacion_id
              WHERE j.visita_id = v.id
            ),
            '[]'::json
          ) AS jornadas,

          COALESCE(
            (
              SELECT SUM(j.dosis_asignadas)
              FROM visita_jornadas j
              WHERE j.visita_id = v.id
            ),
            0
          )::INTEGER AS dosis_asignadas,

          COALESCE(
            (
              SELECT SUM(j.objetivo_dosis)
              FROM visita_jornadas j
              WHERE j.visita_id = v.id
            ),
            0
          )::INTEGER AS objetivo_dosis,

          (
            SELECT MIN(j.fecha_inicio)
            FROM visita_jornadas j
            WHERE j.visita_id = v.id
          ) AS fecha_inicio,

          (
            SELECT MAX(j.fecha_fin)
            FROM visita_jornadas j
            WHERE j.visita_id = v.id
          ) AS fecha_fin

        FROM visitas v

        INNER JOIN brigada_localidades bl
          ON bl.id = v.brigada_localidad_id

        INNER JOIN localidades l
          ON l.id = bl.localidad_id

        INNER JOIN brigadas b
          ON b.id = bl.brigada_id

        INNER JOIN campanias c
          ON c.id = b.campania_id

        WHERE
          ($1::BIGINT IS NULL OR c.id = $1)
          AND
          ($2::VARCHAR IS NULL OR v.estado = $2)
          AND
          (
            (
              $3::DATE IS NULL
              AND $4::DATE IS NULL
            )
            OR EXISTS (
              SELECT 1
              FROM visita_jornadas j
              WHERE j.visita_id = v.id
                AND ($3::DATE IS NULL OR j.fecha_fin >= $3)
                AND ($4::DATE IS NULL OR j.fecha_inicio <= $4)
            )
          )

        ORDER BY
          c.codigo,
          b.codigo,
          v.codigo;
      `;

      const valores = [
        filtros.campania_id ?? null,
        filtros.estado ?? null,
        filtros.desde || null,
        filtros.hasta || null,
      ];

      const resultado = await pool.query(
        consulta,
        valores
      );

      return resultado.rows;

    } catch (error) {
      this.manejarError(error);
    }
  }

  async obtenerPorId(id) {
    const visitas = await this.obtenerTodos();

    return visitas.find(
      (visita) => Number(visita.id) === Number(id)
    ) || null;
  }

  async insertarJornadas(
    client,
    visitaId,
    localidadId,
    jornadas
  ) {
    if (!Array.isArray(jornadas) || jornadas.length === 0) {
      throw this.errorPersonalizado(
        "Debes proporcionar al menos una jornada."
      );
    }

    for (const jornada of jornadas) {
      const puntoId = Number(jornada.punto_vacunacion_id);

      if (!Number.isSafeInteger(puntoId) || puntoId <= 0) {
        throw this.errorPersonalizado(
          "Uno de los puntos de vacunación seleccionados no es válido."
        );
      }

      // Verificar que el punto pertenezca a la localidad.
      const puntoResultado = await client.query(
        `
          SELECT id
          FROM puntos_vacunacion
          WHERE id = $1
            AND localidad_id = $2
            AND activo = TRUE;
        `,
        [puntoId, localidadId]
      );

      if (puntoResultado.rows.length === 0) {
        throw this.errorPersonalizado(
          "Uno de los puntos de vacunación no pertenece a la localidad seleccionada."
        );
      }

      // Insertar jornada.
      const resultadoJornada = await client.query(
        `
          INSERT INTO visita_jornadas (
            visita_id,
            punto_vacunacion_id,
            fecha_inicio,
            fecha_fin,
            hora_inicio,
            hora_fin,
            dosis_asignadas,
            objetivo_dosis,
            observaciones
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)

          RETURNING id;
        `,
        [
          visitaId,
          puntoId,
          jornada.fecha_inicio,
          jornada.fecha_fin,
          jornada.hora_inicio,
          jornada.hora_fin,
          Number(jornada.dosis_asignadas),
          Number(jornada.objetivo_dosis),
          jornada.observaciones?.trim() || null,
        ]
      );

      // Crear recorrido pendiente automáticamente.
      await client.query(
        `
          INSERT INTO recorridos (
            visita_jornada_id,
            origen_id,
            modo_transporte,
            estado
          )
          SELECT
            $1,
            id,
            'driving',
            'pendiente'
          FROM origenes_recorrido
          WHERE es_principal = TRUE
            AND activo = TRUE
          LIMIT 1
          ON CONFLICT (visita_jornada_id)
          DO NOTHING;
        `,
        [resultadoJornada.rows[0].id]
      );
    }
  }

  async crear(datos) {
    const client = await pool.connect();

    try {
      const visita = new Visita(datos);
      visita.validar();

      await client.query("BEGIN");

      const asignacionResultado = await client.query(
        `
          SELECT
            bl.id,
            bl.localidad_id,
            b.estado AS brigada_estado
          FROM brigada_localidades bl
          INNER JOIN brigadas b
            ON b.id = bl.brigada_id
          WHERE bl.id = $1
          FOR UPDATE OF b;
        `,
        [Number(visita.brigada_localidad_id)]
      );

      const asignacion = asignacionResultado.rows[0];

      if (!asignacion) {
        throw this.errorPersonalizado(
          "No se encontró la localidad asignada a la brigada.",
          404
        );
      }

      if (
        ["terminada", "cancelada"].includes(asignacion.brigada_estado)
      ) {
        throw this.errorPersonalizado(
          "No se pueden programar visitas para una brigada terminada o cancelada."
        );
      }

      const resultado = await client.query(
        `
          INSERT INTO visitas (
            brigada_localidad_id,
            codigo,
            nombre,
            estado,
            observaciones
          )
          VALUES ($1,$2,$3,'planeada',$4)
          RETURNING id;
        `,
        [
          Number(visita.brigada_localidad_id),
          visita.codigo.trim(),
          visita.nombre.trim(),
          visita.observaciones?.trim() || null,
        ]
      );

      const visitaId = resultado.rows[0].id;

      // Inserta jornadas y genera sus recorridos.
      await this.insertarJornadas(
        client,
        visitaId,
        asignacion.localidad_id,
        visita.jornadas
      );

      await this.sincronizarEstados(client);

      await client.query("COMMIT");

      return await this.obtenerPorId(visitaId);

    } catch (error) {
      await client.query("ROLLBACK");
      this.manejarError(error);

    } finally {
      client.release();
    }
  }

  async actualizar(id, datos) {
    try {
      const actual = await this.obtenerPorId(id);

      if (!actual) {
        return null;
      }

      if (["completada", "cancelada"].includes(actual.estado)) {
        throw this.errorPersonalizado(
          "No se puede modificar una visita completada o cancelada."
        );
      }

      const nombre = datos.nombre === undefined
        ? actual.nombre
        : String(datos.nombre).trim();

      const observaciones = Object.hasOwn(datos, "observaciones")
        ? datos.observaciones
        : actual.observaciones;

      if (!nombre) {
        throw this.errorPersonalizado(
          "El nombre de la visita es obligatorio."
        );
      }

      const resultado = await pool.query(
        `
          UPDATE visitas
          SET
            nombre = $1,
            observaciones = $2,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
          RETURNING id;
        `,
        [
          nombre,
          observaciones?.trim() || null,
          id,
        ]
      );

      if (!resultado.rows[0]) {
        return null;
      }

      return await this.obtenerPorId(id);

    } catch (error) {
      this.manejarError(error);
    }
  }

  async agregarJornadas(visitaId, jornadas) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const resultado = await client.query(
        `
          SELECT
            v.id,
            v.estado,
            bl.localidad_id
          FROM visitas v
          INNER JOIN brigada_localidades bl
            ON bl.id = v.brigada_localidad_id
          WHERE v.id = $1
          FOR UPDATE;
        `,
        [visitaId]
      );

      const visita = resultado.rows[0];

      if (!visita) {
        throw this.errorPersonalizado(
          "No se encontró la visita solicitada.",
          404
        );
      }

      if (["completada", "cancelada"].includes(visita.estado)) {
        throw this.errorPersonalizado(
          "No se pueden agregar jornadas a una visita completada o cancelada."
        );
      }

      // Este método ahora también genera recorridos.
      await this.insertarJornadas(
        client,
        visitaId,
        visita.localidad_id,
        jornadas
      );

      await this.sincronizarEstados(client);

      await client.query("COMMIT");

      return await this.obtenerPorId(visitaId);

    } catch (error) {
      await client.query("ROLLBACK");
      this.manejarError(error);

    } finally {
      client.release();
    }
  }

  async actualizarJornada(visitaId, jornadaId, datos) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const visitaResultado = await client.query(
        `
          SELECT
            v.id,
            v.estado,
            bl.localidad_id
          FROM visitas v
          INNER JOIN brigada_localidades bl
            ON bl.id = v.brigada_localidad_id
          WHERE v.id = $1
          FOR UPDATE;
        `,
        [visitaId]
      );

      const visita = visitaResultado.rows[0];

      if (!visita) {
        throw this.errorPersonalizado(
          "No se encontró la visita solicitada.",
          404
        );
      }

      if (["completada", "cancelada"].includes(visita.estado)) {
        throw this.errorPersonalizado(
          "No se pueden modificar jornadas de una visita completada o cancelada."
        );
      }

      // Obtener también el punto de vacunación actual.
      const jornadaResultado = await client.query(
        `
          SELECT
            id,
            estado,
            punto_vacunacion_id
          FROM visita_jornadas
          WHERE id = $1
            AND visita_id = $2
          FOR UPDATE;
        `,
        [jornadaId, visitaId]
      );

      const jornadaActual = jornadaResultado.rows[0];

      if (!jornadaActual) {
        throw this.errorPersonalizado(
          "No se encontró la jornada solicitada.",
          404
        );
      }

      if (jornadaActual.estado === "cancelada") {
        throw this.errorPersonalizado(
          "No se puede modificar una jornada cancelada."
        );
      }

      const puntoId = Number(datos.punto_vacunacion_id);

      if (!Number.isSafeInteger(puntoId) || puntoId <= 0) {
        throw this.errorPersonalizado(
          "El punto de vacunación seleccionado no es válido."
        );
      }

      const puntoResultado = await client.query(
        `
          SELECT id
          FROM puntos_vacunacion
          WHERE id = $1
            AND localidad_id = $2
            AND activo = TRUE;
        `,
        [puntoId, visita.localidad_id]
      );

      if (!puntoResultado.rows[0]) {
        throw this.errorPersonalizado(
          "El punto de vacunación no pertenece a la localidad de la visita."
        );
      }

      await client.query(
        `
          UPDATE visita_jornadas
          SET
            punto_vacunacion_id = $1,
            fecha_inicio = $2,
            fecha_fin = $3,
            hora_inicio = $4,
            hora_fin = $5,
            dosis_asignadas = $6,
            objetivo_dosis = $7,
            observaciones = $8,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $9
            AND visita_id = $10;
        `,
        [
          puntoId,
          datos.fecha_inicio,
          datos.fecha_fin,
          datos.hora_inicio,
          datos.hora_fin,
          Number(datos.dosis_asignadas),
          Number(datos.objetivo_dosis),
          datos.observaciones?.trim() || null,
          jornadaId,
          visitaId,
        ]
      );

      // Si cambió el punto de vacunación, reiniciar el recorrido anterior.
      if (
        Number(jornadaActual.punto_vacunacion_id) !== puntoId
      ) {
        await client.query(
          `
            UPDATE recorridos
            SET
              geometria = NULL,
              distancia_m = NULL,
              duracion_seg = NULL,
              proveedor = NULL,
              instrucciones = NULL,
              estado = 'pendiente',
              error_detalle = NULL,
              calculado_at = NULL,
              updated_at = CURRENT_TIMESTAMP
            WHERE visita_jornada_id = $1;
          `,
          [jornadaId]
        );
      }

      await this.sincronizarEstados(client);

      await client.query("COMMIT");

      return await this.obtenerPorId(visitaId);

    } catch (error) {
      await client.query("ROLLBACK");
      this.manejarError(error);

    } finally {
      client.release();
    }
  }

  async eliminarJornada(visitaId, jornadaId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const visitaResultado = await client.query(
        `
          SELECT id, estado
          FROM visitas
          WHERE id = $1
          FOR UPDATE;
        `,
        [visitaId]
      );

      const visita = visitaResultado.rows[0];

      if (!visita) {
        throw this.errorPersonalizado(
          "No se encontró la visita solicitada.",
          404
        );
      }

      if (["completada", "cancelada"].includes(visita.estado)) {
        throw this.errorPersonalizado(
          "No se pueden eliminar jornadas de una visita completada o cancelada."
        );
      }

      const resultado = await client.query(
        `
          DELETE FROM visita_jornadas
          WHERE id = $1
            AND visita_id = $2
          RETURNING id;
        `,
        [jornadaId, visitaId]
      );

      if (!resultado.rows[0]) {
        throw this.errorPersonalizado(
          "No se encontró la jornada solicitada.",
          404
        );
      }

      await this.sincronizarEstados(client);

      await client.query("COMMIT");

      return await this.obtenerPorId(visitaId);

    } catch (error) {
      await client.query("ROLLBACK");
      this.manejarError(error);

    } finally {
      client.release();
    }
  }

  async cancelar(id) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const resultado = await client.query(
        `
          SELECT id, estado
          FROM visitas
          WHERE id = $1
          FOR UPDATE;
        `,
        [id]
      );

      const visita = resultado.rows[0];

      if (!visita) {
        throw this.errorPersonalizado(
          "No se encontró la visita solicitada.",
          404
        );
      }

      if (visita.estado === "completada") {
        throw this.errorPersonalizado(
          "No se puede cancelar una visita que ya está completada."
        );
      }

      await client.query(
        `
          UPDATE visita_jornadas
          SET
            estado = 'cancelada',
            updated_at = CURRENT_TIMESTAMP
          WHERE visita_id = $1;
        `,
        [id]
      );

      await client.query(
        `
          UPDATE visitas
          SET
            estado = 'cancelada',
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1;
        `,
        [id]
      );

      await this.sincronizarEstados(client);

      await client.query("COMMIT");

      return await this.obtenerPorId(id);

    } catch (error) {
      await client.query("ROLLBACK");
      this.manejarError(error);

    } finally {
      client.release();
    }
  }

  async obtenerCatalogos() {
    try {
      const brigadasResultado = await pool.query(
        `
          SELECT
            bl.id AS brigada_localidad_id,
            l.id AS localidad_id,
            l.codigo AS localidad_codigo,
            l.nombre AS localidad,
            b.id AS brigada_id,
            b.codigo AS brigada_codigo,
            b.nombre AS brigada_nombre,
            b.estado AS brigada_estado,
            c.id AS campania_id,
            c.codigo AS campania_codigo,
            c.nombre AS campania_nombre,
            c.icono AS campania_icono,
            c.categoria AS campania_categoria,

            COALESCE(
              (
                SELECT json_agg(
                  json_build_object(
                    'id', bio.id,
                    'codigo', bio.codigo,
                    'nombre', bio.nombre,
                    'nombre_corto', bio.nombre_corto
                  )
                  ORDER BY bio.nombre
                )
                FROM campanias_biologicos cb
                INNER JOIN biologicos bio
                  ON bio.id = cb.biologico_id
                WHERE cb.campania_id = c.id
              ),
              '[]'::json
            ) AS biologicos

          FROM brigada_localidades bl
          INNER JOIN brigadas b
            ON b.id = bl.brigada_id
          INNER JOIN localidades l
            ON l.id = bl.localidad_id
          INNER JOIN campanias c
            ON c.id = b.campania_id

          WHERE b.estado NOT IN ('terminada', 'cancelada')

          ORDER BY c.codigo, b.codigo, l.nombre;
        `
      );

      const puntosResultado = await pool.query(
        `
          SELECT
            p.id,
            p.localidad_id,
            l.nombre AS localidad,
            p.nombre,
            p.direccion,
            p.referencia
          FROM puntos_vacunacion p
          INNER JOIN localidades l
            ON l.id = p.localidad_id
          WHERE p.activo = TRUE
          ORDER BY l.nombre, p.nombre;
        `
      );

      return {
        brigadas_localidades: brigadasResultado.rows,
        puntos_vacunacion: puntosResultado.rows,
      };

    } catch (error) {
      this.manejarError(error);
    }
  }

  async crearPuntoVacunacion(datos) {
    try {
      const localidadId = Number(datos.localidad_id);
      const nombre = datos.nombre?.trim();

      if (!Number.isSafeInteger(localidadId) || localidadId <= 0) {
        throw this.errorPersonalizado(
          "La localidad seleccionada no es válida."
        );
      }

      if (!nombre) {
        throw this.errorPersonalizado(
          "El nombre del punto de vacunación es obligatorio."
        );
      }

      const resultado = await pool.query(
        `
          INSERT INTO puntos_vacunacion (
            localidad_id,
            nombre,
            direccion,
            referencia,
            activo
          )
          VALUES ($1,$2,$3,$4,TRUE)
          RETURNING *;
        `,
        [
          localidadId,
          nombre,
          datos.direccion?.trim() || null,
          datos.referencia?.trim() || null,
        ]
      );

      return resultado.rows[0];

    } catch (error) {
      this.manejarError(error);
    }
  }

  async sincronizarEstados(client) {
    const fechaHoy = this.obtenerFechaMexico();

    // 1. Actualizar jornadas según su intervalo.

    await client.query(
      `
        UPDATE visita_jornadas
        SET
          estado = CASE
            WHEN $1::DATE < fecha_inicio
              THEN 'programada'
            WHEN $1::DATE <= fecha_fin
              THEN 'en_curso'
            ELSE 'completada'
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE estado <> 'cancelada';
      `,
      [fechaHoy]
    );

    // 2. Actualizar visitas.

    await client.query(
      `
        UPDATE visitas v
        SET
          estado = CASE
            WHEN resumen.total = 0
              THEN 'planeada'
            WHEN resumen.todas_canceladas
              THEN 'cancelada'
            WHEN resumen.todas_completadas
              THEN 'completada'
            WHEN resumen.alguna_iniciada
              THEN 'activa'
            ELSE 'planeada'
          END,
          updated_at = CURRENT_TIMESTAMP

        FROM (
          SELECT
            visita_id,
            COUNT(*) AS total,

            BOOL_AND(estado = 'cancelada')
              AS todas_canceladas,

            BOOL_AND(estado = 'completada')
              AS todas_completadas,

            BOOL_OR(
              estado IN ('en_curso', 'completada')
            ) AS alguna_iniciada

          FROM visita_jornadas
          GROUP BY visita_id
        ) resumen

        WHERE resumen.visita_id = v.id;
      `
    );

    // Visitas sin jornadas.

    await client.query(
      `
        UPDATE visitas v
        SET
          estado = 'planeada',
          updated_at = CURRENT_TIMESTAMP

        WHERE v.estado <> 'cancelada'
          AND NOT EXISTS (
            SELECT 1
            FROM visita_jornadas j
            WHERE j.visita_id = v.id
          );
      `
    );

    // 3. Actualizar brigadas.

    await client.query(
      `
        UPDATE brigadas b

        SET estado = CASE
          WHEN b.estado = 'en_ruta'
            THEN 'en_ruta'
          WHEN resumen.total = 0
            THEN 'disponible'
          WHEN resumen.todas_completadas
            THEN 'terminada'
          WHEN resumen.todas_canceladas
            THEN 'cancelada'
          WHEN resumen.alguna_activa
            THEN 'en_visita'
          WHEN resumen.alguna_planeada
            THEN 'asignada'
          ELSE b.estado
        END,

        updated_at = CURRENT_TIMESTAMP

        FROM (
          SELECT
            bl.brigada_id,
            COUNT(v.id) AS total,

            BOOL_AND(v.estado = 'completada')
              FILTER (WHERE v.id IS NOT NULL)
              AS todas_completadas,

            BOOL_AND(v.estado = 'cancelada')
              FILTER (WHERE v.id IS NOT NULL)
              AS todas_canceladas,

            BOOL_OR(v.estado = 'activa')
              AS alguna_activa,

            BOOL_OR(v.estado = 'planeada')
              AS alguna_planeada

          FROM brigada_localidades bl

          LEFT JOIN visitas v
            ON v.brigada_localidad_id = bl.id

          GROUP BY bl.brigada_id
        ) resumen

        WHERE resumen.brigada_id = b.id;
      `
    );

    // Brigadas sin visitas.

    await client.query(
      `
        UPDATE brigadas b
        SET
          estado = 'disponible',
          updated_at = CURRENT_TIMESTAMP

        WHERE b.estado NOT IN (
          'en_ruta',
          'terminada',
          'cancelada'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM brigada_localidades bl
          INNER JOIN visitas v
            ON v.brigada_localidad_id = bl.id
          WHERE bl.brigada_id = b.id
        );
      `
    );
  }

  async actualizarEstadosAutomaticos() {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await this.sincronizarEstados(client);

      await client.query("COMMIT");

      return {
        mensaje: "Estados de visitas y brigadas actualizados.",
        fecha: this.obtenerFechaMexico(),
      };

    } catch (error) {
      await client.query("ROLLBACK");
      this.manejarError(error);

    } finally {
      client.release();
    }
  }
}
