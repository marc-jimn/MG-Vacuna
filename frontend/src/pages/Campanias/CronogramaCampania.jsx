import "./CronogramaCampania.css";

const etapas = [
  {
    numero: "01",
    titulo: "Preparación y organización",
    subtitulo: "Planificación inicial de la campaña",
    icono: "event_note",
    color: "preparacion",
    actividades: [
      {
        icono: "inventory_2",
        nombre: "Recepción y verificación de biológicos y materiales",
        fecha: "14 OCT 2026",
        horario: "08:00 – 12:00",
        descripcion:
          "Recepción de vacunas e insumos, revisión de lotes, caducidades y condiciones de conservación.",
        personal: "Coordinador de campaña",
      },
      {
        icono: "calendar_month",
        nombre: "Planeación y distribución de actividades",
        fecha: "14 OCT 2026",
        horario: "13:00 – 15:00",
        descripcion:
          "Organización de jornadas, distribución de dosis, asignación de puntos y definición de metas.",
        personal: "Responsable de brigada",
      },
      {
        icono: "groups",
        nombre: "Capacitación y coordinación operativa",
        fecha: "15 OCT 2026",
        horario: "08:00 – 13:00",
        descripcion:
          "Capacitación del personal sobre procedimientos y coordinación de las actividades de vacunación.",
        personal: "Responsable de brigada",
      },
    ],
  },
  {
    numero: "02",
    titulo: "Ejecución – Visita 1",
    subtitulo: "Brigada VPH Esperanza · Copoya",
    icono: "medical_services",
    color: "copoya",
    actividades: [
      {
        icono: "local_shipping",
        nombre: "Preparación y traslado de la brigada",
        fecha: "19 OCT 2026",
        horario: "07:00 – 08:00",
        descripcion:
          "Traslado del personal, vacunas y materiales, además del acondicionamiento del área de atención.",
        personal: "Conductor",
      },
      {
        icono: "vaccines",
        nombre: "Jornadas de vacunación en Copoya",
        fecha: "19 OCT – 13 NOV 2026",
        horario: "Según horario de cada punto",
        descripcion:
          "Vacunación contra el VPH en los puntos establecidos de Copoya.",
        personal: "Médico y Enfermeros",
        meta: "945 personas",
        destacado: true,
      },
      {
        icono: "assessment",
        nombre: "Concentración y reporte de resultados",
        fecha: "13 NOV 2026",
        horario: "14:00 – 15:30",
        descripcion:
          "Consolidación de registros, conciliación de dosis y elaboración del reporte de actividades.",
        personal: "Responsable de brigada",
      },
    ],
    lugares: [
      "Centro de Salud Copoya",
      "Primaria Lázaro Cárdenas",
      "Plaza Comunitaria IDH Copoya",
      "Domo de la cancha de básquetbol",
    ],
  },
  {
    numero: "03",
    titulo: "Ejecución – Visita 2",
    subtitulo: "Brigada Juvenil Saludable · El Jobo",
    icono: "health_and_safety",
    color: "jobo",
    actividades: [
      {
        icono: "local_shipping",
        nombre: "Preparación y traslado de la brigada",
        fecha: "16 NOV 2026",
        horario: "07:00 – 08:00",
        descripcion:
          "Traslado del personal, vacunas y materiales al Centro de Salud El Jobo y acondicionamiento del área.",
        personal: "Conductor",
      },
      {
        icono: "vaccines",
        nombre: "Jornadas de vacunación en El Jobo",
        fecha: "16 NOV – 04 DIC 2026",
        horario: "Según horario de cada punto",
        descripcion:
          "Vacunación contra el VPH en los centros educativos y de salud establecidos en El Jobo.",
        personal: "Médico y Enfermeros",
        meta: "555 personas",
        destacado: true,
      },
      {
        icono: "assessment",
        nombre: "Concentración y reporte de resultados",
        fecha: "04 DIC 2026",
        horario: "14:00 – 15:30",
        descripcion:
          "Integración de registros, revisión de existencias y elaboración del reporte de actividades.",
        personal: "Responsable de brigada",
      },
    ],
    lugares: [
      "Centro de Salud El Jobo",
      "Primaria Francisco Sarabia",
      "Secundaria Moisés Sáenz Garza",
    ],
  },
  {
    numero: "04",
    titulo: "Seguimiento y cierre",
    subtitulo: "Evaluación y conclusión de la campaña",
    icono: "task_alt",
    color: "cierre",
    actividades: [
      {
        icono: "person_search",
        nombre: "Seguimiento y recuperación de personas pendientes",
        fecha: "07 – 09 DIC 2026",
        horario: "08:00 – 13:00",
        descripcion:
          "Identificación de personas pendientes y organización de jornadas de recuperación.",
        personal: "Responsable de brigada",
      },
      {
        icono: "analytics",
        nombre: "Consolidación y evaluación de resultados",
        fecha: "10 DIC 2026",
        horario: "08:00 – 15:00",
        descripcion:
          "Análisis de resultados de ambas brigadas, cumplimiento de metas y elaboración del informe final.",
        personal: "Encargado de Inventario",
      },
      {
        icono: "inventory",
        nombre: "Entrega de materiales y cierre administrativo",
        fecha: "11 DIC 2026",
        horario: "08:00 – 14:00",
        descripcion:
          "Devolución de materiales, resguardo de documentos y entrega del informe final.",
        personal: "Encargado de Inventario",
      },
    ],
  },
];

