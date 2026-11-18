import TableroRepository from "../../domain/repositories/TableroRepository.js";

const CONSULTA_BASE_REPORTES = `
WITH jornadas_periodo AS (
  SELECT
    vj.id AS jornada_id,
    vj.visita_id,
    vj.fecha_inicio,
    vj.fecha_fin,
    vj.estado AS jornada_estado,
    vj.dosis_asignadas,
    vj.objetivo_dosis,
    v.codigo AS visita_codigo,
    v.nombre AS visita_nombre,
    b.id AS brigada_id,
    b.codigo AS brigada_codigo,
    b.nombre AS brigada_nombre,
    b.estado AS brigada_estado,
    c.id AS campania_id,
    c.codigo AS campania_codigo,
    c.nombre AS campania_nombre,
    c.categoria AS campania_categoria,
    l.id AS localidad_id,
    l.codigo AS localidad_codigo,
    l.nombre AS localidad_nombre,
    p.nombre AS punto_nombre
  FROM visita_jornadas vj
  JOIN visitas v ON v.id = vj.visita_id
  JOIN brigada_localidades bl ON bl.id = v.brigada_localidad_id
  JOIN brigadas b ON b.id = bl.brigada_id
  JOIN campanias c ON c.id = b.campania_id
  JOIN localidades l ON l.id = bl.localidad_id
  LEFT JOIN puntos_vacunacion p ON p.id = vj.punto_vacunacion_id
  WHERE vj.fecha_inicio <= $2::date
    AND vj.fecha_fin >= $1::date
    AND ($3::bigint IS NULL OR c.id = $3::bigint)
), movimientos_periodo AS (
  SELECT
    m.visita_jornada_id,
    COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'entrega_jornada'), 0)::BIGINT AS entregadas,
    COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'aplicacion'), 0)::BIGINT AS aplicadas,
    COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'devolucion_jornada'), 0)::BIGINT AS devueltas,
    COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento = 'merma'), 0)::BIGINT AS merma
  FROM movimientos_biologicos m
  WHERE m.fecha_operacion BETWEEN $1::date AND $2::date
    AND m.visita_jornada_id IS NOT NULL
  GROUP BY m.visita_jornada_id
)
`;

export default class TableroRepositoryPostgres extends TableroRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async obtenerInicio() {
    const consultaResumen = `
      SELECT
        (SELECT COUNT(*) FROM visita_jornadas j
          WHERE CURRENT_DATE BETWEEN j.fecha_inicio AND j.fecha_fin
            AND j.estado NOT IN ('cancelada'))::INT AS jornadas_hoy,
        (SELECT COUNT(*) FROM brigadas b
          WHERE b.estado IN ('en_ruta', 'en_visita'))::INT AS brigadas_en_campo,
        (SELECT COUNT(*) FROM visita_jornadas j
          WHERE j.fecha_inicio > CURRENT_DATE
            AND j.fecha_inicio <= CURRENT_DATE + INTERVAL '7 days'
            AND j.estado = 'programada')::INT AS proximas_jornadas,
        (SELECT COUNT(*) FROM notificaciones n
          WHERE n.leida_at IS NULL AND n.resuelta_at IS NULL)::INT AS avisos_pendientes,
        (SELECT COUNT(*) FROM campanias c
          WHERE CURRENT_DATE BETWEEN c.fecha_inicio AND c.fecha_fin
            AND c.estado NOT IN ('cancelada', 'finalizada'))::INT AS campanias_en_periodo,
        (SELECT COUNT(*) FROM brigadas b
          WHERE b.estado = 'disponible')::INT AS brigadas_disponibles
    `;

    const consultaAgendaHoy = `
      SELECT
        j.id AS jornada_id,
        v.codigo AS visita_codigo,
        v.nombre AS visita_nombre,
        c.codigo AS campania_codigo,
        c.nombre AS campania_nombre,
        c.categoria AS campania_categoria,
        b.codigo AS brigada_codigo,
        b.nombre AS brigada_nombre,
        l.nombre AS localidad,
        p.nombre AS punto_nombre,
        j.fecha_inicio,
        j.fecha_fin,
        j.hora_inicio,
        j.hora_fin,
        j.estado AS jornada_estado,
        j.dosis_asignadas,
        j.objetivo_dosis
      FROM visita_jornadas j
      JOIN visitas v ON v.id = j.visita_id
      JOIN brigada_localidades bl ON bl.id = v.brigada_localidad_id
      JOIN brigadas b ON b.id = bl.brigada_id
      JOIN campanias c ON c.id = b.campania_id
      JOIN localidades l ON l.id = bl.localidad_id
      JOIN puntos_vacunacion p ON p.id = j.punto_vacunacion_id
      WHERE CURRENT_DATE BETWEEN j.fecha_inicio AND j.fecha_fin
        AND j.estado <> 'cancelada'
      ORDER BY j.hora_inicio, c.codigo, b.codigo
      LIMIT 12
    `;

