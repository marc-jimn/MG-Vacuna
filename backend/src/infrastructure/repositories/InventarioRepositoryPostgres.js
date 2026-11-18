import InventarioRepository from "../../domain/repositories/InventarioRepository.js";

const TIPOS_BIOLOGICOS = new Set([
  "entrega_brigada", "entrega_visita", "entrega_jornada", "aplicacion",
  "devolucion_jornada", "devolucion_visita", "devolucion_brigada",
  "devolucion_campania", "merma", "ajuste_entrada", "ajuste_salida"
]);
const TIPOS_INSUMOS = new Set(["entrada", "salida", "ajuste_positivo", "ajuste_negativo"]);

const ETIQUETAS_MOVIMIENTO = {
  recepcion_campania: "Recepción de biológico",
  recepcion_programada: "Recepción programada",
  entrega_brigada: "Entrega a brigada",
  entrega_visita: "Entrega a visita",
  entrega_jornada: "Entrega a jornada",
  aplicacion: "Aplicación registrada",
  devolucion_jornada: "Devolución de jornada",
  devolucion_visita: "Devolución de visita",
  devolucion_brigada: "Devolución de brigada",
  devolucion_campania: "Devolución a campaña",
  merma: "Merma registrada",
  ajuste_entrada: "Ajuste positivo de biológico",
  ajuste_salida: "Ajuste negativo de biológico",
  entrada: "Entrada de insumo",
  salida: "Salida de insumo",
  ajuste_positivo: "Ajuste positivo de insumo",
  ajuste_negativo: "Ajuste negativo de insumo"
};

class InventarioError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "InventarioError";
    this.statusCode = statusCode;
  }
}

const numeroPositivo = (valor, campo = "cantidad") => {
  const n = Number(valor);
  if (!Number.isFinite(n) || n <= 0) throw new InventarioError(`${campo} debe ser un número mayor que cero.`);
  return n;
};

const numeroDosis = (valor) => {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) throw new InventarioError("La cantidad de dosis debe ser un número entero mayor que cero.");
  return n;
};

const fechaValida = (valor, campo = "fecha_operacion") => {
  if (!valor) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor)) || Number.isNaN(Date.parse(`${valor}T00:00:00Z`))) {
    throw new InventarioError(`${campo} debe tener el formato YYYY-MM-DD.`);
  }
  return valor;
};

const aNumero = (valor) => Number(valor ?? 0);
const fechaTexto = (valor) => valor instanceof Date ? valor.toISOString().slice(0,10) : String(valor ?? "").slice(0,10);
const formatoCantidad = (valor) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(Number(valor ?? 0));

export default class InventarioRepositoryPostgres extends InventarioRepository {
  constructor(pool) {
    super();
    if (!pool || typeof pool.query !== "function" || typeof pool.connect !== "function") {
      throw new Error("InventarioRepositoryPostgres requiere una instancia Pool de pg.");
    }
    this.pool = pool;
  }

  async enTransaccion(callback) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const resultado = await callback(client);
      await client.query("COMMIT");
      return resultado;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async crearNotificacion(db, datos) {
    const {
      tipo, categoria, severidad = "info", titulo, mensaje,
      campania_id = null, visita_id = null, visita_jornada_id = null,
      lote_id = null, insumo_id = null, movimiento_biologico_id = null,
      movimiento_insumo_id = null, clave_deduplicacion, metadata = {}
    } = datos;

    await db.query(
      `INSERT INTO notificaciones
        (tipo, categoria, severidad, titulo, mensaje, campania_id, visita_id,
         visita_jornada_id, lote_id, insumo_id, movimiento_biologico_id,
         movimiento_insumo_id, clave_deduplicacion, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb)
       ON CONFLICT (clave_deduplicacion)
         WHERE clave_deduplicacion IS NOT NULL AND resuelta_at IS NULL
       DO UPDATE SET severidad = EXCLUDED.severidad,
                     titulo = EXCLUDED.titulo,
                     mensaje = EXCLUDED.mensaje,
                     metadata = EXCLUDED.metadata`,
      [tipo, categoria, severidad, titulo, mensaje, campania_id, visita_id,
       visita_jornada_id, lote_id, insumo_id, movimiento_biologico_id,
       movimiento_insumo_id, clave_deduplicacion ?? null, JSON.stringify(metadata)]
    );
  }

  async crearOActualizarAlerta(db, datos, columnaReferencia, idReferencia) {
    const permitidas = new Set(["insumo_id", "campania_id", "visita_jornada_id", "lote_id"]);
    if (!permitidas.has(columnaReferencia)) throw new Error("Referencia de alerta no permitida.");
    const existente = await db.query(
      `SELECT id FROM notificaciones
        WHERE ${columnaReferencia}=$1 AND tipo=$2 AND resuelta_at IS NULL
        ORDER BY fecha_creacion DESC LIMIT 1`,
      [idReferencia, datos.tipo]
    );
    if (!existente.rowCount) return this.crearNotificacion(db, datos);
    await db.query(
      `UPDATE notificaciones
          SET categoria=$2, severidad=$3, titulo=$4, mensaje=$5,
              metadata=$6::jsonb
        WHERE id=$1`,
      [existente.rows[0].id, datos.categoria, datos.severidad, datos.titulo,
       datos.mensaje, JSON.stringify(datos.metadata ?? {})]
    );
  }

  async resolverAlertaPorReferencia(db, columnaReferencia, idReferencia, tipo) {
    const permitidas = new Set(["insumo_id", "campania_id", "visita_jornada_id", "lote_id"]);
    if (!permitidas.has(columnaReferencia)) throw new Error("Referencia de alerta no permitida.");
    await db.query(
      `UPDATE notificaciones SET resuelta_at=NOW()
        WHERE ${columnaReferencia}=$1 AND tipo=$2 AND resuelta_at IS NULL`,
      [idReferencia, tipo]
    );
  }

  async resolverAlertasPorClave(db, clave) {
    await db.query(
      `UPDATE notificaciones
          SET resuelta_at = NOW()
        WHERE clave_deduplicacion = $1 AND resuelta_at IS NULL`,
      [clave]
    );
  }

