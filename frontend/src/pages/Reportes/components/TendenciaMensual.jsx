import { cantidad, numero } from "../reportesUtils";

export default function TendenciaMensual({ datos = [] }) {
  const maximo = Math.max(1, ...datos.map((item) => Math.max(numero(item.objetivo_vacunacion), numero(item.dosis_aplicadas))));
  return (
    <section className="rep-card rep-trend-card">
      <div className="rep-card-heading"><div><span className="rep-eyebrow">EVOLUCIÓN DEL PERIODO</span><h2>Actividad mensual</h2><p>Objetivo programado frente a dosis aplicadas, agrupado por mes de inicio de jornada.</p></div><span className="material-symbols-rounded rep-card-icon">monitoring</span></div>
      <div className="rep-chart-legend"><span><i className="legend-target"/> Objetivo</span><span><i className="legend-applied"/> Aplicadas</span></div>
      {datos.length === 0 ? <div className="rep-empty">No hay actividad para el periodo seleccionado.</div> : (
        <div className="rep-month-chart">
          {datos.map((item) => {
            const objetivo = numero(item.objetivo_vacunacion);
            const aplicadas = numero(item.dosis_aplicadas);
            return <div className="rep-month-column" key={item.periodo}>
              <div className="rep-month-values"><strong>{cantidad(aplicadas)}</strong><small>/ {cantidad(objetivo)}</small></div>
              <div className="rep-bars-area">
                <div className="rep-month-bar target" style={{ height: `${Math.max(4, (objetivo / maximo) * 100)}%` }} />
                <div className="rep-month-bar applied" style={{ height: `${Math.max(aplicadas ? 4 : 0, (aplicadas / maximo) * 100)}%` }} />
              </div>
              <span className="rep-month-label">{item.etiqueta}</span>
            </div>;
          })}
        </div>
      )}
      <div className="rep-chart-footnote">Las dosis aplicadas se toman de los movimientos registrados en el periodo; el objetivo proviene de las jornadas incluidas.</div>
    </section>
  );
}
