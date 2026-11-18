import { pool } from "../database/database.js";

import { RecorridoRepository } from "../../domain/repositories/RecorridoRepository.js";

export class RecorridoRepositoryPostgres extends RecorridoRepository {
  constructor({ osrmService }) {
    super();
    this.osrmService = osrmService;
  }

  manejarError(error) {
    if (error.statusCode) {
      throw error;
    }

    if (error.code === "23503") {
      const nuevoError = new Error(
        "No se encontró alguno de los registros relacionados."
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

  async consultar(visitaId = null) {
    try {
      const consulta = `
        SELECT

          -- =============================================
          -- CAMPAÑA
          -- =============================================

          c.id AS campania_id,
          c.codigo AS campania_codigo,
          c.nombre AS campania_nombre,
          c.icono AS campania_icono,
          c.categoria AS campania_categoria,

          -- =============================================
          -- BRIGADA
          -- =============================================

          b.id AS brigada_id,
          b.codigo AS brigada_codigo,
          b.nombre AS brigada_nombre,
          b.estado AS brigada_estado,

          -- =============================================
          -- VISITA
          -- =============================================

          v.id AS visita_id,
          v.codigo AS visita_codigo,
          v.nombre AS visita_nombre,
          v.estado AS visita_estado,
          v.observaciones AS visita_observaciones,

          -- =============================================
          -- LOCALIDAD / SECTOR
          -- =============================================

          l.id AS localidad_id,
          l.codigo AS localidad_codigo,
          l.nombre AS sector,
          l.municipio,

          -- =============================================
          -- JORNADA
          -- =============================================

          j.id AS jornada_id,
          j.fecha_inicio,
          j.fecha_fin,
          j.hora_inicio,
          j.hora_fin,
          j.estado AS jornada_estado,

          j.dosis_asignadas,
          j.objetivo_dosis,

          -- =============================================
          -- PUNTO DE VACUNACIÓN
          -- =============================================

          p.id AS punto_id,
          p.nombre AS punto_nombre,
          p.direccion AS punto_direccion,
          p.referencia AS punto_referencia,

          ST_Y(p.ubicacion::geometry)
            AS punto_latitud,

          ST_X(p.ubicacion::geometry)
            AS punto_longitud,

          -- =============================================
          -- ORIGEN
          -- =============================================

          o.id AS origen_id,
          o.codigo AS origen_codigo,
          o.nombre AS origen_nombre,
          o.direccion AS origen_direccion,

          ST_Y(o.ubicacion::geometry)
            AS origen_latitud,

          ST_X(o.ubicacion::geometry)
            AS origen_longitud,

          -- =============================================
          -- RECORRIDO
          -- =============================================

          r.id AS recorrido_id,

          COALESCE(r.estado, 'pendiente')
            AS recorrido_estado,

          r.distancia_m,
          r.duracion_seg,
          r.modo_transporte,
          r.proveedor,
          r.instrucciones,
          r.error_detalle,
          r.calculado_at,

          CASE
            WHEN r.geometria IS NOT NULL
              THEN ST_AsGeoJSON(r.geometria)::json
            ELSE NULL
          END AS geometria

        FROM visitas v

        INNER JOIN brigada_localidades bl
          ON bl.id = v.brigada_localidad_id

        INNER JOIN brigadas b
          ON b.id = bl.brigada_id

        INNER JOIN campanias c
          ON c.id = b.campania_id

        INNER JOIN localidades l
          ON l.id = bl.localidad_id

        INNER JOIN visita_jornadas j
          ON j.visita_id = v.id

        INNER JOIN puntos_vacunacion p
          ON p.id = j.punto_vacunacion_id

        LEFT JOIN recorridos r
          ON r.visita_jornada_id = j.id

        LEFT JOIN origenes_recorrido o
          ON o.id = r.origen_id

        WHERE
          ($1::BIGINT IS NULL OR v.id = $1)

        ORDER BY
          c.codigo,
          b.codigo,
          v.codigo,
          j.fecha_inicio,
          j.hora_inicio;
      `;

      const resultado = await pool.query(
        consulta,
        [visitaId]
      );

      return resultado.rows;
    } catch (error) {
      this.manejarError(error);
    }
  }

  async obtenerTodos() {
    return await this.consultar();
  }

  async obtenerPorVisita(visitaId) {
    return await this.consultar(visitaId);
  }

  async prepararRecorridos(visitaId) {
    await pool.query(
      `
        INSERT INTO recorridos (
          visita_jornada_id,
          origen_id,
          modo_transporte,
          estado
        )

        SELECT
          j.id,
          o.id,
          'driving',
          'pendiente'

        FROM visita_jornadas j

        CROSS JOIN LATERAL (
          SELECT id
          FROM origenes_recorrido
          WHERE es_principal = TRUE
            AND activo = TRUE
          ORDER BY id
          LIMIT 1
        ) o

        WHERE j.visita_id = $1

        ON CONFLICT (visita_jornada_id)
        DO NOTHING;
      `,
      [visitaId]
    );
  }

  async calcularPorVisita(visitaId) {
    try {
      // 1. Comprobar que exista la visita.

      const visitaResultado = await pool.query(
        `
          SELECT id, codigo, nombre
          FROM visitas
          WHERE id = $1;
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

      // 2. Preparar los recorridos que puedan faltar.

      await this.prepararRecorridos(visitaId);

      // 3. Obtener las coordenadas de origen y destino.

      const jornadasResultado = await pool.query(
        `
          SELECT

            r.id AS recorrido_id,
            r.estado AS recorrido_estado,
            r.geometria,

            j.id AS jornada_id,
            j.estado AS jornada_estado,

            p.nombre AS punto_nombre,

            ST_Y(o.ubicacion::geometry)
              AS origen_latitud,

            ST_X(o.ubicacion::geometry)
              AS origen_longitud,

            ST_Y(p.ubicacion::geometry)
              AS destino_latitud,

            ST_X(p.ubicacion::geometry)
              AS destino_longitud

          FROM visita_jornadas j

          INNER JOIN recorridos r
            ON r.visita_jornada_id = j.id

          INNER JOIN puntos_vacunacion p
            ON p.id = j.punto_vacunacion_id

          INNER JOIN origenes_recorrido o
            ON o.id = r.origen_id

          WHERE j.visita_id = $1
            AND j.estado <> 'cancelada'

          ORDER BY
            j.fecha_inicio,
            j.hora_inicio;
        `,
        [visitaId]
      );

      const jornadas = jornadasResultado.rows;

      if (jornadas.length === 0) {
        throw this.errorPersonalizado(
          "Esta visita no tiene jornadas disponibles para calcular."
        );
      }

      const resultados = [];

      // 4. Calcular cada punto de forma independiente.

      for (const jornada of jornadas) {
        try {
          // Si ya está calculado, reutilizarlo.
          if (
            jornada.recorrido_estado === "calculado" &&
            jornada.geometria
          ) {
            resultados.push({
              jornada_id: jornada.jornada_id,
              punto: jornada.punto_nombre,
              estado: "calculado",
              reutilizado: true,
            });

            continue;
          }

          // Comprobar coordenadas.
          const origenValido =
            jornada.origen_latitud !== null &&
            jornada.origen_longitud !== null;

          const destinoValido =
            jornada.destino_latitud !== null &&
            jornada.destino_longitud !== null;

          if (!origenValido || !destinoValido) {
            throw new Error(
              "El origen o el punto de vacunación no tiene coordenadas."
            );
          }

          // Solicitar la ruta de ida y vuelta.
          const ruta = await this.osrmService.obtenerRutaIdaVuelta(
            {
              latitud: jornada.origen_latitud,
              longitud: jornada.origen_longitud,
            },
            {
              latitud: jornada.destino_latitud,
              longitud: jornada.destino_longitud,
            }
          );

          // Guardar geometría y datos del recorrido.
          await pool.query(
            `
              UPDATE recorridos

              SET
                geometria = ST_SetSRID(
                  ST_GeomFromGeoJSON($1),
                  4326
                ),

                distancia_m = $2,

                duracion_seg = $3,

                modo_transporte = 'driving',

                proveedor = 'OSRM',

                instrucciones = $4::JSONB,

                estado = 'calculado',

                error_detalle = NULL,

                calculado_at = CURRENT_TIMESTAMP,

                updated_at = CURRENT_TIMESTAMP

              WHERE id = $5;
            `,
            [
              JSON.stringify(ruta.geometria),
              ruta.distancia_m,
              ruta.duracion_seg,
              JSON.stringify(ruta.instrucciones),
              jornada.recorrido_id,
            ]
          );

          resultados.push({
            jornada_id: jornada.jornada_id,
            punto: jornada.punto_nombre,
            estado: "calculado",
            reutilizado: false,
            distancia_m: ruta.distancia_m,
            duracion_seg: ruta.duracion_seg,
          });

        } catch (errorRuta) {
          console.error(
            `Error calculando jornada ${jornada.jornada_id}:`,
            errorRuta.message
          );

          // Un error en una jornada no detiene las demás.
          await pool.query(
            `
              UPDATE recorridos

              SET
                estado = 'error',
                error_detalle = $1,
                updated_at = CURRENT_TIMESTAMP

              WHERE id = $2;
            `,
            [
              errorRuta.message.slice(0, 2000),
              jornada.recorrido_id,
            ]
          );

          resultados.push({
            jornada_id: jornada.jornada_id,
            punto: jornada.punto_nombre,
            estado: "error",
            mensaje: errorRuta.message,
          });
        }
      }

      // 5. Consultar los resultados ya guardados.

      const recorridosActualizados =
        await this.obtenerPorVisita(visitaId);

      const calculados = resultados.filter(
        (resultado) => resultado.estado === "calculado"
      ).length;

      const errores = resultados.filter(
        (resultado) => resultado.estado === "error"
      ).length;

      return {
        visita: {
          id: visita.id,
          codigo: visita.codigo,
          nombre: visita.nombre,
        },

        resumen: {
          total: jornadas.length,
          calculados,
          errores,
        },

        resultados,

        recorridos: recorridosActualizados,
      };

    } catch (error) {
      this.manejarError(error);
    }
  }
}