  async sincronizarAlertas(db = this.pool) {
    // Alertas de existencias de insumos.
    const insumos = await db.query(`SELECT * FROM vw_existencias_insumos`);
    for (const item of insumos.rows) {
      const clave = `ALERTA-STOCK-INSUMO-${item.insumo_id}`;
      if (item.bajo_stock_minimo) {
        const objetivo = item.stock_objetivo_reposicion ?? item.stock_minimo;
        await this.crearOActualizarAlerta(db, {
          tipo: "stock_minimo_insumo", categoria: "insumos", severidad: "danger",
          titulo: "Insumo por debajo del stock mínimo",
          mensaje: `${item.nombre}: existencia de ${formatoCantidad(item.existencia_actual)} ${item.unidad.toLowerCase()}, por debajo del mínimo de ${formatoCantidad(item.stock_minimo)}. Reposición sugerida: ${formatoCantidad(item.cantidad_sugerida_reponer)} para alcanzar ${formatoCantidad(objetivo)}.`,
          insumo_id: item.insumo_id, clave_deduplicacion: clave,
          metadata: { existencia: aNumero(item.existencia_actual), stock_minimo: aNumero(item.stock_minimo), sugerencia: aNumero(item.cantidad_sugerida_reponer) }
        }, "insumo_id", item.insumo_id);
      } else {
        await this.resolverAlertaPorReferencia(db, "insumo_id", item.insumo_id, "stock_minimo_insumo");
      }
    }

    // Alerta de reserva biológica: se compara la existencia física en campaña,
    // no la recepción futura programada. No alerta lotes que aún no se reciben.
    const biologicos = await db.query(
      `SELECT r.*
         FROM vw_resumen_inventario_biologico_campanias r
        WHERE r.stock_minimo > 0
           OR EXISTS (
                SELECT 1
                  FROM inventario_biologico_lotes l
                 WHERE l.campania_id = r.campania_id
                   AND l.biologico_id = r.biologico_id
           )`
    );
    for (const item of biologicos.rows) {
      const clave = `ALERTA-STOCK-BIO-${item.campania_id}-${item.biologico_id}`;
      const existencia = aNumero(item.existencia_en_campania);
      const minimo = aNumero(item.stock_minimo);
      const recibido = aNumero(item.dosis_recibidas);
      if (recibido > 0 && existencia < minimo) {
        await this.crearOActualizarAlerta(db, {
          tipo: "stock_minimo_biologico", categoria: "biologicos", severidad: "danger",
          titulo: "Reserva mínima de biológico comprometida",
          mensaje: `${item.campania_codigo} · ${item.biologico_codigo}: quedan ${formatoCantidad(existencia)} dosis en campaña y la reserva mínima es de ${formatoCantidad(minimo)}.`,
          campania_id: item.campania_id, clave_deduplicacion: clave,
          metadata: { existencia, stock_minimo: minimo, dosis_asignadas: aNumero(item.dosis_asignadas) }
        }, "campania_id", item.campania_id);
      } else {
        await this.resolverAlertaPorReferencia(db, "campania_id", item.campania_id, "stock_minimo_biologico");
      }
    }

    // Alertas de conciliación para las jornadas que ya tuvieron movimiento.
    const conciliaciones = await db.query(
      `SELECT * FROM vw_conciliacion_jornadas_biologicas
        WHERE dosis_entregadas > 0 AND jornada_estado IN ('completada','cancelada')`
    );
    for (const item of conciliaciones.rows) {
      const claveDiferencia = `ALERTA-CONCILIACION-JORNADA-${item.visita_jornada_id}`;
      const claveCuadrado = `OK-CONCILIACION-JORNADA-${item.visita_jornada_id}`;
      if (aNumero(item.diferencia) > 0) {
        await this.resolverAlertaPorReferencia(db, "visita_jornada_id", item.visita_jornada_id, "conciliacion_jornada_completa");
        await this.crearOActualizarAlerta(db, {
          tipo: "diferencia_biologico_jornada", categoria: "biologicos", severidad: "danger",
          titulo: `Devolución incompleta: ${formatoCantidad(item.dosis_sin_justificar)} dosis sin justificar`,
          mensaje: `${item.punto_nombre}: se entregaron ${formatoCantidad(item.dosis_entregadas)} dosis, se aplicaron ${formatoCantidad(item.dosis_aplicadas)}, se devolvieron ${formatoCantidad(item.dosis_devueltas)} y se registró merma de ${formatoCantidad(item.dosis_merma)}. Faltan ${formatoCantidad(item.dosis_sin_justificar)} dosis por aclarar.`,
          campania_id: item.campania_id, visita_id: item.visita_id,
          visita_jornada_id: item.visita_jornada_id, clave_deduplicacion: claveDiferencia,
          metadata: { entregadas: aNumero(item.dosis_entregadas), aplicadas: aNumero(item.dosis_aplicadas), devueltas: aNumero(item.dosis_devueltas), merma: aNumero(item.dosis_merma), diferencia: aNumero(item.dosis_sin_justificar) }
        }, "visita_jornada_id", item.visita_jornada_id);
      } else if (aNumero(item.diferencia) === 0) {
        await this.resolverAlertaPorReferencia(db, "visita_jornada_id", item.visita_jornada_id, "diferencia_biologico_jornada");
        await this.crearOActualizarAlerta(db, {
          tipo: "conciliacion_jornada_completa", categoria: "biologicos", severidad: "success",
          titulo: "Jornada finalizada y conciliada",
          mensaje: `${item.punto_nombre}: ${formatoCantidad(item.dosis_entregadas)} dosis entregadas, ${formatoCantidad(item.dosis_aplicadas)} aplicadas y ${formatoCantidad(item.dosis_devueltas)} devueltas. La conciliación está completa.`,
          campania_id: item.campania_id, visita_id: item.visita_id,
          visita_jornada_id: item.visita_jornada_id, clave_deduplicacion: claveCuadrado,
          metadata: { entregadas: aNumero(item.dosis_entregadas), aplicadas: aNumero(item.dosis_aplicadas), devueltas: aNumero(item.dosis_devueltas) }
        }, "visita_jornada_id", item.visita_jornada_id);
      }
    }

    // Lotes activos próximos a caducar. Se evita notificar lotes sin existencia.
    const lotes = await db.query(
      `SELECT l.id, l.campania_id, l.codigo_lote, l.fecha_caducidad,
              c.codigo AS campania_codigo, b.codigo AS biologico_codigo,
              COALESCE(SUM(CASE
                WHEN m.tipo_movimiento IN ('recepcion_campania','devolucion_brigada','ajuste_entrada') THEN m.cantidad
                WHEN m.tipo_movimiento IN ('entrega_brigada','devolucion_campania','ajuste_salida') THEN -m.cantidad
                ELSE 0 END),0) AS existencia
         FROM inventario_biologico_lotes l
         JOIN campanias c ON c.id = l.campania_id
         JOIN biologicos b ON b.id = l.biologico_id
         LEFT JOIN movimientos_biologicos m ON m.lote_id = l.id
        WHERE l.activo = TRUE
        GROUP BY l.id, l.campania_id, l.codigo_lote, l.fecha_caducidad, c.codigo, b.codigo
       HAVING COALESCE(SUM(CASE
                WHEN m.tipo_movimiento IN ('recepcion_campania','devolucion_brigada','ajuste_entrada') THEN m.cantidad
                WHEN m.tipo_movimiento IN ('entrega_brigada','devolucion_campania','ajuste_salida') THEN -m.cantidad
                ELSE 0 END),0) > 0
          AND l.fecha_caducidad <= CURRENT_DATE + INTERVAL '60 days'`
    );
    for (const lote of lotes.rows) {
      const fechaCaducidad = fechaTexto(lote.fecha_caducidad);
      const dias = Math.ceil((new Date(`${fechaCaducidad}T00:00:00Z`) - new Date(`${new Date().toISOString().slice(0,10)}T00:00:00Z`)) / 86400000);
      const clave = `ALERTA-CADUCIDAD-LOTE-${lote.id}`;
      await this.crearOActualizarAlerta(db, {
        tipo: "lote_proximo_caducar", categoria: "biologicos",
        severidad: dias <= 30 ? "danger" : "warning",
        titulo: dias < 0 ? "Lote de biológico caducado" : "Lote próximo a caducar",
        mensaje: `${lote.biologico_codigo}, lote ${lote.codigo_lote}: fecha de caducidad ${fechaTexto(lote.fecha_caducidad)} (${dias < 0 ? `caducó hace ${Math.abs(dias)} días` : `faltan ${dias} días`}).`,
        campania_id: lote.campania_id, lote_id: lote.id,
        clave_deduplicacion: clave, metadata: { fecha_caducidad: lote.fecha_caducidad, dias_restantes: dias }
      }, "lote_id", lote.id);
    }
    const alertasLotesActivas = await db.query(
      `SELECT id, lote_id FROM notificaciones
        WHERE tipo='lote_proximo_caducar' AND resuelta_at IS NULL AND lote_id IS NOT NULL`
    );
    const idsLotesAlertados = new Set(lotes.rows.map(x => String(x.id)));
    for (const alerta of alertasLotesActivas.rows) {
      if (!idsLotesAlertados.has(String(alerta.lote_id))) {
        await this.resolverAlertaPorReferencia(db, "lote_id", alerta.lote_id, "lote_proximo_caducar");
      }
    }

    // Aviso preventivo: cuando faltan de uno a tres días para iniciar la campaña
    // y todavía no hay una recepción física confirmada.
    const recepcionesPendientes = await db.query(
      `SELECT c.id AS campania_id, c.codigo AS campania_codigo, c.nombre AS campania_nombre,
              b.codigo AS biologico_codigo,
              NULLIF(to_jsonb(c)->>'fecha_inicio','')::date AS fecha_inicio,
              COALESCE(SUM(m.cantidad) FILTER (WHERE m.tipo_movimiento='recepcion_programada'),0) AS dosis_programadas
         FROM campanias c
         JOIN campanias_biologicos cb ON cb.campania_id=c.id
         JOIN biologicos b ON b.id=cb.biologico_id
         LEFT JOIN inventario_biologico_lotes l ON l.campania_id=c.id AND l.biologico_id=b.id
         LEFT JOIN movimientos_biologicos m ON m.lote_id=l.id
        WHERE NULLIF(to_jsonb(c)->>'fecha_inicio','')::date BETWEEN CURRENT_DATE + 1 AND CURRENT_DATE + 3
          AND (
              cb.stock_minimo > 0
              OR EXISTS (
                  SELECT 1
                    FROM inventario_biologico_lotes li
                   WHERE li.campania_id = c.id
                     AND li.biologico_id = b.id
              )
         )
         AND NOT EXISTS (
            SELECT 1 FROM inventario_biologico_lotes lr
            JOIN movimientos_biologicos mr ON mr.lote_id=lr.id
            WHERE lr.campania_id=c.id AND lr.biologico_id=b.id
              AND mr.tipo_movimiento='recepcion_campania'
          )
        GROUP BY c.id,c.codigo,c.nombre,b.codigo,to_jsonb(c)->>'fecha_inicio'`
    );
    for (const pendiente of recepcionesPendientes.rows) {
      await this.crearOActualizarAlerta(db, {
        tipo: "recepcion_campania_pendiente", categoria: "campanias", severidad: "warning",
        titulo: "Recepción de biológico pendiente",
        mensaje: `${pendiente.campania_codigo} inicia el ${fechaTexto(pendiente.fecha_inicio)} y aún no registra recepción física de ${pendiente.biologico_codigo}${aNumero(pendiente.dosis_programadas) > 0 ? `; hay ${formatoCantidad(pendiente.dosis_programadas)} dosis programadas` : ""}.`,
        campania_id: pendiente.campania_id,
        clave_deduplicacion: `ALERTA-RECEPCION-PENDIENTE-${pendiente.campania_id}`,
        metadata: { fecha_inicio: pendiente.fecha_inicio, dosis_programadas: aNumero(pendiente.dosis_programadas) }
      }, "campania_id", pendiente.campania_id);
    }
    const alertasRecepcionActivas = await db.query(
      `SELECT n.campania_id FROM notificaciones n
        WHERE n.tipo='recepcion_campania_pendiente' AND n.resuelta_at IS NULL AND n.campania_id IS NOT NULL`
    );
    const idsCampaniasConPendiente = new Set(recepcionesPendientes.rows.map(x => String(x.campania_id)));
    for (const alerta of alertasRecepcionActivas.rows) {
      if (!idsCampaniasConPendiente.has(String(alerta.campania_id))) {
        await this.resolverAlertaPorReferencia(db, "campania_id", alerta.campania_id, "recepcion_campania_pendiente");
      }
    }
  }

