import { cantidad, etiquetaCategoria, numero, porcentaje } from "../reportesUtils";

export default function DesempenoCampanias({ datos = [] }) {
  return (
    <section className="rep-card">
      <div className="rep-card-heading"><div><span className="rep-eyebrow">COMPARATIVO PROGRAMÁTICO</span><h2>Desempeño por campaña</h2><p>Distribución y avance de dosis respecto al objetivo registrado.</p></div><span className="material-symbols-rounded rep-card-icon">campaign</span></div>
      {datos.length === 0 ? <div className="rep-empty">No hay campañas con jornadas dentro del periodo.</div> : (
        <div className="rep-table-wrap"><table className="rep-table"><thead><tr><th>Campaña</th><th>Jornadas</th><th>Asignadas</th><th>Objetivo</th><th>Aplicadas</th><th>Cumplimiento</th></tr></thead><tbody>
          {datos.map((item) => <tr key={item.campania_id}>
            <td><div className="rep-name-cell"><strong>{item.campania_codigo}</strong><span>{item.campania_nombre}</span><small>{etiquetaCategoria(item.campania_categoria)}</small></div></td>
            <td>{cantidad(item.jornadas)}</td><td>{cantidad(item.dosis_asignadas)}</td><td>{cantidad(item.objetivo_vacunacion)}</td><td className="rep-number-strong">{cantidad(item.dosis_aplicadas)}</td>
            <td><div className="rep-progress-cell"><div className="rep-progress-track"><span style={{ width: `${Math.min(100, numero(item.cumplimiento_objetivo))}%` }}/></div><b>{porcentaje(item.cumplimiento_objetivo)}</b></div></td>
          </tr>)}
        </tbody></table></div>
      )}
    </section>
  );
}
