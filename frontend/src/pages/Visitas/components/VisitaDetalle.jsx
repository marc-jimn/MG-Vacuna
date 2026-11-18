import {
  formatoNumero,
  formatearHora,
  formatearRango,
  nombresEstados,
  nombresEstadosJornada,
} from "../visitaUtils";

function IconoCampania({ visita, grande = false }) {
  const veterinaria = visita.campania_categoria === "veterinaria";
  return (
    <div className={`vis-campaign-icon ${veterinaria ? "veterinaria" : "humana"} ${grande ? "large" : ""}`}>
      <span className="material-symbols-rounded">{veterinaria ? "pets" : "vaccines"}</span>
    </div>
  );
}

function Estado({ estado }) {
  return (
    <span className={`vis-status ${estado || "planeada"}`}>
      <i />{nombresEstados[estado] || estado || "Planeada"}
    </span>
  );
}

export default function VisitaDetalle({
  visita,
  jornadaSeleccionadaId,
  onAgregarJornada,
  onEditarVisita,
  onEditarJornada,
  onEliminarJornada,
  onCancelar,
  procesando,
  alturaCalendario,
}) {
  if (!visita) {
    return (
      <aside className="vis-detail-panel vis-detail-empty">
        <div className="vis-empty-art">
          <span className="material-symbols-rounded">event_note</span>
          <i /><i />
        </div>
        <span className="vis-detail-eyebrow">AGENDA DE VACUNACIÓN</span>
        <h3>Selecciona una visita</h3>
        <p>Haz clic sobre una barra del calendario para consultar campaña, brigada, localidad, puntos y programación.</p>
      </aside>
    );
  }

  const jornadas = visita.jornadas || [];
  const biologicos = visita.biologicos || [];

    return (
      <aside
        className="vis-detail-panel"
        style={{
          "--vis-detail-height": alturaCalendario
            ? `${alturaCalendario}px`
            : "auto",
        }}
      >
      <div className="vis-detail-topline">
        <span className="vis-detail-eyebrow">FICHA DE PROGRAMACIÓN</span>
        <Estado estado={visita.estado} />
      </div>

      <div className="vis-detail-campaign">
        <IconoCampania visita={visita} grande />
        <div>
          <span>{visita.campania_codigo}</span>
          <strong>{visita.campania_nombre}</strong>
          <small>{biologicos.map((bio) => bio.nombre_corto || bio.nombre).filter(Boolean).join(" · ") || "Biológico no especificado"}</small>
        </div>
      </div>

      <div className="vis-detail-heading">
        <span>{visita.codigo}</span>
        <h2>{visita.nombre}</h2>
        <p>{visita.localidad} · {visita.brigada_codigo}</p>
      </div>

      <div className="vis-detail-actions">
        <button
          type="button"
          className="vis-detail-action"
          onClick={() => onAgregarJornada(visita)}
          disabled={procesando || ["completada", "cancelada"].includes(visita.estado)}
        >
          <span className="material-symbols-rounded">add</span> Agregar punto / jornada
        </button>
        <button
          type="button"
          className="vis-detail-icon-button"
          title="Editar visita"
          onClick={() => onEditarVisita(visita)}
          disabled={procesando || ["completada", "cancelada"].includes(visita.estado)}
        >
          <span className="material-symbols-rounded">edit</span>
        </button>
      </div>

      <div className="vis-detail-metrics">
        <div className="assigned">
          <span className="material-symbols-rounded">vaccines</span>
          <small>Dosis asignadas</small>
          <strong>{formatoNumero(visita.dosis_asignadas)}</strong>
        </div>
        <div className="objective">
          <span className="material-symbols-rounded">flag</span>
          <small>Objetivo total</small>
          <strong>{formatoNumero(visita.objetivo_dosis)}</strong>
        </div>
      </div>

      <section className="vis-detail-section">
        <div className="vis-detail-section-title">
          <span className="material-symbols-rounded">campaign</span>
          <h3>Información de la brigada</h3>
        </div>
        <div className="vis-info-grid">
          <div><small>Brigada</small><strong>{visita.brigada_codigo}</strong><span>{visita.brigada_nombre}</span></div>
          <div><small>Localidad</small><strong>{visita.localidad}</strong><span>{visita.localidad_codigo}</span></div>
          <div><small>Campaña</small><strong>{visita.campania_codigo}</strong><span>{visita.campania_categoria === "veterinaria" ? "Veterinaria" : "Humana"}</span></div>
          <div><small>Puntos programados</small><strong>{jornadas.length}</strong><span>Jornadas de vacunación</span></div>
        </div>
      </section>

      <section className="vis-detail-section">
        <div className="vis-detail-section-title">
          <span className="material-symbols-rounded">event_available</span>
          <h3>Programación de puntos</h3>
          <span className="vis-detail-count">{jornadas.length}</span>
        </div>

        <div className="vis-jornada-list">
          {jornadas.map((jornada, indice) => (
            <article
              key={jornada.id}
              className={`vis-jornada-card ${Number(jornada.id) === Number(jornadaSeleccionadaId) ? "highlighted" : ""}`}
            >
              <div className="vis-jornada-number">{String(indice + 1).padStart(2, "0")}</div>
              <div className="vis-jornada-content">
                <div className="vis-jornada-heading">
                  <strong>{jornada.punto_vacunacion}</strong>
                  <span className={`vis-jornada-status ${jornada.estado}`}>
                    {nombresEstadosJornada[jornada.estado] || jornada.estado}
                  </span>
                </div>
                <div className="vis-jornada-date">
                  <span className="material-symbols-rounded">calendar_month</span>
                  {formatearRango(jornada.fecha_inicio, jornada.fecha_fin)}
                </div>
                <div className="vis-jornada-meta">
                  <span><span className="material-symbols-rounded">schedule</span>{formatearHora(jornada.hora_inicio)}–{formatearHora(jornada.hora_fin)}</span>
                  <span><span className="material-symbols-rounded">vaccines</span>{formatoNumero(jornada.dosis_asignadas)} dosis</span>
                </div>
                {jornada.direccion && (
                  <div className="vis-jornada-address"><span className="material-symbols-rounded">location_on</span>{jornada.direccion}</div>
                )}
                {jornada.referencia && <p className="vis-jornada-reference">{jornada.referencia}</p>}
                <div className="vis-jornada-actions">
                  <button type="button" onClick={() => onEditarJornada(visita, jornada)} disabled={procesando || ["completada", "cancelada"].includes(visita.estado)}>
                    <span className="material-symbols-rounded">edit</span>Editar
                  </button>
                  <button type="button" className="danger" onClick={() => onEliminarJornada(visita, jornada)} disabled={procesando || ["completada", "cancelada"].includes(visita.estado)}>
                    <span className="material-symbols-rounded">delete</span>Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {visita.observaciones && (
        <div className="vis-detail-observations">
          <span className="material-symbols-rounded">sticky_note_2</span>
          <div><strong>Observaciones</strong><p>{visita.observaciones}</p></div>
        </div>
      )}

      {visita.estado !== "cancelada" && visita.estado !== "completada" && (
        <button type="button" className="vis-cancel-button" onClick={() => onCancelar(visita)} disabled={procesando}>
          <span className="material-symbols-rounded">event_busy</span>Cancelar esta visita
        </button>
      )}
    </aside>
  );
}