  async obtenerResumen() {
    await this.sincronizarAlertas();
    const [biologicos, insumos, notificaciones, diferencias] = await Promise.all([
      this.pool.query(
        `SELECT r.*
           FROM vw_resumen_inventario_biologico_campanias r
          WHERE r.stock_minimo > 0
             OR EXISTS (
                  SELECT 1
                    FROM inventario_biologico_lotes l
                   WHERE l.campania_id = r.campania_id
                     AND l.biologico_id = r.biologico_id
             )
          ORDER BY r.campania_codigo, r.biologico_codigo`
      ),
      this.pool.query(`SELECT * FROM vw_existencias_insumos ORDER BY codigo`),
      this.pool.query(`SELECT COUNT(*)::int AS pendientes FROM notificaciones WHERE leida_at IS NULL AND resuelta_at IS NULL`),
      this.pool.query(`SELECT COUNT(*)::int AS jornadas, COALESCE(SUM(dosis_sin_justificar),0)::int AS dosis FROM vw_conciliacion_jornadas_biologicas WHERE jornada_estado IN ('completada','cancelada') AND dosis_sin_justificar > 0`)
    ]);
    return {
      biologicos: biologicos.rows,
      insumos: insumos.rows,
      notificaciones_pendientes: notificaciones.rows[0]?.pendientes ?? 0,
      alertas: {
        biologicos_bajo_minimo: biologicos.rows.filter(x => aNumero(x.dosis_recibidas) > 0 && aNumero(x.existencia_en_campania) < aNumero(x.stock_minimo)).length,
        insumos_bajo_minimo: insumos.rows.filter(x => x.bajo_stock_minimo).length,
        jornadas_con_diferencia: diferencias.rows[0]?.jornadas ?? 0,
        dosis_sin_justificar: aNumero(diferencias.rows[0]?.dosis)
      }
    };
  }

  async obtenerBiologicos() {
    const [campanias, lotes] = await Promise.all([
      this.pool.query(
        `SELECT r.*
           FROM vw_resumen_inventario_biologico_campanias r
          WHERE r.stock_minimo > 0
             OR EXISTS (
                  SELECT 1
                    FROM inventario_biologico_lotes l
                   WHERE l.campania_id = r.campania_id
                     AND l.biologico_id = r.biologico_id
             )
          ORDER BY r.campania_codigo, r.biologico_codigo`
      ),
      this.pool.query(
        `SELECT l.id, l.campania_id, c.codigo AS campania_codigo, c.nombre AS campania_nombre,
                l.biologico_id, b.codigo AS biologico_codigo, b.nombre AS biologico_nombre,
                l.codigo_lote, l.fabricante, l.fecha_caducidad, l.activo, l.observaciones,
                l.created_at, l.updated_at
           FROM inventario_biologico_lotes l
           JOIN campanias c ON c.id = l.campania_id
           JOIN biologicos b ON b.id = l.biologico_id
          ORDER BY c.codigo, l.fecha_caducidad`
      )
    ]);
    return { campanias: campanias.rows, lotes: lotes.rows };
  }

