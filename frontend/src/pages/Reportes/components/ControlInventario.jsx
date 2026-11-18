import { cantidad, numero } from "../reportesUtils";

export default function ControlInventario({ biologicos = [], insumos = [] }) {
  return (
    <section className="rep-inventory-grid">
      <article className="rep-card rep-inventory-card">
        <div className="rep-card-heading"><div><span className="rep-eyebrow">TRAZABILIDAD DE DOSIS</span><h2>Control de biológicos</h2><p>Existencia y conciliación actual por campaña.</p></div><span className="material-symbols-rounded rep-card-icon">vaccines</span></div>
        {biologicos.length === 0 ? <div className="rep-empty">No hay campañas con inventario configurado.</div> : <div className="rep-biologic-list">
          {biologicos.map((item) => <div className="rep-biologic-row" key={`${item.campania_id}-${item.biologico_codigo}`}>
            <div className="rep-biologic-top"><div><strong>{item.campania_codigo} · {item.biologico_codigo}</strong><small>{item.campania_nombre}</small></div><b>{cantidad(item.existencia_en_campania)} <small>en campaña</small></b></div>
            <div className="rep-biologic-details"><span>Recibidas <b>{cantidad(item.dosis_recibidas)}</b></span><span>Aplicadas <b>{cantidad(item.dosis_aplicadas)}</b></span><span>Reserva <b>{cantidad(item.stock_minimo)}</b></span></div>
            {numero(item.dosis_sin_justificar) > 0 && <div className="rep-inline-warning"><span className="material-symbols-rounded">error</span>{cantidad(item.dosis_sin_justificar)} dosis sin justificar requieren revisión.</div>}
            {item.dosis_programadas_recibir > 0 && <div className="rep-inline-info"><span className="material-symbols-rounded">schedule</span>{cantidad(item.dosis_programadas_recibir)} dosis con recepción programada.</div>}
          </div>)}
        </div>}
      </article>
      <article className="rep-card rep-supply-card">
        <div className="rep-card-heading"><div><span className="rep-eyebrow">ALMACÉN GENERAL</span><h2>Insumos por reabastecer</h2><p>Material operativo por debajo del stock mínimo.</p></div><span className="material-symbols-rounded rep-card-icon">inventory_2</span></div>
        {insumos.length === 0 ? <div className="rep-empty"><span className="material-symbols-rounded">task_alt</span>No hay insumos por debajo del mínimo.</div> : <div className="rep-supply-list">
          {insumos.map((item) => <div className="rep-supply-row" key={item.insumo_id}><span className="rep-supply-warning material-symbols-rounded">priority_high</span><div><strong>{item.nombre}</strong><small>{cantidad(item.existencia_actual)} {item.unidad} disponibles · mínimo {cantidad(item.stock_minimo)}</small></div><b>+{cantidad(item.cantidad_sugerida_reponer)} <small>{item.unidad}</small></b></div>)}
        </div>}
      </article>
    </section>
  );
}
