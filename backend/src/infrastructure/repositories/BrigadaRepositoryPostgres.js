import { pool } from "../database/database.js";
import { Brigada } from "../../domain/entities/Brigada.js";
import { BrigadaRepository } from "../../domain/repositories/BrigadaRepository.js";

export class BrigadaRepositoryPostgres extends BrigadaRepository {
  manejarError(error) {

    if (error.statusCode) {
      throw error;
    }

    if (error.code === "23505") {
      let mensaje = "El registro ya existe o está asignado.";
      if (error.constraint === "uq_brigadas_codigo_campania") {
        mensaje = "Ya existe una brigada con ese código en esta campaña.";
      }

      if (error.constraint === "uq_brigada_personal") {
        mensaje = "Una persona no puede repetirse dentro de la brigada.";
      }

      if (error.constraint === "uq_brigada_funcion_individual") {
        mensaje = "La brigada ya tiene asignada esa función.";
      }

      if (error.constraint === "uq_localidad_por_campania") {
        mensaje = "Una localidad ya está asignada a otra brigada de esta campaña.";
      }

      const nuevoError = new Error(mensaje);
      nuevoError.statusCode = 409;

      throw nuevoError;
    }

    if (error.code === "23503") {
      const nuevoError = new Error(
        "No se encontró la campaña, persona o localidad relacionada."
      );

      nuevoError.statusCode = 400;
      throw nuevoError;
    }

    if (error.code === "23514") {
      const nuevoError = new Error(
        "Uno de los datos no cumple las reglas de la base de datos."
      );

      nuevoError.statusCode = 400;
      throw nuevoError;
    }

    throw error;
  }

  async obtenerPorId(id) {
    const consulta = `
      SELECT
        b.*,

        c.codigo AS campania_codigo,
        c.nombre AS campania_nombre,
        c.icono AS campania_icono,
        c.categoria AS campania_categoria,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', bi.id,
                'personal_id', p.id,
                'numero_empleado', p.numero_empleado,
                'nombres', p.nombres,
                'apellido_paterno', p.apellido_paterno,
                'apellido_materno', p.apellido_materno,
                'funcion', bi.funcion,
                'rol_id', p.rol_id,
                'rol_nombre', r.nombre,
                'estado_personal', p.estado,
                'foto', p.foto
              )
              ORDER BY
                CASE bi.funcion
                  WHEN 'responsable' THEN 1
                  WHEN 'medico' THEN 2
                  WHEN 'enfermero' THEN 3
                  WHEN 'conductor' THEN 4
                END,
                p.nombres
            )

            FROM brigada_integrantes bi

            INNER JOIN personal p
              ON p.id = bi.personal_id

            LEFT JOIN rol r
              ON r.id = p.rol_id

            WHERE bi.brigada_id = b.id
          ),
          '[]'::json
        ) AS integrantes,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', l.id,
                'codigo', l.codigo,
                'nombre', l.nombre,
                'municipio', l.municipio
              )
              ORDER BY l.nombre
            )

            FROM brigada_localidades bl

            INNER JOIN localidades l
              ON l.id = bl.localidad_id

            WHERE bl.brigada_id = b.id
          ),
          '[]'::json
        ) AS localidades

      FROM brigadas b

      INNER JOIN campanias c
        ON c.id = b.campania_id

      WHERE b.id = $1;
    `;

    const resultado = await pool.query(consulta, [id]);

    return resultado.rows[0] || null;
  }