  async obtenerDetalleCampania(campaniaId) {
    const campania = await this.pool.query(
      `SELECT r.*
         FROM vw_resumen_inventario_biologico_campanias r
        WHERE (r.campania_id::text = $1 OR r.campania_codigo = $1)
          AND (
               r.stock_minimo > 0
               OR EXISTS (
                    SELECT 1
                      FROM inventario_biologico_lotes l
                     WHERE l.campania_id = r.campania_id
                       AND l.biologico_id = r.biologico_id
               )
          )
        ORDER BY r.biologico_codigo
        LIMIT 1`, [String(campaniaId)]
    );
    if (!campania.rowCount) throw new InventarioError("No se encontró la campaña o su relación con el biológico.", 404);

    const jerarquia = await this.pool.query(
      `SELECT c.codigo AS campania_codigo,
              br.id AS brigada_id, br.codigo AS brigada_codigo, br.nombre AS brigada_nombre,
              br.estado AS brigada_estado,
              bl.id AS brigada_localidad_id,
              v.id AS visita_id, v.codigo AS visita_codigo, v.nombre AS visita_nombre,
              v.estado AS visita_estado,
              vj.id AS visita_jornada_id, vj.fecha_inicio, vj.fecha_fin,
              vj.hora_inicio, vj.hora_fin, vj.estado AS jornada_estado,
              vj.dosis_asignadas, vj.objetivo_dosis,
              pv.id AS punto_id, pv.nombre AS punto_nombre,
              COALESCE(mj.dosis_entregadas,0) AS dosis_entregadas,
              COALESCE(mj.dosis_aplicadas,0) AS dosis_aplicadas,
              COALESCE(mj.dosis_devueltas,0) AS dosis_devueltas,
              COALESCE(mj.dosis_merma,0) AS dosis_merma,
              COALESCE(mj.dosis_sin_justificar,0) AS dosis_sin_justificar,
              COALESCE(mj.estado_conciliacion,'sin_entrega') AS estado_conciliacion,
              COALESCE(mv.entregadas,0) AS dosis_entregadas_visita,
              COALESCE(mb.entregadas,0) AS dosis_entregadas_brigada
         FROM campanias c
         JOIN brigadas br ON br.campania_id = c.id
         JOIN brigada_localidades bl ON bl.brigada_id = br.id
         JOIN visitas v ON v.brigada_localidad_id = bl.id
         JOIN visita_jornadas vj ON vj.visita_id = v.id
         LEFT JOIN puntos_vacunacion pv ON pv.id = vj.punto_vacunacion_id
         LEFT JOIN vw_conciliacion_jornadas_biologicas mj ON mj.visita_jornada_id = vj.id
         LEFT JOIN LATERAL (
           SELECT SUM(m.cantidad) AS entregadas
             FROM movimientos_biologicos m JOIN inventario_biologico_lotes l ON l.id=m.lote_id
            WHERE l.campania_id=c.id AND m.tipo_movimiento='entrega_visita' AND m.visita_id=v.id
         ) mv ON TRUE
         LEFT JOIN LATERAL (
           SELECT SUM(m.cantidad) AS entregadas
             FROM movimientos_biologicos m JOIN inventario_biologico_lotes l ON l.id=m.lote_id
            WHERE l.campania_id=c.id AND m.tipo_movimiento='entrega_brigada' AND m.brigada_id=br.id
         ) mb ON TRUE
        WHERE c.id = $1
        ORDER BY br.codigo, v.codigo, vj.fecha_inicio, vj.id`, [campania.rows[0].campania_id]
    );
    const lotes = await this.pool.query(
      `SELECT id, codigo_lote, fabricante, fecha_caducidad, activo, observaciones
         FROM inventario_biologico_lotes WHERE campania_id = $1 ORDER BY fecha_caducidad`,
      [campania.rows[0].campania_id]
    );
    return { resumen: campania.rows[0], lotes: lotes.rows, distribucion: jerarquia.rows };
  }

  async obtenerMovimientosBiologicos(filtros = {}) {
    const values = [];
    const where = [];
    const add = (sql, value) => { values.push(value); where.push(sql.replace("?", `$${values.length}`)); };
    if (filtros.campania) add("c.codigo = ?", filtros.campania);
    if (filtros.tipo) add("m.tipo_movimiento = ?", filtros.tipo);
    if (filtros.fecha_desde) add("m.fecha_operacion >= ?::date", fechaValida(filtros.fecha_desde, "fecha_desde"));
    if (filtros.fecha_hasta) add("m.fecha_operacion <= ?::date", fechaValida(filtros.fecha_hasta, "fecha_hasta"));
    if (filtros.lote_id) add("m.lote_id = ?", Number(filtros.lote_id));
    const limit = Math.min(Math.max(Number(filtros.limit) || 100, 1), 500);
    values.push(limit);
    const result = await this.pool.query(
      `SELECT m.id, m.lote_id, l.codigo_lote, b.codigo AS biologico_codigo,
              b.nombre AS biologico_nombre, c.codigo AS campania_codigo,
              c.nombre AS campania_nombre, m.tipo_movimiento, m.cantidad,
              m.brigada_id, br.codigo AS brigada_codigo,
              m.visita_id, v.codigo AS visita_codigo,
              m.visita_jornada_id, pv.nombre AS punto_nombre,
              m.fecha_operacion, m.persona_entrega, m.persona_recibe,
              m.observaciones, m.clave_registro, m.created_at
         FROM movimientos_biologicos m
         JOIN inventario_biologico_lotes l ON l.id=m.lote_id
         JOIN biologicos b ON b.id=l.biologico_id
         JOIN campanias c ON c.id=l.campania_id
         LEFT JOIN brigadas br ON br.id=m.brigada_id
         LEFT JOIN visitas v ON v.id=m.visita_id
         LEFT JOIN visita_jornadas vj ON vj.id=m.visita_jornada_id
         LEFT JOIN puntos_vacunacion pv ON pv.id=vj.punto_vacunacion_id
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY m.fecha_operacion DESC, m.created_at DESC
        LIMIT $${values.length}`,
      values
    );
    return result.rows;
  }

