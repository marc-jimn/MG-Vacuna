import { useNavigate } from "react-router-dom";
import { fechaCorta, iconoAviso } from "../inicioUtils";

export default function PanelAtencion({ alertas = [], cargando = false }) {
  const navigate = useNavigate();
  return (
    <section className="inicio-card inicio-attention-card">
      <div className="inicio-card-heading">
        <div>
          <span className="inicio-eyebrow">CENTRO DE ATENCIÓN</span>
          <h2>Señales por revisar</h2>
          <p>Avisos abiertos que pueden requerir seguimiento.</p>
        </div>
        <span className="inicio-heading-icon material-symbols-rounded">notifications_active</span>
      </div>
      {cargando ? (
        <div className="inicio-inline-loading"><span className="inicio-spinner" /> Consultando avisos…</div>
      ) : alertas.length === 0 ? (
        <div className="inicio-empty-state compact">
          <span className="material-symbols-rounded">verified</span>
          <strong>Todo está tranquilo por ahora</strong>
          <span>No hay avisos abiertos que requieran atención.</span>
        </div>
      ) : (
        <div className="inicio-alert-list">
          {alertas.slice(0, 4).map((alerta) => (
            <button type="button" className={`inicio-alert-item ${alerta.severidad}`} key={alerta.id} onClick={() => navigate("/notificaciones")}>
              <span className="inicio-alert-icon material-symbols-rounded">{iconoAviso(alerta.severidad)}</span>
              <span className="inicio-alert-copy"><strong>{alerta.titulo}</strong><small>{alerta.mensaje}</small><em>{fechaCorta(alerta.fecha_creacion)}</em></span>
              <span className="material-symbols-rounded inicio-alert-arrow">chevron_right</span>
            </button>
          ))}
        </div>
      )}
      <button type="button" className="inicio-link-button" onClick={() => navigate("/notificaciones")}>
        <span className="inicio-link-text">Abrir centro de notificaciones</span>
        <span className="material-symbols-rounded">arrow_forward</span>
      </button>
    </section>
  );
}
