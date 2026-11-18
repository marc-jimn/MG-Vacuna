import { cantidad, fechaCorta, textoMovimiento } from "../inicioUtils";

const iconoMovimiento = (item) => {
  if (item.categoria === "insumo") return "inventory_2";
  if (String(item.tipo_movimiento).includes("devolucion")) return "keyboard_return";
  if (item.tipo_movimiento === "aplicacion") return "vaccines";
  if (String(item.tipo_movimiento).includes("recepcion")) return "move_to_inbox";
  return "swap_horiz";
};

export default function ActividadReciente({ movimientos = [], cargando = false }) {
  return (
    <section className="inicio-card inicio-activity-card">
      <div className="inicio-card-heading">
        <div><span className="inicio-eyebrow">BITÁCORA DEL SISTEMA</span><h2>Actividad reciente</h2><p>Últimos movimientos registrados en la plataforma.</p></div>
        <span className="inicio-heading-icon material-symbols-rounded">history</span>
      </div>
      {cargando ? <div className="inicio-inline-loading"><span className="inicio-spinner" /> Cargando actividad…</div> : movimientos.length === 0 ? (
        <div className="inicio-empty-state compact"><span className="material-symbols-rounded">history_toggle_off</span><strong>Aún no hay movimientos recientes</strong><span>Cuando se registren operaciones aparecerán aquí.</span></div>
      ) : (
        <div className="inicio-activity-list">
          {movimientos.map((item) => (
            <div className="inicio-activity-item" key={`${item.categoria}-${item.id}`}>
              <span className={`inicio-activity-icon ${item.categoria}`}><span className="material-symbols-rounded">{iconoMovimiento(item)}</span></span>
              <div className="inicio-activity-copy"><strong>{textoMovimiento(item.tipo_movimiento)}</strong><small>{item.elemento} · {item.referencia || (item.categoria === "insumo" ? "Insumos" : "Biológicos")}</small><em>{fechaCorta(item.fecha)}{item.responsable ? ` · ${item.responsable}` : ""}</em></div>
              <b>{cantidad(item.cantidad)}</b>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