  async registrarRecepcionBiologica(datos = {}) {
    const cantidad = numeroDosis(datos.cantidad);
    const fecha = fechaValida(datos.fecha_operacion, "fecha_operacion") ?? new Date().toISOString().slice(0,10);
    return this.enTransaccion(async (client) => {
      let lote;
      if (datos.lote_id) {
        const result = await client.query(
          `SELECT l.*, c.codigo AS campania_codigo, b.codigo AS biologico_codigo
             FROM inventario_biologico_lotes l
             JOIN campanias c ON c.id=l.campania_id
             JOIN biologicos b ON b.id=l.biologico_id
            WHERE l.id=$1 FOR UPDATE OF l`, [datos.lote_id]
        );
        if (!result.rowCount) throw new InventarioError("El lote indicado no existe.", 404);
        lote = result.rows[0];
        if (!lote.activo) throw new InventarioError("El lote está inactivo. Confirma primero la recepción programada o activa un lote vigente.", 409);
        if (datos.campania_codigo && lote.campania_codigo !== datos.campania_codigo) throw new InventarioError("El lote no pertenece a la campaña indicada.");
      } else {
        if (!datos.campania_codigo || !datos.biologico_codigo || !datos.codigo_lote || !datos.fabricante || !fechaValida(datos.fecha_caducidad, "fecha_caducidad")) {
          throw new InventarioError("Para registrar un lote nuevo indica campaña, biológico, código de lote, fabricante y fecha de caducidad.");
        }
        const campania = await client.query(
          `SELECT cb.campania_id, cb.biologico_id
             FROM campanias_biologicos cb
             JOIN campanias c ON c.id=cb.campania_id
             JOIN biologicos b ON b.id=cb.biologico_id
            WHERE c.codigo=$1 AND b.codigo=$2`, [datos.campania_codigo, datos.biologico_codigo]
        );
        if (!campania.rowCount) throw new InventarioError("La campaña no tiene asociado ese biológico en campanias_biologicos.", 409);
        const insertLote = await client.query(
          `INSERT INTO inventario_biologico_lotes
             (campania_id, biologico_id, codigo_lote, fabricante, fecha_caducidad, activo, observaciones)
           VALUES ($1,$2,$3,$4,$5,TRUE,$6) RETURNING *`,
          [campania.rows[0].campania_id, campania.rows[0].biologico_id, datos.codigo_lote,
           datos.fabricante, datos.fecha_caducidad, datos.observaciones ?? null]
        );
        lote = insertLote.rows[0];
      }

      const insert = await client.query(
        `INSERT INTO movimientos_biologicos
          (lote_id, tipo_movimiento, cantidad, fecha_operacion, persona_recibe,
           observaciones, clave_registro)
         VALUES ($1,'recepcion_campania',$2,$3,$4,$5,$6)
         RETURNING *`,
        [lote.id, cantidad, fecha, datos.persona_recibe ?? null,
         datos.observaciones ?? "Recepción adicional registrada desde el módulo Inventario.",
         datos.clave_registro ?? null]
      );
      const movimiento = insert.rows[0];
      await this.crearNotificacion(client, {
        tipo: "recepcion_biologico_registrada", categoria: "biologicos", severidad: "info",
        titulo: "Recepción de biológico registrada",
        mensaje: `Se registraron ${formatoCantidad(cantidad)} dosis de ${lote.biologico_codigo ?? datos.biologico_codigo} para ${lote.campania_codigo ?? datos.campania_codigo}.`,
        campania_id: lote.campania_id, lote_id: lote.id, movimiento_biologico_id: movimiento.id,
        clave_deduplicacion: `MOV-BIO-${movimiento.id}`,
        metadata: { cantidad, fecha_operacion: fecha, tipo_movimiento: "recepcion_campania" }
      });
      await this.sincronizarAlertas(client);
      return movimiento;
    });
  }

  async confirmarRecepcionProgramada(movimientoId, datos = {}) {
    const fecha = fechaValida(datos.fecha_operacion, "fecha_operacion") ?? new Date().toISOString().slice(0,10);
    return this.enTransaccion(async (client) => {
      const result = await client.query(
        `SELECT m.*, l.campania_id, l.biologico_id, l.id AS id_lote,
                c.codigo AS campania_codigo, b.codigo AS biologico_codigo
           FROM movimientos_biologicos m
           JOIN inventario_biologico_lotes l ON l.id=m.lote_id
           JOIN campanias c ON c.id=l.campania_id
           JOIN biologicos b ON b.id=l.biologico_id
          WHERE m.id=$1 FOR UPDATE OF m, l`, [movimientoId]
      );
      if (!result.rowCount) throw new InventarioError("No se encontró el movimiento programado.", 404);
      const programada = result.rows[0];
      if (programada.tipo_movimiento !== "recepcion_programada") throw new InventarioError("El movimiento no corresponde a una recepción programada.", 409);
      const updated = await client.query(
        `UPDATE movimientos_biologicos
            SET tipo_movimiento='recepcion_campania', fecha_operacion=$2,
                persona_recibe=$3,
                observaciones=CONCAT(COALESCE(observaciones,''), CASE WHEN $4::text IS NULL OR $4='' THEN '' ELSE E'\\n' || $4 END)
          WHERE id=$1 RETURNING *`,
        [movimientoId, fecha, datos.persona_recibe ?? null, datos.observaciones ?? null]
      );
      await client.query(`UPDATE inventario_biologico_lotes SET activo=TRUE, updated_at=NOW() WHERE id=$1`, [programada.id_lote]);
      const movimiento = updated.rows[0];
      await this.crearNotificacion(client, {
        tipo: "recepcion_biologico_confirmada", categoria: "biologicos", severidad: "success",
        titulo: "Recepción programada confirmada",
        mensaje: `Se confirmó la recepción de ${formatoCantidad(programada.cantidad)} dosis de ${programada.biologico_codigo} para ${programada.campania_codigo}.`,
        campania_id: programada.campania_id, lote_id: programada.id_lote,
        movimiento_biologico_id: movimiento.id,
        clave_deduplicacion: `MOV-BIO-${movimiento.id}`,
        metadata: { cantidad: aNumero(programada.cantidad), fecha_operacion: fecha }
      });
      await this.sincronizarAlertas(client);
      return movimiento;
    });
  }