  async crear(datos) {
  try {
    const brigada = new Brigada(datos);

    brigada.validar();

    const consulta = `
      INSERT INTO brigadas (
        campania_id,
        codigo,
        nombre,
        descripcion,
        estado,
        capacidad_personal,
        dosis_asignadas,
        objetivo_dosis
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)

      RETURNING id;
    `;

    const valores = [
      Number(brigada.campania_id),
      brigada.codigo.trim(),
      brigada.nombre.trim(),
      brigada.descripcion?.trim() || null,
      brigada.estado,
      5,
      brigada.dosis_asignadas,
      brigada.objetivo_dosis,
    ];

    const resultado = await pool.query(consulta, valores);

    return await this.obtenerPorId(resultado.rows[0].id);

  } catch (error) {
    this.manejarError(error);
  }
}

async obtenerTodos(filtros = {}) {

  const consulta = `
    SELECT
      b.*,

      c.codigo AS campania_codigo,
      c.nombre AS campania_nombre,
      c.icono AS campania_icono,
      c.categoria AS campania_categoria,

      (
        SELECT COUNT(*)
        FROM brigada_integrantes bi
        WHERE bi.brigada_id = b.id
      )::INTEGER AS integrantes_count,

      (
        SELECT COUNT(*)
        FROM brigada_localidades bl
        WHERE bl.brigada_id = b.id
      )::INTEGER AS localidades_count,

      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', p.id,
              'personal_id', p.id,
              'numero_empleado', p.numero_empleado,
              'nombres', p.nombres,
              'apellido_paterno', p.apellido_paterno,
              'apellido_materno', p.apellido_materno,
              'funcion', bi.funcion,
              'rol_id', p.rol_id,
              'foto', p.foto
            )
            ORDER BY
              CASE bi.funcion
                WHEN 'responsable' THEN 1
                WHEN 'medico' THEN 2
                WHEN 'enfermero' THEN 3
                WHEN 'conductor' THEN 4
              END,
              p.nombres
          )

          FROM brigada_integrantes bi

          INNER JOIN personal p
            ON p.id = bi.personal_id

          WHERE bi.brigada_id = b.id
        ),
        '[]'::json
      ) AS integrantes

    FROM brigadas b

    INNER JOIN campanias c
      ON c.id = b.campania_id

    WHERE
      ($1::BIGINT IS NULL OR b.campania_id = $1)
      AND
      ($2::VARCHAR IS NULL OR b.estado = $2)

    ORDER BY
      b.created_at DESC,
      b.id DESC;
  `;

  const valores = [
    filtros.campania_id || null,
    filtros.estado || null,
  ];

  const resultado = await pool.query(consulta, valores);

  return resultado.rows;
}

  async actualizar(id, datos) {
    try {
      const actual = await this.obtenerPorId(id);

      if (!actual) {
        return null;
      }


      const brigada = new Brigada({
        ...actual,
        ...datos,
        id,
        campania_id: actual.campania_id,
        capacidad_personal: 5,
      });

      brigada.validar();

      const consulta = `
        UPDATE brigadas SET

          codigo = $1,
          nombre = $2,
          descripcion = $3,
          estado = $4,
          dosis_asignadas = $5,
          objetivo_dosis = $6,

          updated_at = CURRENT_TIMESTAMP

        WHERE id = $7

        RETURNING id;
      `;

      const valores = [
        brigada.codigo.trim(),
        brigada.nombre.trim(),
        brigada.descripcion?.trim() || null,
        brigada.estado,
        brigada.dosis_asignadas,
        brigada.objetivo_dosis,
        id,
      ];

      const resultado = await pool.query(consulta, valores);

      if (!resultado.rows[0]) {
        return null;
      }

      return await this.obtenerPorId(id);

    } catch (error) {
      this.manejarError(error);
    }
  }