function Actividad({ actividad, indice }) {
  return (
    <div className="crono-actividad">
      <div className="crono-linea-punto">
        <span className="material-symbols-rounded">
          {actividad.icono}
        </span>
      </div>

      <article
        className={`crono-card ${
          actividad.destacado ? "crono-card-destacado" : ""
        }`}
      >
        <div className="crono-card-top">
          <span className="crono-actividad-numero">
            ACTIVIDAD {String(indice + 1).padStart(2, "0")}
          </span>

          <span className="crono-fecha">
            <span className="material-symbols-rounded">
              calendar_today
            </span>
            {actividad.fecha}
          </span>
        </div>

        <h4>{actividad.nombre}</h4>

        <div className="crono-horario">
          <span className="material-symbols-rounded">
            schedule
          </span>
          {actividad.horario}
        </div>

        <p className="crono-descripcion">
          {actividad.descripcion}
        </p>

        {actividad.lugares && (
          <div className="crono-lugares">
            <span className="material-symbols-rounded">
              location_on
            </span>

            <div>
              {actividad.lugares.map((lugar, i) => (
                <span key={i}>{lugar}</span>
              ))}
            </div>
          </div>
        )}

        {actividad.meta && (
          <div className="crono-meta">
            <span className="material-symbols-rounded">
              groups
            </span>
            <span>Meta programada</span>
            <strong>{actividad.meta}</strong>
          </div>
        )}

        <div className="crono-responsable">
          <span className="material-symbols-rounded">
            badge
          </span>

          <div>
            <small>PERSONAL RESPONSABLE</small>
            <strong>{actividad.personal}</strong>
          </div>
        </div>
      </article>
    </div>
  );
}

export default function CronogramaCampania() {
  return (
    <section className="crono-container">
      <header className="crono-header">
        <div className="crono-header-icon">
          <span className="material-symbols-rounded">
            event_upcoming
          </span>
        </div>

        <div>
          <span className="crono-eyebrow">
            PLANIFICACIÓN OPERATIVA · 2026
          </span>

          <h2>Cronograma de actividades</h2>

          <p>
            Organización y desarrollo de las jornadas de vacunación
            contra el Virus del Papiloma Humano (VPH).
          </p>
        </div>
      </header>

      <div className="crono-resumen">
        <div>
          <span className="material-symbols-rounded">event</span>
          <div>
            <small>Periodo</small>
            <strong>14 OCT – 11 DIC</strong>
          </div>
        </div>

        <div>
          <span className="material-symbols-rounded">layers</span>
          <div>
            <small>Etapas</small>
            <strong>04 etapas</strong>
          </div>
        </div>

        <div>
          <span className="material-symbols-rounded">groups</span>
          <div>
            <small>Meta total</small>
            <strong>1,500 personas</strong>
          </div>
        </div>
      </div>

      <div className="crono-etapas">
        {etapas.map((etapa) => (
          <section
            key={etapa.numero}
            className={`crono-etapa ${etapa.color}`}
          >
            <div className="crono-etapa-header">
              <div className="crono-etapa-icon">
                <span className="material-symbols-rounded">
                  {etapa.icono}
                </span>
              </div>

              <div className="crono-etapa-info">
                <span>ETAPA {etapa.numero}</span>
                <h3>{etapa.titulo}</h3>
                <p>{etapa.subtitulo}</p>
              </div>

              <div className="crono-etapa-badge">
                {etapa.actividades.length} actividades
              </div>
            </div>

            <div className="crono-timeline">
              {etapa.actividades.map((actividad, indice) => (
                <Actividad
                  key={indice}
                  actividad={actividad}
                  indice={indice}
                />
              ))}
            </div>

            {etapa.lugares && (
              <div className="crono-zonas">
                <span className="material-symbols-rounded">
                  map
                </span>
                <div>
                  <strong>Puntos de vacunación</strong>
                  <div className="crono-zonas-lista">
                    {etapa.lugares.map((lugar, i) => (
                      <span key={i}>{lugar}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      <footer className="crono-footer">
        <span className="material-symbols-rounded">
          verified
        </span>
        <p>
          Cronograma operativo de la campaña de vacunación VPH · 2026
        </p>
      </footer>
    </section>
  );
}