  async actualizarLoteBiologico(id, datos = {}) {
    const fechaCaducidad = Object.prototype.hasOwnProperty.call(datos, "fecha_caducidad")
      ? fechaValida(datos.fecha_caducidad, "fecha_caducidad") : null;
    if (Object.prototype.hasOwnProperty.call(datos, "activo") && typeof datos.activo !== "boolean") {
      throw new InventarioError("activo debe ser true o false.");
    }
    const result = await this.pool.query(
      `UPDATE inventario_biologico_lotes SET
         codigo_lote=COALESCE($2,codigo_lote),
         fabricante=COALESCE($3,fabricante),
         fecha_caducidad=COALESCE($4,fecha_caducidad),
         activo=COALESCE($5,activo),
         observaciones=CASE WHEN $6::boolean THEN $7 ELSE observaciones END,
         updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [id, datos.codigo_lote ?? null, datos.fabricante ?? null, fechaCaducidad,
       Object.prototype.hasOwnProperty.call(datos, "activo") ? datos.activo : null,
       Object.prototype.hasOwnProperty.call(datos, "observaciones"), datos.observaciones ?? null]
    );
    if (!result.rowCount) throw new InventarioError("No se encontró el lote.", 404);
    await this.sincronizarAlertas();
    return result.rows[0];
  }

  async obtenerContextoMovimiento(client, datos) {
    const loteResult = await client.query(
      `SELECT l.id, l.campania_id, l.biologico_id, l.activo, l.fecha_caducidad,
              c.codigo AS campania_codigo
         FROM inventario_biologico_lotes l JOIN campanias c ON c.id=l.campania_id
        WHERE l.id=$1 FOR UPDATE OF l`, [datos.lote_id]
    );
    if (!loteResult.rowCount) throw new InventarioError("El lote indicado no existe.", 404);
    const lote = loteResult.rows[0];
    const tipoMovimiento = datos.tipo_movimiento;
    const movimientosDeUso = new Set(["entrega_brigada", "entrega_visita", "entrega_jornada", "aplicacion"]);
    const movimientosDeRetornoOCierre = new Set(["devolucion_jornada", "devolucion_visita", "devolucion_brigada", "devolucion_campania", "merma"]);
    if (!lote.activo && !movimientosDeRetornoOCierre.has(tipoMovimiento)) {
      throw new InventarioError("No se pueden realizar entregas desde un lote inactivo.", 409);
    }
    const estaCaducado = new Date(`${fechaTexto(lote.fecha_caducidad)}T00:00:00Z`) < new Date(`${new Date().toISOString().slice(0,10)}T00:00:00Z`);
    if (estaCaducado && movimientosDeUso.has(tipoMovimiento)) {
      throw new InventarioError("El lote está caducado y no puede tener nuevas entregas o aplicaciones.", 409);
    }

    let entidad = null;
    const tipo = datos.tipo_movimiento;
    if (["entrega_brigada", "devolucion_brigada"].includes(tipo)) {
      if (!datos.brigada_id) throw new InventarioError("brigada_id es obligatorio para este movimiento.");
      const r = await client.query(`SELECT id,codigo,campania_id FROM brigadas WHERE id=$1 AND campania_id=$2`, [datos.brigada_id, lote.campania_id]);
      if (!r.rowCount) throw new InventarioError("La brigada no pertenece a la campaña del lote.", 409);
      entidad = r.rows[0];
    } else if (["entrega_visita", "devolucion_visita"].includes(tipo)) {
      if (!datos.visita_id) throw new InventarioError("visita_id es obligatorio para este movimiento.");
      const r = await client.query(
        `SELECT v.id,v.codigo,br.campania_id,br.id AS brigada_id
           FROM visitas v JOIN brigada_localidades bl ON bl.id=v.brigada_localidad_id
           JOIN brigadas br ON br.id=bl.brigada_id
          WHERE v.id=$1 AND br.campania_id=$2`, [datos.visita_id, lote.campania_id]
      );
      if (!r.rowCount) throw new InventarioError("La visita no pertenece a la campaña del lote.", 409);
      entidad = r.rows[0];
    } else if (["entrega_jornada", "aplicacion", "devolucion_jornada", "merma"].includes(tipo)) {
      if (!datos.visita_jornada_id) throw new InventarioError("visita_jornada_id es obligatorio para este movimiento.");
      const r = await client.query(
        `SELECT vj.id,vj.dosis_asignadas,v.id AS visita_id,v.codigo AS visita_codigo,
                br.campania_id,br.id AS brigada_id,pv.nombre AS punto_nombre
           FROM visita_jornadas vj JOIN visitas v ON v.id=vj.visita_id
           JOIN brigada_localidades bl ON bl.id=v.brigada_localidad_id
           JOIN brigadas br ON br.id=bl.brigada_id
           LEFT JOIN puntos_vacunacion pv ON pv.id=vj.punto_vacunacion_id
          WHERE vj.id=$1 AND br.campania_id=$2`, [datos.visita_jornada_id, lote.campania_id]
      );
      if (!r.rowCount) throw new InventarioError("La jornada no pertenece a la campaña del lote.", 409);
      entidad = r.rows[0];
    }
    return { lote, entidad };
  }

  async obtenerSaldoNivel(client, loteId, nivel, entidadId) {
    const formulas = {
      campania: `SUM(CASE
        WHEN m.tipo_movimiento IN ('recepcion_campania','devolucion_brigada','ajuste_entrada') THEN m.cantidad
        WHEN m.tipo_movimiento IN ('entrega_brigada','devolucion_campania','ajuste_salida') THEN -m.cantidad ELSE 0 END)`,
      brigada: `SUM(CASE
        WHEN m.tipo_movimiento='entrega_brigada' AND m.brigada_id=$2 THEN m.cantidad
        WHEN m.tipo_movimiento='devolucion_visita' AND m.visita_id IN (SELECT v.id FROM visitas v JOIN brigada_localidades bl ON bl.id=v.brigada_localidad_id WHERE bl.brigada_id=$2) THEN m.cantidad
        WHEN m.tipo_movimiento='entrega_visita' AND m.visita_id IN (SELECT v.id FROM visitas v JOIN brigada_localidades bl ON bl.id=v.brigada_localidad_id WHERE bl.brigada_id=$2) THEN -m.cantidad
        WHEN m.tipo_movimiento='devolucion_brigada' AND m.brigada_id=$2 THEN -m.cantidad ELSE 0 END)`,
      visita: `SUM(CASE
        WHEN m.tipo_movimiento='entrega_visita' AND m.visita_id=$2 THEN m.cantidad
        WHEN m.tipo_movimiento='devolucion_jornada' AND m.visita_jornada_id IN (SELECT id FROM visita_jornadas WHERE visita_id=$2) THEN m.cantidad
        WHEN m.tipo_movimiento='entrega_jornada' AND m.visita_jornada_id IN (SELECT id FROM visita_jornadas WHERE visita_id=$2) THEN -m.cantidad
        WHEN m.tipo_movimiento='devolucion_visita' AND m.visita_id=$2 THEN -m.cantidad ELSE 0 END)`,
      jornada: `SUM(CASE
        WHEN m.tipo_movimiento='entrega_jornada' AND m.visita_jornada_id=$2 THEN m.cantidad
        WHEN m.tipo_movimiento IN ('aplicacion','devolucion_jornada','merma') AND m.visita_jornada_id=$2 THEN -m.cantidad
        ELSE 0 END)`
    };
    if (!formulas[nivel]) throw new InventarioError("Nivel de inventario no válido.");
    const values = nivel === "campania" ? [loteId] : [loteId, entidadId];
    const sql = nivel === "campania"
      ? `SELECT COALESCE(${formulas[nivel]},0) AS saldo FROM movimientos_biologicos m WHERE m.lote_id=$1`
      : `SELECT COALESCE(${formulas[nivel]},0) AS saldo FROM movimientos_biologicos m WHERE m.lote_id=$1`;
    const result = await client.query(sql, values);
    return aNumero(result.rows[0]?.saldo);
  }

  async validarLimitePlan(client, lote, tipo, entidad) {
    let nivel, id, plan = 0, yaEntregado = 0;
    if (tipo === "entrega_brigada") {
      nivel = "brigada"; id = entidad.id;
      const r = await client.query(
        `SELECT COALESCE(SUM(vj.dosis_asignadas),0) AS plan,
                COALESCE((SELECT SUM(m.cantidad) FROM movimientos_biologicos m
                   JOIN inventario_biologico_lotes lm ON lm.id=m.lote_id
                  WHERE lm.campania_id=$1 AND lm.biologico_id=$2
                    AND m.tipo_movimiento='entrega_brigada' AND m.brigada_id=$3),0) AS entregado
           FROM brigada_localidades bl JOIN visitas v ON v.brigada_localidad_id=bl.id
           JOIN visita_jornadas vj ON vj.visita_id=v.id WHERE bl.brigada_id=$3`, [lote.campania_id,lote.biologico_id,id]
      );
      plan = aNumero(r.rows[0].plan); yaEntregado = aNumero(r.rows[0].entregado);
    } else if (tipo === "entrega_visita") {
      nivel = "visita"; id = entidad.id;
      const r = await client.query(
        `SELECT COALESCE(SUM(vj.dosis_asignadas),0) AS plan,
                COALESCE((SELECT SUM(m.cantidad) FROM movimientos_biologicos m
                   JOIN inventario_biologico_lotes lm ON lm.id=m.lote_id
                  WHERE lm.campania_id=$1 AND lm.biologico_id=$2
                    AND m.tipo_movimiento='entrega_visita' AND m.visita_id=$3),0) AS entregado
           FROM visita_jornadas vj WHERE vj.visita_id=$3`, [lote.campania_id,lote.biologico_id,id]
      );
      plan = aNumero(r.rows[0].plan); yaEntregado = aNumero(r.rows[0].entregado);
    } else if (tipo === "entrega_jornada") {
      nivel = "jornada"; id = entidad.id;
      const r = await client.query(
        `SELECT vj.dosis_asignadas AS plan,
                COALESCE((SELECT SUM(m.cantidad) FROM movimientos_biologicos m
                   JOIN inventario_biologico_lotes lm ON lm.id=m.lote_id
                  WHERE lm.campania_id=$1 AND lm.biologico_id=$2
                    AND m.tipo_movimiento='entrega_jornada' AND m.visita_jornada_id=$3),0) AS entregado
           FROM visita_jornadas vj WHERE vj.id=$3`, [lote.campania_id,lote.biologico_id,id]
      );
      plan = aNumero(r.rows[0]?.plan); yaEntregado = aNumero(r.rows[0]?.entregado);
    } else return;
    if (yaEntregado + aNumero(0) > plan) throw new InventarioError(`La distribución registrada ya supera la planificación de ${nivel}. Revisa las asignaciones antes de continuar.`, 409);
    return { nivel, plan, yaEntregado };
  }

  async registrarMovimientoBiologico(datos = {}) {
    const tipo = datos.tipo_movimiento;
    if (!TIPOS_BIOLOGICOS.has(tipo)) throw new InventarioError("tipo_movimiento no permitido. Usa una entrega, aplicación, devolución, merma o ajuste válido.");
    if (!Number.isInteger(Number(datos.lote_id)) || Number(datos.lote_id) <= 0) throw new InventarioError("lote_id es obligatorio y debe ser un entero positivo.");
    const cantidad = numeroDosis(datos.cantidad);
    const fecha = fechaValida(datos.fecha_operacion, "fecha_operacion") ?? new Date().toISOString().slice(0,10);
    if (["merma", "ajuste_salida", "ajuste_entrada"].includes(tipo) && !String(datos.observaciones ?? "").trim()) {
      throw new InventarioError("Este movimiento requiere observaciones que expliquen el motivo.");
    }
    if (["entrega_brigada", "devolucion_brigada"].includes(tipo) && !datos.brigada_id) throw new InventarioError("brigada_id es obligatorio.");
    if (["entrega_visita", "devolucion_visita"].includes(tipo) && !datos.visita_id) throw new InventarioError("visita_id es obligatorio.");
    if (["entrega_jornada", "aplicacion", "devolucion_jornada", "merma"].includes(tipo) && !datos.visita_jornada_id) throw new InventarioError("visita_jornada_id es obligatorio.");

    return this.enTransaccion(async (client) => {
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`, [`lote:${datos.lote_id}`]);
      const { lote, entidad } = await this.obtenerContextoMovimiento(client, datos);

      let nivelOrigen = null, entidadOrigenId = null;
      if (tipo === "entrega_brigada" || tipo === "devolucion_campania" || tipo === "ajuste_salida") nivelOrigen = "campania";
      if (tipo === "entrega_visita") { nivelOrigen = "brigada"; entidadOrigenId = entidad.brigada_id; }
      if (tipo === "entrega_jornada") { nivelOrigen = "visita"; entidadOrigenId = entidad.visita_id; }
      if (["aplicacion", "devolucion_jornada", "merma"].includes(tipo)) { nivelOrigen = "jornada"; entidadOrigenId = entidad.id; }
      if (tipo === "devolucion_visita") { nivelOrigen = "visita"; entidadOrigenId = entidad.id; }
      if (tipo === "devolucion_brigada") { nivelOrigen = "brigada"; entidadOrigenId = entidad.id; }

      if (nivelOrigen) {
        const saldo = await this.obtenerSaldoNivel(client, lote.id, nivelOrigen, entidadOrigenId);
        if (cantidad > saldo) throw new InventarioError(`Movimiento rechazado: hay ${formatoCantidad(saldo)} dosis disponibles en el nivel ${nivelOrigen}, pero intentas mover ${formatoCantidad(cantidad)}.`, 409);
      }

      if (["entrega_brigada", "entrega_visita", "entrega_jornada"].includes(tipo)) {
        const plan = await this.validarLimitePlan(client, lote, tipo, entidad);
        if (plan.yaEntregado + cantidad > plan.plan) {
          throw new InventarioError(`La cantidad excede la planificación. Quedan ${formatoCantidad(Math.max(plan.plan - plan.yaEntregado,0))} dosis asignables en este nivel.`, 409);
        }
      }

      const brigadaId = ["entrega_brigada", "devolucion_brigada"].includes(tipo) ? datos.brigada_id : null;
      const visitaId = ["entrega_visita", "devolucion_visita"].includes(tipo) ? datos.visita_id : null;
      const jornadaId = ["entrega_jornada", "aplicacion", "devolucion_jornada", "merma"].includes(tipo) ? datos.visita_jornada_id : null;
      const insert = await client.query(
        `INSERT INTO movimientos_biologicos
          (lote_id,tipo_movimiento,cantidad,brigada_id,visita_id,visita_jornada_id,
           fecha_operacion,persona_entrega,persona_recibe,observaciones,clave_registro)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [lote.id, tipo, cantidad, brigadaId, visitaId, jornadaId, fecha,
         datos.persona_entrega ?? null, datos.persona_recibe ?? null,
         datos.observaciones ?? null, datos.clave_registro ?? null]
      );
      const movimiento = insert.rows[0];
      const scope = entidad?.punto_nombre ?? entidad?.codigo ?? lote.campania_codigo;
      await this.crearNotificacion(client, {
        tipo: "movimiento_biologico_registrado", categoria: "biologicos", severidad: "info",
        titulo: ETIQUETAS_MOVIMIENTO[tipo] ?? "Movimiento de biológico registrado",
        mensaje: `${ETIQUETAS_MOVIMIENTO[tipo] ?? tipo}: ${formatoCantidad(cantidad)} dosis de ${lote.campania_codigo} (${scope}).`,
        campania_id: lote.campania_id, visita_id: entidad?.visita_id ?? (tipo.includes("visita") ? datos.visita_id : null),
        visita_jornada_id: jornadaId, lote_id: lote.id, movimiento_biologico_id: movimiento.id,
        clave_deduplicacion: `MOV-BIO-${movimiento.id}`,
        metadata: { tipo_movimiento: tipo, cantidad, fecha_operacion: fecha }
      });
      await this.sincronizarAlertas(client);
      return movimiento;
    });
  }

  async obtenerInsumos() {
    const result = await this.pool.query(`SELECT * FROM vw_existencias_insumos ORDER BY codigo`);
    return result.rows;
  }

  async obtenerMovimientosInsumos(filtros = {}) {
    const values = [];
    const where = [];
    const add = (sql, value) => { values.push(value); where.push(sql.replace("?", `$${values.length}`)); };
    if (filtros.insumo_id) add("mi.insumo_id = ?", Number(filtros.insumo_id));
    if (filtros.tipo) add("mi.tipo_movimiento = ?", filtros.tipo);
    if (filtros.fecha_desde) add("mi.fecha_operacion >= ?::date", fechaValida(filtros.fecha_desde, "fecha_desde"));
    if (filtros.fecha_hasta) add("mi.fecha_operacion <= ?::date", fechaValida(filtros.fecha_hasta, "fecha_hasta"));
    const limit = Math.min(Math.max(Number(filtros.limit) || 100, 1), 500);
    values.push(limit);
    const result = await this.pool.query(
      `SELECT mi.*, i.codigo AS insumo_codigo, i.nombre AS insumo_nombre, i.unidad
         FROM movimientos_insumos mi JOIN insumos i ON i.id=mi.insumo_id
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY mi.fecha_operacion DESC, mi.created_at DESC LIMIT $${values.length}`,
      values
    );
    return result.rows;
  }

  async registrarMovimientoInsumo(datos = {}) {
    const tipo = datos.tipo_movimiento;
    if (!TIPOS_INSUMOS.has(tipo)) throw new InventarioError("tipo_movimiento debe ser entrada, salida, ajuste_positivo o ajuste_negativo.");
    if (!Number.isInteger(Number(datos.insumo_id)) || Number(datos.insumo_id) <= 0) throw new InventarioError("insumo_id es obligatorio y debe ser un entero positivo.");
    const cantidad = numeroPositivo(datos.cantidad);
    const fecha = fechaValida(datos.fecha_operacion, "fecha_operacion") ?? new Date().toISOString().slice(0,10);
    if (["ajuste_positivo", "ajuste_negativo"].includes(tipo) && !String(datos.observaciones ?? "").trim()) throw new InventarioError("Los ajustes requieren una observación que justifique el cambio.");

    return this.enTransaccion(async (client) => {
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`, [`insumo:${datos.insumo_id}`]);
      const insumoResult = await client.query(`SELECT * FROM insumos WHERE id=$1 AND activo=TRUE FOR UPDATE`, [datos.insumo_id]);
      if (!insumoResult.rowCount) throw new InventarioError("El insumo no existe o está inactivo.", 404);
      const insumo = insumoResult.rows[0];
      if (["salida", "ajuste_negativo"].includes(tipo)) {
        const saldoResult = await client.query(`SELECT existencia_actual FROM vw_existencias_insumos WHERE insumo_id=$1`, [insumo.id]);
        const saldo = aNumero(saldoResult.rows[0]?.existencia_actual);
        if (cantidad > saldo) throw new InventarioError(`No hay existencia suficiente. Disponible: ${formatoCantidad(saldo)} ${insumo.unidad.toLowerCase()}.`, 409);
      }
      const insert = await client.query(
        `INSERT INTO movimientos_insumos
          (insumo_id,tipo_movimiento,cantidad,fecha_operacion,responsable,observaciones,clave_registro)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [insumo.id, tipo, cantidad, fecha, datos.responsable ?? null, datos.observaciones ?? null, datos.clave_registro ?? null]
      );
      const movimiento = insert.rows[0];
      await this.crearNotificacion(client, {
        tipo: "movimiento_insumo_registrado", categoria: "insumos", severidad: "info",
        titulo: ETIQUETAS_MOVIMIENTO[tipo],
        mensaje: `${ETIQUETAS_MOVIMIENTO[tipo]}: ${formatoCantidad(cantidad)} ${insumo.unidad.toLowerCase()} de ${insumo.nombre}.`,
        insumo_id: insumo.id, movimiento_insumo_id: movimiento.id,
        clave_deduplicacion: `MOV-INS-${movimiento.id}`,
        metadata: { tipo_movimiento: tipo, cantidad, fecha_operacion: fecha }
      });
      await this.sincronizarAlertas(client);
      return movimiento;
    });
  }

  async crearInsumo(datos = {}) {
    if (!datos.codigo || !datos.nombre || !datos.unidad) throw new InventarioError("codigo, nombre y unidad son obligatorios.");
    const stockMinimo = Number(datos.stock_minimo ?? 0);
    const objetivo = datos.stock_objetivo_reposicion == null || datos.stock_objetivo_reposicion === "" ? null : Number(datos.stock_objetivo_reposicion);
    if (!Number.isFinite(stockMinimo) || stockMinimo < 0 || (objetivo !== null && (!Number.isFinite(objetivo) || objetivo < stockMinimo))) throw new InventarioError("El stock mínimo y el objetivo de reposición no son válidos.");
    const result = await this.pool.query(
      `INSERT INTO insumos (codigo,nombre,unidad,stock_minimo,stock_objetivo_reposicion,observaciones)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [String(datos.codigo).trim(), String(datos.nombre).trim(), String(datos.unidad).trim(), stockMinimo, objetivo, datos.observaciones ?? null]
    );
    return result.rows[0];
  }

