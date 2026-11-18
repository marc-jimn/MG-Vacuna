import { agregarDias, colorCampania, diferenciaDias, fechaISO, fechaLocal, meses } from "../visitaUtils";

function construirSemanas(mesActual, eventos) {
  const primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
  const desplazamiento = (primerDia.getDay() + 6) % 7;
  const inicio = agregarDias(primerDia, -desplazamiento);
  const dias = Array.from({ length: 42 }, (_, i) => agregarDias(inicio, i));

  return Array.from({ length: 6 }, (_, indice) => {
    const semana = dias.slice(indice * 7, indice * 7 + 7);
    const inicioSemana = fechaISO(semana[0]);
    const finSemana = fechaISO(semana[6]);

    const segmentos = eventos
      .filter((evento) => evento.inicio <= finSemana && evento.fin >= inicioSemana)
      .map((evento) => {
        const desde = evento.inicio < inicioSemana ? semana[0] : fechaLocal(evento.inicio);
        const hasta = evento.fin > finSemana ? semana[6] : fechaLocal(evento.fin);
        return {
          ...evento,
          columnaInicio: diferenciaDias(semana[0], desde) + 1,
          columnaFin: diferenciaDias(semana[0], hasta) + 1,
        };
      })
      .sort((a, b) => a.columnaInicio - b.columnaInicio || b.columnaFin - a.columnaFin);

    const carriles = [];
    segmentos.forEach((segmento) => {
      let carril = carriles.findIndex((ultimoDia) => ultimoDia < segmento.columnaInicio);
      if (carril === -1) {
        carril = carriles.length;
        carriles.push(segmento.columnaFin);
      } else {
        carriles[carril] = segmento.columnaFin;
      }
      segmento.carril = carril;
    });

    return { dias: semana, segmentos, carriles: Math.max(carriles.length, 1) };
  });
}

export default function CalendarioVisitas({
  mesActual,
  eventos,
  fechaSeleccionada,
  hoy,
  seleccion,
  onCambiarMes,
  onIrHoy,
  onSeleccionarFecha,
  onSeleccionarEvento,
}) {
  const semanas = construirSemanas(mesActual, eventos);
  const hoyISO = fechaISO(hoy);

  return (
    <section className="vis-calendar-panel">
      <header className="vis-calendar-header">
        <div>
          <span className="vis-calendar-eyebrow">PLANIFICACIÓN MENSUAL</span>
          <h2>{meses[mesActual.getMonth()]} <span>{mesActual.getFullYear()}</span></h2>
          <p>Selecciona un intervalo para consultar su programación.</p>
        </div>
        <div className="vis-calendar-navigation">
          <button type="button" onClick={onIrHoy}>Hoy</button>
          <button type="button" onClick={() => onCambiarMes(-1)} aria-label="Mes anterior">
            <span className="material-symbols-rounded">chevron_left</span>
          </button>
          <button type="button" onClick={() => onCambiarMes(1)} aria-label="Mes siguiente">
            <span className="material-symbols-rounded">chevron_right</span>
          </button>
        </div>
      </header>

      <div className="vis-calendar-legend">
        <span><i className="vph" /> VPH</span>
        <span><i className="influenza" /> Influenza</span>
        <span><i className="rabia" /> Rabia</span>
        <span className="vis-legend-note">Cada barra representa un intervalo completo.</span>
      </div>

      <div className="vis-calendar-grid">
        <div className="vis-calendar-weekdays">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((dia) => (
            <div key={dia}>{dia}</div>
          ))}
        </div>

        {semanas.map((semana) => (
          <div
            className="vis-calendar-week"
            key={fechaISO(semana.dias[0])}
            style={{ "--vis-lanes": semana.carriles }}
          >
            {semana.dias.map((dia, indice) => {
              const iso = fechaISO(dia);
              return (
                <button
                  type="button"
                  key={iso}
                  className={[
                    "vis-calendar-day",
                    dia.getMonth() !== mesActual.getMonth() ? "outside" : "",
                    iso === hoyISO ? "today" : "",
                    iso === fechaSeleccionada ? "focused" : "",
                  ].join(" ")}
                  style={{ gridColumn: indice + 1, gridRow: 1 }}
                  onClick={() => onSeleccionarFecha(iso)}
                >
                  <span>{dia.getDate()}</span>
                  {iso === hoyISO && <i className="vis-today-dot" />}
                </button>
              );
            })}

            {semana.segmentos.map((evento) => {
              const seleccionada =
                Number(seleccion?.visitaId) === Number(evento.visita.id) &&
                Number(seleccion?.jornadaId) === Number(evento.jornada.id);
              return (
                <button
                  type="button"
                  key={`${evento.visita.id}-${evento.jornada.id}-${fechaISO(semana.dias[0])}`}
                  className={[
                    "vis-calendar-event",
                    colorCampania(evento.visita),
                    evento.visita.estado === "cancelada" ? "cancelada" : "",
                    seleccionada ? "selected" : "",
                  ].join(" ")}
                  style={{
                    gridColumn: `${evento.columnaInicio} / ${evento.columnaFin + 1}`,
                    gridRow: evento.carril + 2,
                  }}
                  onClick={() => onSeleccionarEvento(evento.visita, evento.jornada)}
                  title={`${evento.visita.codigo} · ${evento.jornada.punto_vacunacion}`}
                >
                  <b>{evento.visita.codigo}</b>
                  <span>{evento.jornada.punto_vacunacion}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {eventos.length === 0 && (
        <div className="vis-calendar-no-events">
          <span className="material-symbols-rounded">event_busy</span>
          <strong>No hay jornadas con estos filtros</strong>
          <small>Prueba con otro mes o modifica los filtros.</small>
        </div>
      )}

      <footer className="vis-calendar-footer">
        <span><span className="material-symbols-rounded">info</span> Los intervalos incluyen la fecha inicial y la fecha final.</span>
        <strong>{eventos.length} jornadas visibles</strong>
      </footer>
    </section>
  );
}