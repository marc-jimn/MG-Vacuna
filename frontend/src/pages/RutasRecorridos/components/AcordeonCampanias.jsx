import { useEffect, useState } from "react";

import {
  ESTADOS_JORNADA,
  ESTADOS_VISITA,
  colorDeRuta,
  formatearHora,
  formatearRango,
  formatearDistancia,
  formatearDuracion,
  duracionPorTramo,
} from "../rutasUtils";

function IconoCampania({ categoria }) {
  return (
    <span className={`material-symbols-rounded rutas-campaign-symbol ${categoria === "veterinaria" ? "vet" : "hum"}`}>
      {categoria === "veterinaria" ? "pets" : "vaccines"}
    </span>
  );
}

function JornadaLinea({ jornada, indice, ruta, color, seleccionada, onSeleccionar }) {
  const estado = jornada.estado || "programada";
  const completada = estado === "completada";
  const cancelada = estado === "cancelada";
  const tramos = ruta?.instrucciones?.tramos || [];
  const ida = duracionPorTramo({ tramos }, "ida");
  const regreso = duracionPorTramo({ tramos }, "regreso");

  return (
    <button
      type="button"
      className={`rutas-stop ${seleccionada ? "selected" : ""} ${estado}`}
      style={{ "--rutas-color": color }}
      onClick={onSeleccionar}
      title={`Seleccionar ${jornada.punto_vacunacion || "punto de vacunación"}`}
    >
      <span className={`rutas-stop-marker ${completada ? "done" : ""} ${cancelada ? "cancelled" : ""}`}>
        <span className="material-symbols-rounded">
          {completada ? "check" : cancelada ? "close" : "location_on"}
        </span>
      </span>

      <span className="rutas-stop-card">
        <span className="rutas-stop-top">
          <strong>{jornada.punto_vacunacion || `Punto ${indice + 1}`}</strong>
          <small className={`rutas-stop-state ${estado}`}>
            {ESTADOS_JORNADA[estado] || estado}
          </small>
        </span>

        <span className="rutas-stop-date">
          <span className="material-symbols-rounded">calendar_month</span>
          {formatearRango(jornada.fecha_inicio, jornada.fecha_fin)}
        </span>

        <span className="rutas-stop-meta">
          <span><span className="material-symbols-rounded">schedule</span>{formatearHora(jornada.hora_inicio)}–{formatearHora(jornada.hora_fin)}</span>
          <span><span className="material-symbols-rounded">vaccines</span>{Number(jornada.dosis_asignadas || 0).toLocaleString("es-MX")} dosis</span>
        </span>

        {ruta?.recorrido_estado === "calculado" && (
          <span className="rutas-stop-route-metrics">
            <span className="rutas-route-color" style={{ background: color }} />
            <span>{formatearDistancia(ruta.distancia_m)}</span>
            <span>·</span>
            <span>{formatearDuracion(ruta.duracion_seg)} ida + vuelta</span>
          </span>
        )}

        {ruta?.recorrido_estado === "error" && (
          <span className="rutas-stop-route-error">No se pudo calcular esta ruta.</span>
        )}

        {(ida || regreso) && (
          <span className="rutas-stop-legs">
            {ida && <span>Ida: {formatearDistancia(ida.distancia_m)} · {formatearDuracion(ida.duracion_seg)}</span>}
            {regreso && <span>Regreso: {formatearDistancia(regreso.distancia_m)} · {formatearDuracion(regreso.duracion_seg)}</span>}
          </span>
        )}
      </span>
    </button>
  );
}