  async actualizarInsumo(id, datos = {}) {
    const stockMinimo = datos.stock_minimo == null ? null : Number(datos.stock_minimo);
    const objetivo = datos.stock_objetivo_reposicion == null || datos.stock_objetivo_reposicion === "" ? null : Number(datos.stock_objetivo_reposicion);
    if (stockMinimo !== null && (!Number.isFinite(stockMinimo) || stockMinimo < 0)) throw new InventarioError("stock_minimo debe ser cero o mayor.");
    if (objetivo !== null && (!Number.isFinite(objetivo) || objetivo < 0 || (stockMinimo !== null && objetivo < stockMinimo))) throw new InventarioError("El objetivo de reposición debe ser mayor o igual al stock mínimo.");
    const result = await this.pool.query(
      `UPDATE insumos SET
         nombre=COALESCE($2,nombre), unidad=COALESCE($3,unidad),
         stock_minimo=COALESCE($4,stock_minimo),
         stock_objetivo_reposicion=CASE WHEN $5::boolean THEN $6 ELSE stock_objetivo_reposicion END,
         observaciones=COALESCE($7,observaciones), updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [id, datos.nombre ?? null, datos.unidad ?? null, stockMinimo,
       Object.prototype.hasOwnProperty.call(datos,"stock_objetivo_reposicion"), objetivo,
       datos.observaciones ?? null]
    );
    if (!result.rowCount) throw new InventarioError("No se encontró el insumo.", 404);
    await this.sincronizarAlertas();
    return result.rows[0];
  }

  async obtenerNotificaciones(filtros = {}) {
    await this.sincronizarAlertas();
    const values = [];
    const where = [];
    if (filtros.categoria) { values.push(filtros.categoria); where.push(`categoria=$${values.length}`); }
    if (filtros.solo_pendientes === "true" || filtros.solo_pendientes === true) where.push("leida_at IS NULL AND resuelta_at IS NULL");
    const limit = Math.min(Math.max(Number(filtros.limit) || 100, 1), 300);
    values.push(limit);
    const result = await this.pool.query(
      `SELECT n.*, c.codigo AS campania_codigo, v.codigo AS visita_codigo,
              i.codigo AS insumo_codigo, i.nombre AS insumo_nombre,
              l.codigo_lote
         FROM notificaciones n
         LEFT JOIN campanias c ON c.id=n.campania_id
         LEFT JOIN visitas v ON v.id=n.visita_id
         LEFT JOIN insumos i ON i.id=n.insumo_id
         LEFT JOIN inventario_biologico_lotes l ON l.id=n.lote_id
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY n.fecha_creacion DESC LIMIT $${values.length}`,
      values
    );
    const pendientes = await this.pool.query(`SELECT COUNT(*)::int AS total FROM notificaciones WHERE leida_at IS NULL AND resuelta_at IS NULL`);
    return { notificaciones: result.rows, pendientes: pendientes.rows[0].total };
  }

  async marcarNotificacionLeida(id) {
    const result = await this.pool.query(`UPDATE notificaciones SET leida_at=COALESCE(leida_at,NOW()) WHERE id=$1 RETURNING *`, [id]);
    if (!result.rowCount) throw new InventarioError("No se encontró la notificación.", 404);
    return result.rows[0];
  }

  async resolverNotificacion(id) {
    const result = await this.pool.query(`UPDATE notificaciones SET resuelta_at=COALESCE(resuelta_at,NOW()), leida_at=COALESCE(leida_at,NOW()) WHERE id=$1 RETURNING *`, [id]);
    if (!result.rowCount) throw new InventarioError("No se encontró la notificación.", 404);
    return result.rows[0];
  }
}