  async asignarIntegrantes(brigadaId, integrantes) {

    if (!Array.isArray(integrantes)) {

      const error = new Error(
        "Debes proporcionar una lista de integrantes."
      );

      error.statusCode = 400;
      throw error;
    }

    if (integrantes.length !== 5) {

      const error = new Error(
        "Cada brigada debe tener exactamente cinco integrantes."
      );

      error.statusCode = 400;
      throw error;
    }

    const funcionesPermitidas = [
      "responsable",
      "medico",
      "enfermero",
      "conductor",
    ];

    const rolesEsperados = {
      responsable: 3,
      medico: 5,
      enfermero: 6,
      conductor: 7,
    };

    const cantidadFunciones = {
      responsable: 0,
      medico: 0,
      enfermero: 0,
      conductor: 0,
    };

    const ids = [];

    for (const integrante of integrantes) {

      const personalId = Number(integrante.personal_id);

      const funcion = integrante.funcion;

      if (
        !Number.isSafeInteger(personalId) ||
        personalId <= 0
      ) {
        const error = new Error(
          "Uno de los identificadores de personal no es válido."
        );

        error.statusCode = 400;
        throw error;
      }

      if (!funcionesPermitidas.includes(funcion)) {

        const error = new Error(
          "Una de las funciones seleccionadas no es válida."
        );

        error.statusCode = 400;
        throw error;
      }

      ids.push(personalId);

      cantidadFunciones[funcion]++;
    }

    // Evitar personas repetidas.

    if (new Set(ids).size !== 5) {

      const error = new Error(
        "Los integrantes de una brigada deben ser cinco personas diferentes."
      );

      error.statusCode = 400;
      throw error;
    }

    // Validar distribución exacta de funciones.

    if (
      cantidadFunciones.responsable !== 1 ||
      cantidadFunciones.medico !== 1 ||
      cantidadFunciones.enfermero !== 2 ||
      cantidadFunciones.conductor !== 1
    ) {

      const error = new Error(
        "La brigada debe tener 1 responsable, 1 médico, 2 enfermeros y 1 conductor."
      );

      error.statusCode = 400;
      throw error;
    }

    const client = await pool.connect();

    try {

      await client.query("BEGIN");

      // Verificar que exista la brigada.

      const brigadaResultado = await client.query(
        `
          SELECT id, campania_id, estado
          FROM brigadas
          WHERE id = $1
          FOR UPDATE;
        `,
        [brigadaId]
      );

      const brigada = brigadaResultado.rows[0];

      if (!brigada) {

        const error = new Error(
          "No se encontró la brigada solicitada."
        );

        error.statusCode = 404;
        throw error;
      }

      if (
        ["terminada", "cancelada"].includes(brigada.estado)
      ) {
        const error = new Error(
          "No se pueden asignar integrantes a una brigada terminada o cancelada."
        );

        error.statusCode = 400;
        throw error;
      }

      // Comprobar que todos los empleados existan y estén activos.

      const personalResultado = await client.query(
        `
          SELECT
            id,
            nombres,
            apellido_paterno,
            apellido_materno,
            rol_id,
            estado

          FROM personal

          WHERE id = ANY($1::BIGINT[])
            AND estado = 'activo';
        `,
        [ids]
      );

      if (personalResultado.rows.length !== 5) {

        const error = new Error(
          "Uno o más integrantes no existen o no están activos."
        );

        error.statusCode = 400;
        throw error;
      }

      // Comprobar que cada integrante tenga el rol correcto.

      for (const integrante of integrantes) {

        const personal = personalResultado.rows.find(
          (p) => Number(p.id) === Number(integrante.personal_id)
        );

        if (
          !personal ||
          Number(personal.rol_id) !== rolesEsperados[integrante.funcion]
        ) {

          const error = new Error(
            `El integrante seleccionado para la función "${integrante.funcion}" no tiene el rol correspondiente.`
          );

          error.statusCode = 400;
          throw error;
        }
      }

      // Reemplazar el equipo anterior.
      // La transacción permite deshacer todo si algo falla.

      await client.query(
        `
          DELETE FROM brigada_integrantes
          WHERE brigada_id = $1;
        `,
        [brigadaId]
      );

      for (const integrante of integrantes) {

        await client.query(
          `
            INSERT INTO brigada_integrantes (
              brigada_id,
              campania_id,
              personal_id,
              funcion
            )
            VALUES ($1,$2,$3,$4);
          `,
          [
            brigadaId,
            brigada.campania_id,
            Number(integrante.personal_id),
            integrante.funcion,
          ]
        );
      }

      await client.query("COMMIT");

    } catch (error) {

      await client.query("ROLLBACK");

      this.manejarError(error);

    } finally {

      client.release();

    }

    return await this.obtenerPorId(brigadaId);
  }

