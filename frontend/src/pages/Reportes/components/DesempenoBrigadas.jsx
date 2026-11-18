import { cantidad, estadoBrigada, numero, porcentaje } from "../reportesUtils";

export default function DesempenoBrigadas({ datos = [] }) {
  return (
    <section className="rep-card">
      <div className="rep-card-heading"><div><span className="rep-eyebrow">EJECUCIÓN EN CAMPO</span><h2>Rendimiento de brigadas</h2><p>Jornadas atendidas, volumen asignado y aplicaciones registradas.</p></div><span className="material-symbols-rounded rep-card-icon">groups</span></div>
      {datos.length === 0 ? <div className="rep-empty">No hay brigadas con actividad en el periodo.</div> : (
        <div className="rep-table-wrap"><table className="rep-table rep-brigade-table"><thead><tr><th>Brigada</th><th>Campaña</th><th>Visitas</th><th>Jornadas</th><th>Asignadas</th><th>Aplicadas</th><th>Avance</th></tr></thead><tbody>
          {datos.map((item) => <tr key={item.brigada_id}><td><div className="rep-name-cell"><strong>{item.brigada_codigo}</strong><span>{item.brigada_nombre}</span><small>{estadoBrigada(item.brigada_estado)}</small></div></td><td><span className="rep-campaign-ref">{item.campania_codigo}</span></td><td>{cantidad(item.visitas)}</td><td>{cantidad(item.jornadas)}</td><td>{cantidad(item.dosis_asignadas)}</td><td className="rep-number-strong">{cantidad(item.dosis_aplicadas)}</td><td><span className="rep-percent-pill">{porcentaje(item.cumplimiento_objetivo)}</span></td></tr>)}
        </tbody></table></div>
      )}
    </section>
  );
}