    const consultaProximas = `
      SELECT
        j.id AS jornada_id,
        v.codigo AS visita_codigo,
        c.codigo AS campania_codigo,
        c.nombre AS campania_nombre,
        b.codigo AS brigada_codigo,
        b.nombre AS brigada_nombre,
        l.nombre AS localidad,
        p.nombre AS punto_nombre,
        j.fecha_inicio,
        j.fecha_fin,
        j.hora_inicio,
        j.estado AS jornada_estado,
        j.dosis_asignadas
      FROM visita_jornadas j
      JOIN visitas v ON v.id = j.visita_id
      JOIN brigada_localidades bl ON bl.id = v.brigada_localidad_id
      JOIN brigadas b ON b.id = bl.brigada_id
      JOIN campanias c ON c.id = b.campania_id
      JOIN localidades l ON l.id = bl.localidad_id
      JOIN puntos_vacunacion p ON p.id = j.punto_vacunacion_id
      WHERE j.fecha_inicio > CURRENT_DATE
        AND j.fecha_inicio <= CURRENT_DATE + INTERVAL '7 days'
        AND j.estado = 'programada'
      ORDER BY j.fecha_inicio, j.hora_inicio
      LIMIT 8
    `;

    const consultaAlertas = `
      SELECT
        id, tipo, categoria, severidad, titulo, mensaje,
        campania_id, visita_id, visita_jornada_id, insumo_id,
        fecha_creacion, leida_at, resuelta_at
      FROM notificaciones
      WHERE resuelta_at IS NULL
      ORDER BY
        CASE severidad WHEN 'danger' THEN 1 WHEN 'warning' THEN 2 WHEN 'info' THEN 3 ELSE 4 END,
        fecha_creacion DESC
      LIMIT 5
    `;

    const consultaActividad = `
      SELECT * FROM (
        SELECT
          mb.id::TEXT AS id,
          'biologico'::TEXT AS categoria,
          mb.tipo_movimiento,
          mb.cantidad::NUMERIC AS cantidad,
          mb.created_at AS fecha,
          bio.nombre_corto AS elemento,
          c.codigo AS referencia,
          COALESCE(mb.persona_recibe, mb.persona_entrega) AS responsable
        FROM movimientos_biologicos mb
        JOIN inventario_biologico_lotes lote ON lote.id = mb.lote_id
        JOIN biologicos bio ON bio.id = lote.biologico_id
        JOIN campanias c ON c.id = lote.campania_id
        UNION ALL
        SELECT
          mi.id::TEXT AS id,
          'insumo'::TEXT AS categoria,
          mi.tipo_movimiento,
          mi.cantidad::NUMERIC AS cantidad,
          mi.created_at AS fecha,
          i.nombre AS elemento,
          i.codigo AS referencia,
          mi.responsable
        FROM movimientos_insumos mi
        JOIN insumos i ON i.id = mi.insumo_id
      ) actividad
      ORDER BY fecha DESC
      LIMIT 7
    `;

    const [resumen, agenda, proximas, alertas, actividad] = await Promise.all([
      this.pool.query(consultaResumen),
      this.pool.query(consultaAgendaHoy),
      this.pool.query(consultaProximas),
      this.pool.query(consultaAlertas),
      this.pool.query(consultaActividad),
    ]);