function VisitaAcordeon({ visita, colorIndex, selected, selectedJornadaId, loading, rutas, onDibujar, onSeleccionarJornada }) {
  const [abierta, setAbierta] = useState(true);
  const jornadas = visita.jornadas || [];
  const totalDosis = jornadas.reduce((total, item) => total + Number(item.dosis_asignadas || 0), 0);
  const objetivo = jornadas.reduce((total, item) => total + Number(item.objetivo_dosis || 0), 0);
  const rutasVisita = selected ? rutas : [];
  const rutasCalculadas = rutasVisita.filter((item) => item.recorrido_estado === "calculado").length;

  return (
    <article className={`rutas-visit-accordion ${selected ? "active" : ""}`}>
      <button
        type="button"
        className="rutas-visit-head"
        onClick={() => setAbierta((actual) => !actual)}
        aria-expanded={abierta}
      >
        <span className="rutas-visit-index" style={{ "--route-color": colorIndex }}>
          <span className="material-symbols-rounded">event_note</span>
        </span>

        <span className="rutas-visit-head-text">
          <strong>{visita.codigo} · {visita.nombre}</strong>
          <small>{visita.localidad} · {jornadas.length} {jornadas.length === 1 ? "punto" : "puntos"} · {Number(totalDosis).toLocaleString("es-MX")} dosis</small>
        </span>

        <span className={`rutas-visit-status ${visita.estado || "planeada"}`}>
          {ESTADOS_VISITA[visita.estado] || visita.estado || "Planeada"}
        </span>

        <span className={`material-symbols-rounded rutas-accordion-chevron ${abierta ? "open" : ""}`}>
          expand_more
        </span>
      </button>

      {abierta && (
        <div className="rutas-visit-content">
          <div className="rutas-visit-summary">
            <span><small>Objetivo</small><strong>{Number(objetivo).toLocaleString("es-MX")}</strong></span>
            <span><small>Asignadas</small><strong>{Number(totalDosis).toLocaleString("es-MX")}</strong></span>
            <span><small>Paradas completas</small><strong>{jornadas.filter((j) => j.estado === "completada").length}/{jornadas.length}</strong></span>
          </div>

          <div className="rutas-progress-label">
            <strong>Secuencia de puntos</strong>
            <span>{jornadas.filter((j) => j.estado === "completada").length} de {jornadas.length} completados</span>
          </div>

          <div className="rutas-timeline">
            {jornadas.map((jornada, indice) => {
              const indiceRuta = rutasVisita.findIndex((item) => Number(item.jornada_id) === Number(jornada.id));
              const ruta = indiceRuta >= 0 ? rutasVisita[indiceRuta] : null;
              const activa = selected && Number(jornada.id) === Number(selectedJornadaId);
              const color = colorDeRuta(indiceRuta >= 0 ? indiceRuta : indice);
              return (
                <JornadaLinea
                  key={jornada.id}
                  jornada={jornada}
                  indice={indice}
                  ruta={ruta}
                  color={color}
                  seleccionada={Boolean(activa)}
                  onSeleccionar={() => onSeleccionarJornada(visita, jornada)}
                />
              );
            })}
          </div>

          <div className="rutas-visit-actions">
            <span className="rutas-calculation-state">
              {selected && rutasCalculadas > 0
                ? `${rutasCalculadas}/${jornadas.length} rutas calculadas`
                : "Recorridos por punto · ida y vuelta"}
            </span>
            <button
              type="button"
              className="rutas-draw-button"
              onClick={() => onDibujar(visita)}
              disabled={loading || jornadas.length === 0}
            >
              <span className="material-symbols-rounded">{loading ? "progress_activity" : "edit_road"}</span>
              {loading ? "Calculando..." : selected ? "Actualizar mapa" : "Dibujar recorrido"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export default function AcordeonCampanias({
  campanias,
  visitaSeleccionadaId,
  jornadaSeleccionadaId,
  rutasSeleccionadas,
  visitaEnCarga,
  onDibujar,
  onSeleccionarJornada,
}) {
  const [campaniasAbiertas, setCampaniasAbiertas] = useState(() => new Set());
  const [brigadasColapsadas, setBrigadasColapsadas] = useState(() => new Set());

  useEffect(() => {
    if (campanias.length > 0) {
      setCampaniasAbiertas((actual) => actual.size ? actual : new Set([campanias[0].id]));
    }
  }, [campanias]);

  const toggleCampania = (id) => {
    setCampaniasAbiertas((actual) => {
      const siguiente = new Set(actual);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  };

  const toggleBrigada = (id) => {
    setBrigadasColapsadas((actual) => {
      const siguiente = new Set(actual);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  };

  return (
    <div className="rutas-accordion-list">
      {campanias.map((campania, campaniaIndex) => {
        const abierta = campaniasAbiertas.has(campania.id);
        const cantidadVisitas = campania.brigadas.reduce((suma, brigada) => suma + brigada.visitas.length, 0);
        const cantidadJornadas = campania.brigadas.reduce((suma, brigada) =>
          suma + brigada.visitas.reduce((sub, visita) => sub + (visita.jornadas || []).length, 0), 0);

        return (
          <section className={`rutas-campaign-accordion ${abierta ? "expanded" : ""}`} key={campania.id}>
            <button
              type="button"
              className="rutas-campaign-head"
              onClick={() => toggleCampania(campania.id)}
              aria-expanded={abierta}
            >
              <IconoCampania categoria={campania.categoria} />
              <span className="rutas-campaign-head-text">
                <small>{campania.codigo} · CAMPAÑA</small>
                <strong>{campania.nombre}</strong>
                <span>{cantidadVisitas} visitas · {cantidadJornadas} puntos programados</span>
              </span>
              <span className="material-symbols-rounded rutas-accordion-chevron">
                {abierta ? "keyboard_arrow_up" : "keyboard_arrow_down"}
              </span>
            </button>

            {abierta && (
              <div className="rutas-campaign-content">
                {campania.brigadas.map((brigada, brigadaIndex) => {
                  const brigadeKey = `${campania.id}-${brigada.id}`;
                  const brigadeOpen = !brigadasColapsadas.has(brigadeKey);

                  return (
                    <section className="rutas-brigade-block" key={brigadeKey}>
                      <button
                        type="button"
                        className="rutas-brigade-head"
                        onClick={() => toggleBrigada(brigadeKey)}
                        aria-expanded={brigadeOpen}
                      >
                        <span className="material-symbols-rounded">groups</span>
                        <span>
                          <strong>{brigada.codigo} · {brigada.nombre}</strong>
                          <small>{brigada.visitas.length} {brigada.visitas.length === 1 ? "visita" : "visitas"}</small>
                        </span>
                        <i className={`rutas-brigade-state ${brigada.estado || ""}`} />
                        <span className="material-symbols-rounded rutas-accordion-chevron">
                          {brigadeOpen ? "expand_less" : "expand_more"}
                        </span>
                      </button>

                      {brigadeOpen && (
                        <div className="rutas-brigade-visits">
                          {brigada.visitas.map((visita) => (
                            <VisitaAcordeon
                              key={visita.id}
                              visita={visita}
                              colorIndex={campaniaIndex + brigadaIndex}
                              selected={Number(visita.id) === Number(visitaSeleccionadaId)}
                              selectedJornadaId={jornadaSeleccionadaId}
                              loading={Number(visita.id) === Number(visitaEnCarga)}
                              rutas={rutasSeleccionadas}
                              onDibujar={onDibujar}
                              onSeleccionarJornada={onSeleccionarJornada}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