  async asignarLocalidades(brigadaId, localidadIds) {

    if (!Array.isArray(localidadIds)) {

      const error = new Error(
        "Debes proporcionar una lista de localidades."
      );

      error.statusCode = 400;
      throw error;
    }

    const ids = localidadIds.map(Number);

    if (
      ids.some(
        (id) => !Number.isSafeInteger(id) || id <= 0
      )
    ) {

      const error = new Error(
        "Uno o más identificadores de localidad no son válidos."
      );

      error.statusCode = 400;
      throw error;
    }

    // Evitar localidades duplicadas.

    const idsUnicos = [...new Set(ids)];

    const client = await pool.connect();

    try {

      await client.query("BEGIN");

      const brigadaResultado = await client.query(
        `
          SELECT id, campania_id, estado
          FROM brigadas
          WHERE id = $1
          FOR UPDATE;
        `,
        [brigadaId]
      );

      const brigada = brigadaResultado.rows[0];

      if (!brigada) {

        const error = new Error(
          "No se encontró la brigada solicitada."
        );

        error.statusCode = 404;
        throw error;
      }

      if (
        ["terminada", "cancelada"].includes(brigada.estado)
      ) {
        const error = new Error(
          "No se pueden asignar localidades a una brigada terminada o cancelada."
        );

        error.statusCode = 400;
        throw error;
      }

      // Comprobar que las localidades pertenezcan a la campaña.

      const localidadesValidas = await client.query(
        `
          SELECT
            cl.localidad_id,
            l.codigo,
            l.nombre

          FROM campanias_localidades cl

          INNER JOIN localidades l
            ON l.id = cl.localidad_id

          WHERE cl.campania_id = $1
            AND cl.localidad_id = ANY($2::BIGINT[]);
        `,
        [
          brigada.campania_id,
          idsUnicos,
        ]
      );

      if (localidadesValidas.rows.length !== idsUnicos.length) {

        const error = new Error(
          "Una o más localidades no pertenecen a las localidades asignadas a esta campaña."
        );

        error.statusCode = 400;
        throw error;
      }

      // Comprobar que ninguna localidad esté asignada a otra brigada de la misma campaña.

      if (idsUnicos.length > 0) {

        const conflictos = await client.query(
          `
            SELECT
              bl.localidad_id,
              b.codigo AS brigada_codigo,
              b.nombre AS brigada_nombre

            FROM brigada_localidades bl

            INNER JOIN brigadas b
              ON b.id = bl.brigada_id

            WHERE bl.campania_id = $1
              AND bl.localidad_id = ANY($2::BIGINT[])
              AND bl.brigada_id <> $3;
          `,
          [
            brigada.campania_id,
            idsUnicos,
            brigadaId,
          ]
        );

        if (conflictos.rows.length > 0) {

          const error = new Error(
            "Una o más localidades ya están asignadas a otra brigada de esta campaña."
          );

          error.statusCode = 409;
          throw error;
        }
      }

      // Reemplazar las localidades de esta brigada.

      await client.query(
        `
          DELETE FROM brigada_localidades
          WHERE brigada_id = $1;
        `,
        [brigadaId]
      );

      for (const localidadId of idsUnicos) {
        await client.query(
          `
            INSERT INTO brigada_localidades (
              campania_id,
              brigada_id,
              localidad_id
            )
            VALUES ($1,$2,$3);
          `,
          [
            brigada.campania_id,
            brigadaId,
            localidadId,
          ]
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      this.manejarError(error);
    } finally {
      client.release();
    }
    return await this.obtenerPorId(brigadaId);
  }
}