    return {
      resumen: resumen.rows[0] || {},
      agendaHoy: agenda.rows,
      proximasJornadas: proximas.rows,
      alertas: alertas.rows,
      actividadReciente: actividad.rows,
    };
  }

  async obtenerReportes(filtros = {}) {
    const desde = filtros.desde || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    const hasta = filtros.hasta || new Date().toISOString().slice(0, 10);
    const campaniaId = filtros.campania_id ? Number(filtros.campania_id) : null;

    if (Number.isNaN(Date.parse(desde)) || Number.isNaN(Date.parse(hasta))) {
      throw new Error("El periodo seleccionado no contiene fechas válidas.");
    }
    if (desde > hasta) {
      throw new Error("La fecha inicial no puede ser posterior a la fecha final.");
    }

    const params = [desde, hasta, campaniaId];

    const consultaResumen = `${CONSULTA_BASE_REPORTES}
      SELECT
        COUNT(DISTINCT j.jornada_id)::INT AS jornadas,
        COUNT(DISTINCT j.visita_codigo)::INT AS visitas,
        COUNT(DISTINCT j.brigada_id)::INT AS brigadas,
        COUNT(DISTINCT j.localidad_id)::INT AS localidades,
        COUNT(DISTINCT j.campania_id)::INT AS campanias,
        COUNT(DISTINCT j.jornada_id) FILTER (WHERE j.jornada_estado = 'completada')::INT AS jornadas_completadas,
        COALESCE(SUM(j.dosis_asignadas), 0)::BIGINT AS dosis_asignadas,
        COALESCE(SUM(j.objetivo_dosis), 0)::BIGINT AS objetivo_vacunacion,
        COALESCE(SUM(m.aplicadas), 0)::BIGINT AS dosis_aplicadas,
        COALESCE(SUM(m.devueltas), 0)::BIGINT AS dosis_devueltas,
        COALESCE(SUM(m.merma), 0)::BIGINT AS dosis_merma,
        COALESCE(SUM(GREATEST(COALESCE(m.entregadas, 0) - COALESCE(m.aplicadas, 0) - COALESCE(m.devueltas, 0) - COALESCE(m.merma, 0), 0)), 0)::BIGINT AS dosis_sin_justificar,
        COALESCE(SUM(r.distancia_m), 0)::NUMERIC(14,2) AS distancia_recorrida_m,
        CASE WHEN COALESCE(SUM(j.objetivo_dosis), 0) = 0 THEN 0
          ELSE ROUND((COALESCE(SUM(m.aplicadas), 0)::NUMERIC / SUM(j.objetivo_dosis)) * 100, 1)
        END AS cumplimiento_objetivo
      FROM jornadas_periodo j
      LEFT JOIN movimientos_periodo m ON m.visita_jornada_id = j.jornada_id
      LEFT JOIN recorridos r ON r.visita_jornada_id = j.jornada_id
    `;

    const consultaCampanias = `${CONSULTA_BASE_REPORTES}
      SELECT
        j.campania_id, j.campania_codigo, j.campania_nombre, j.campania_categoria,
        COUNT(DISTINCT j.jornada_id)::INT AS jornadas,
        COUNT(DISTINCT j.visita_codigo)::INT AS visitas,
        COUNT(DISTINCT j.brigada_id)::INT AS brigadas,
        COALESCE(SUM(j.dosis_asignadas), 0)::BIGINT AS dosis_asignadas,
        COALESCE(SUM(j.objetivo_dosis), 0)::BIGINT AS objetivo_vacunacion,
        COALESCE(SUM(m.aplicadas), 0)::BIGINT AS dosis_aplicadas,
        COALESCE(SUM(m.devueltas), 0)::BIGINT AS dosis_devueltas,
        COALESCE(SUM(m.merma), 0)::BIGINT AS dosis_merma,
        COALESCE(SUM(GREATEST(COALESCE(m.entregadas, 0) - COALESCE(m.aplicadas, 0) - COALESCE(m.devueltas, 0) - COALESCE(m.merma, 0), 0)), 0)::BIGINT AS dosis_sin_justificar,
        CASE WHEN COALESCE(SUM(j.objetivo_dosis), 0) = 0 THEN 0
          ELSE ROUND((COALESCE(SUM(m.aplicadas), 0)::NUMERIC / SUM(j.objetivo_dosis)) * 100, 1)
        END AS cumplimiento_objetivo
      FROM jornadas_periodo j
      LEFT JOIN movimientos_periodo m ON m.visita_jornada_id = j.jornada_id
      GROUP BY j.campania_id, j.campania_codigo, j.campania_nombre, j.campania_categoria
      ORDER BY j.campania_codigo
    `;

    const consultaLocalidades = `${CONSULTA_BASE_REPORTES}
      SELECT
        j.localidad_id, j.localidad_codigo, j.localidad_nombre,
        COUNT(DISTINCT j.jornada_id)::INT AS jornadas,
        COUNT(DISTINCT j.visita_codigo)::INT AS visitas,
        COUNT(DISTINCT j.brigada_id)::INT AS brigadas,
        COALESCE(SUM(j.dosis_asignadas), 0)::BIGINT AS dosis_asignadas,
        COALESCE(SUM(j.objetivo_dosis), 0)::BIGINT AS objetivo_vacunacion,
        COALESCE(SUM(m.aplicadas), 0)::BIGINT AS dosis_aplicadas,
        CASE WHEN COALESCE(SUM(j.objetivo_dosis), 0) = 0 THEN 0
          ELSE ROUND((COALESCE(SUM(m.aplicadas), 0)::NUMERIC / SUM(j.objetivo_dosis)) * 100, 1)
        END AS cumplimiento_objetivo
      FROM jornadas_periodo j
      LEFT JOIN movimientos_periodo m ON m.visita_jornada_id = j.jornada_id
      GROUP BY j.localidad_id, j.localidad_codigo, j.localidad_nombre
      ORDER BY dosis_aplicadas DESC, j.localidad_nombre
    `;

    const consultaBrigadas = `${CONSULTA_BASE_REPORTES}
      SELECT
        j.brigada_id, j.brigada_codigo, j.brigada_nombre, j.brigada_estado,
        j.campania_codigo, j.campania_nombre,
        COUNT(DISTINCT j.jornada_id)::INT AS jornadas,
        COUNT(DISTINCT j.visita_codigo)::INT AS visitas,
        COALESCE(SUM(j.dosis_asignadas), 0)::BIGINT AS dosis_asignadas,
        COALESCE(SUM(j.objetivo_dosis), 0)::BIGINT AS objetivo_vacunacion,
        COALESCE(SUM(m.aplicadas), 0)::BIGINT AS dosis_aplicadas,
        CASE WHEN COALESCE(SUM(j.objetivo_dosis), 0) = 0 THEN 0
          ELSE ROUND((COALESCE(SUM(m.aplicadas), 0)::NUMERIC / SUM(j.objetivo_dosis)) * 100, 1)
        END AS cumplimiento_objetivo
      FROM jornadas_periodo j
      LEFT JOIN movimientos_periodo m ON m.visita_jornada_id = j.jornada_id
      GROUP BY j.brigada_id, j.brigada_codigo, j.brigada_nombre, j.brigada_estado,
               j.campania_codigo, j.campania_nombre
      ORDER BY j.campania_codigo, j.brigada_codigo
    `;

    const consultaTendencia = `${CONSULTA_BASE_REPORTES}
      SELECT
        TO_CHAR(DATE_TRUNC('month', j.fecha_inicio), 'YYYY-MM') AS periodo,
        TO_CHAR(DATE_TRUNC('month', j.fecha_inicio), 'Mon YYYY') AS etiqueta,
        COUNT(DISTINCT j.jornada_id)::INT AS jornadas,
        COALESCE(SUM(j.objetivo_dosis), 0)::BIGINT AS objetivo_vacunacion,
        COALESCE(SUM(m.aplicadas), 0)::BIGINT AS dosis_aplicadas
      FROM jornadas_periodo j
      LEFT JOIN movimientos_periodo m ON m.visita_jornada_id = j.jornada_id
      GROUP BY DATE_TRUNC('month', j.fecha_inicio)
      ORDER BY DATE_TRUNC('month', j.fecha_inicio)
    `;

    const consultaInventario = `
      SELECT
        campania_id, campania_codigo, campania_nombre,
        biologico_codigo, biologico_nombre, stock_minimo,
        dosis_asignadas, objetivo_vacunacion, dosis_recibidas,
        dosis_programadas_recibir, existencia_en_campania,
        dosis_aplicadas, devueltas_por_jornadas, dosis_merma,
        dosis_sin_justificar, bajo_stock_minimo
      FROM vw_resumen_inventario_biologico_campanias
      WHERE (stock_minimo > 0 OR dosis_recibidas > 0 OR dosis_programadas_recibir > 0)
        AND ($1::bigint IS NULL OR campania_id = $1::bigint)
      ORDER BY campania_codigo
    `;

    const consultaInsumosBajos = `
      SELECT insumo_id, codigo, nombre, unidad, existencia_actual,
             stock_minimo, stock_objetivo_reposicion, cantidad_sugerida_reponer
      FROM vw_existencias_insumos
      WHERE bajo_stock_minimo = TRUE
      ORDER BY nombre
    `;

    const consultaCatalogoCampanias = `
      SELECT id, codigo, nombre, categoria
      FROM campanias
      ORDER BY codigo
    `;

    const [resumen, campanias, localidades, brigadas, tendencia, inventario, insumos, catalogo] = await Promise.all([
      this.pool.query(consultaResumen, params),
      this.pool.query(consultaCampanias, params),
      this.pool.query(consultaLocalidades, params),
      this.pool.query(consultaBrigadas, params),
      this.pool.query(consultaTendencia, params),
      this.pool.query(consultaInventario, [campaniaId]),
      this.pool.query(consultaInsumosBajos),
      this.pool.query(consultaCatalogoCampanias),
    ]);

    return {
      filtros: { desde, hasta, campania_id: campaniaId },
      resumen: resumen.rows[0] || {},
      campanias: campanias.rows,
      localidades: localidades.rows,
      brigadas: brigadas.rows,
      tendencia: tendencia.rows,
      inventarioBiologicos: inventario.rows,
      insumosBajoMinimo: insumos.rows,
      catalogoCampanias: catalogo.rows,
    };
  }
}
