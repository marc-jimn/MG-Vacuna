import { cantidad, fechaCorta, hora, textoEstadoJornada } from "../inicioUtils";

export default function AgendaOperativa({ jornadas = [], proximas = [], cargando = false }) {
  return (
    <section className="inicio-card inicio-agenda-card">
      <div className="inicio-card-heading">
        <div>
          <span className="inicio-eyebrow">SEGUIMIENTO DIARIO</span>
          <h2>Agenda de hoy</h2>
          <p>Jornadas que tienen actividad programada para la fecha actual.</p>
        </div>
        <span className="inicio-heading-icon material-symbols-rounded">today</span>
      </div>

      {cargando ? (
        <div className="inicio-inline-loading"><span className="inicio-spinner" /> Consultando agenda…</div>
      ) : jornadas.length === 0 ? (
        <div className="inicio-empty-state">
          <span className="material-symbols-rounded">event_available</span>
          <strong>No hay jornadas registradas para hoy</strong>
          <span>Las próximas actividades aparecerán en el apartado de agenda.</span>
        </div>
      ) : (
        <div className="inicio-agenda-list">
          {jornadas.map((jornada) => (
            <article className="inicio-agenda-item" key={jornada.jornada_id}>
              <div className="inicio-agenda-time">
                <strong>{hora(jornada.hora_inicio)}</strong>
                <span>{hora(jornada.hora_fin)}</span>
              </div>
              <div className="inicio-agenda-marker"><span /></div>
              <div className="inicio-agenda-info">
                <div className="inicio-agenda-meta">
                  <span>{jornada.campania_codigo}</span>
                  <span className={`inicio-status ${jornada.jornada_estado}`}>{textoEstadoJornada(jornada.jornada_estado)}</span>
                </div>
                <strong>{jornada.punto_nombre}</strong>
                <p>{jornada.localidad} · {jornada.visita_codigo} · {jornada.brigada_codigo}</p>
                <small>{jornada.campania_nombre}</small>
                <div className="inicio-agenda-dose"><span className="material-symbols-rounded">vaccines</span>{cantidad(jornada.dosis_asignadas)} dosis asignadas</div>
              </div>
            </article>
          ))}
        </div>
      )}

      {proximas.length > 0 && (
        <div className="inicio-next-strip">
          <div className="inicio-next-title"><span className="material-symbols-rounded">upcoming</span><strong>Lo próximo · 7 días</strong></div>
          <div className="inicio-next-list">
            {proximas.slice(0, 3).map((jornada) => (
              <div className="inicio-next-item" key={jornada.jornada_id}>
                <span>{fechaCorta(jornada.fecha_inicio)}</span>
                <div><strong>{jornada.punto_nombre}</strong><small>{jornada.localidad} · {jornada.brigada_codigo}</small></div>
                <small>{hora(jornada.hora_inicio)}</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
