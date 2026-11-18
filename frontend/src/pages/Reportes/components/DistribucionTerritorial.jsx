import { cantidad, numero, porcentaje } from "../reportesUtils";

export default function DistribucionTerritorial({ datos = [] }) {
  const maximo = Math.max(1, ...datos.map((item) => numero(item.dosis_aplicadas)));
  return (
    <section className="rep-card">
      <div className="rep-card-heading"><div><span className="rep-eyebrow">COBERTURA TERRITORIAL</span><h2>Actividad por localidad</h2><p>Comparativo de dosis aplicadas y avance frente al objetivo.</p></div><span className="material-symbols-rounded rep-card-icon">location_on</span></div>
      {datos.length === 0 ? <div className="rep-empty">No hay localidades con jornadas en el periodo.</div> : (
        <div className="rep-locality-list">
          {datos.map((item) => <div className="rep-locality-row" key={item.localidad_id}>
            <div className="rep-locality-heading"><div><strong>{item.localidad_nombre}</strong><small>{item.localidad_codigo} · {cantidad(item.visitas)} visitas · {cantidad(item.jornadas)} jornadas</small></div><b>{cantidad(item.dosis_aplicadas)} <small>dosis</small></b></div>
            <div className="rep-locality-track"><span style={{ width: `${Math.min(100, (numero(item.dosis_aplicadas) / maximo) * 100)}%` }}/></div>
            <div className="rep-locality-foot"><span>Objetivo {cantidad(item.objetivo_vacunacion)}</span><strong>{porcentaje(item.cumplimiento_objetivo)} del objetivo</strong></div>
          </div>)}
        </div>
      )}
    </section>
  );
}
