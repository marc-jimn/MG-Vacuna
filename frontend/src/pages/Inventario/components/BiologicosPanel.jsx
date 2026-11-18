import { useMemo, useState } from "react";
import { agruparPor, estadoConciliacion, formatearCantidad, formatearFecha, numero } from "../inventarioUtils";

const CardCampania = ({ campania, seleccionada, onClick }) => {
  const porcentaje = campania.dosis_asignadas > 0
    ? Math.min(100, (numero(campania.dosis_recibidas) / (numero(campania.dosis_asignadas) + numero(campania.stock_minimo))) * 100)
    : 0;
  const programada = numero(campania.dosis_programadas_recibir) > 0 && numero(campania.dosis_recibidas) === 0;
  return (
    <button type="button" className={`bio-campaign-card ${seleccionada ? "active" : ""}`} onClick={onClick}>
      <div className="bio-campaign-topline">
        <span className="bio-campaign-code">{campania.campania_codigo}</span>
        <span className={`bio-campaign-status ${programada ? "pending" : campania.bajo_stock_minimo ? "danger" : "ready"}`}>
          {programada ? "Recepción programada" : campania.bajo_stock_minimo ? "Reserva baja" : "En control"}
        </span>
      </div>
      <strong className="bio-campaign-name">{campania.campania_nombre}</strong>
      <div className="bio-campaign-biologic"><span className="material-symbols-rounded">vaccines</span>{campania.biologico_codigo} · {campania.biologico_nombre}</div>
      <div className="bio-campaign-progress"><span style={{ width: `${porcentaje}%` }} /></div>
      <div className="bio-campaign-foot">
        <span><b>{formatearCantidad(campania.dosis_recibidas)}</b> recibidas</span>
        <span>{formatearCantidad(campania.dosis_asignadas)} asignadas</span>
      </div>
    </button>
  );
};

function ModalMovimientos({ onClose, onSubmit, campaign, detail, lotes, modoInicial = "entrega_brigada", recepcionProgramada }) {
  const [modo, setModo] = useState(
    recepcionProgramada
      ? "confirmar"
      : modoInicial === "movimiento"
        ? "entrega_brigada"
        : modoInicial
  );
  const [form, setForm] = useState({
    lote_id: detail?.lotes?.find((l) => l.activo)?.id || "",
    cantidad: "", fecha_operacion: new Date().toLocaleDateString("en-CA"),
    persona_entrega: "", persona_recibe: "", observaciones: "",
    brigada_id: "", visita_id: "", visita_jornada_id: "",
    codigo_lote: "", fabricante: campaign?.fabricante || "", fecha_caducidad: "",
  });
  const [nuevoLote, setNuevoLote] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const filas = detail?.distribucion || [];
  const brigadas = useMemo(() => Object.values(agruparPor(filas, "brigada_id")).map((items) => items[0]).filter(Boolean), [filas]);
  const visitas = useMemo(() => Object.values(agruparPor(filas, "visita_id")).map((items) => items[0]).filter(Boolean), [filas]);
  const jornadas = useMemo(() => filas.filter((fila, index, array) => array.findIndex((x) => String(x.visita_jornada_id) === String(fila.visita_jornada_id)) === index), [filas]);
  const lotesCampania = (lotes || []).filter((l) => Number(l.campania_id) === Number(campaign?.campania_id));

  const tiposEntrega = [
    ["entrega_brigada", "Entrega de campaña a brigada"],
    ["entrega_visita", "Entrega de brigada a visita"],
    ["entrega_jornada", "Entrega de visita a jornada / punto"],
  ];
  const tiposCierre = [
    ["aplicacion", "Registrar dosis aplicadas"],
    ["devolucion_jornada", "Devolución de jornada"],
    ["devolucion_visita", "Devolución de visita"],
    ["devolucion_brigada", "Devolución de brigada"],
    ["devolucion_campania", "Devolución a campaña"],
    ["merma", "Registrar merma"],
    ["ajuste_entrada", "Ajuste positivo de campaña"],
    ["ajuste_salida", "Ajuste negativo de campaña"],
  ];
  const tipo = modo;
  const requiereBrigada = ["entrega_brigada", "devolucion_brigada"].includes(tipo);
  const requiereVisita = ["entrega_visita", "devolucion_visita"].includes(tipo);
  const requiereJornada = ["entrega_jornada", "aplicacion", "devolucion_jornada", "merma"].includes(tipo);
  const requiereObservacion = ["merma", "ajuste_entrada", "ajuste_salida"].includes(tipo);
  const cambio = (campo, valor) => setForm((actual) => ({ ...actual, [campo]: valor }));

  const enviar = async (event) => {
    event.preventDefault();
    setError("");
    setEnviando(true);
    try {
      let resultado;
      if (modo === "confirmar") {
        if (!recepcionProgramada?.id) throw new Error("No se encontró la recepción programada.");
        resultado = await onSubmit("confirmar", recepcionProgramada.id, {
          fecha_operacion: form.fecha_operacion,
          persona_recibe: form.persona_recibe,
          observaciones: form.observaciones,
        });
      } else if (modo === "recepcion") {
        const body = {
          cantidad: Number(form.cantidad), fecha_operacion: form.fecha_operacion,
          persona_recibe: form.persona_recibe, observaciones: form.observaciones,
        };
        if (nuevoLote) Object.assign(body, {
          campania_codigo: campaign.campania_codigo,
          biologico_codigo: campaign.biologico_codigo,
          codigo_lote: form.codigo_lote,
          fabricante: form.fabricante,
          fecha_caducidad: form.fecha_caducidad,
        });
        else body.lote_id = Number(form.lote_id);
        resultado = await onSubmit("recepcion", null, body);
      } else {
        const body = {
          lote_id: Number(form.lote_id), tipo_movimiento: modo,
          cantidad: Number(form.cantidad), fecha_operacion: form.fecha_operacion,
          persona_entrega: form.persona_entrega || undefined,
          persona_recibe: form.persona_recibe || undefined,
          observaciones: form.observaciones || undefined,
        };
        if (requiereBrigada) body.brigada_id = Number(form.brigada_id);
        if (requiereVisita) body.visita_id = Number(form.visita_id);
        if (requiereJornada) body.visita_jornada_id = Number(form.visita_jornada_id);
        resultado = await onSubmit("movimiento", null, body);
      }
      if (resultado !== false) onClose();
    } catch (submitError) {
      setError(submitError.message || "No fue posible registrar el movimiento.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="inv-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="inv-modal" role="dialog" aria-modal="true" aria-labelledby="bio-modal-title">
        <div className="inv-modal-head bio-modal-head">
          <div className="inv-modal-icon"><span className="material-symbols-rounded">vaccines</span></div>
          <div><span className="inv-eyebrow">{campaign?.campania_codigo} · {campaign?.biologico_codigo}</span><h2 id="bio-modal-title">{modo === "recepcion" ? "Registrar recepción" : modo === "confirmar" ? "Confirmar recepción física" : "Registrar movimiento de dosis"}</h2><p>{modo === "confirmar" ? "Confirma la llegada del lote y convierte las dosis programadas en existencia disponible." : "Cada movimiento quedará registrado en el historial y actualizará las existencias."}</p></div>
          <button type="button" className="inv-icon-button" onClick={onClose} aria-label="Cerrar"><span className="material-symbols-rounded">close</span></button>
        </div>
        <form onSubmit={enviar} className="inv-modal-body">
          {modo !== "confirmar" && <div className="inv-field"><label>Tipo de movimiento</label><select value={modo} onChange={(e) => setModo(e.target.value)}><optgroup label="Recepción"><option value="recepcion">Registrar recepción de dosis</option></optgroup><optgroup label="Distribución">{tiposEntrega.map(([v, t]) => <option value={v} key={v}>{t}</option>)}</optgroup><optgroup label="Aplicación y devolución">{tiposCierre.map(([v, t]) => <option value={v} key={v}>{t}</option>)}</optgroup></select></div>}
          {modo !== "recepcion" && modo !== "confirmar" && <div className="inv-form-note"><span className="material-symbols-rounded">account_tree</span><span>La distribución se registra en orden: campaña → brigada → visita → jornada. Selecciona el nivel que realizará el movimiento.</span></div>}
          {modo !== "confirmar" && <div className="inv-field"><label>Lote de biológico</label><select value={form.lote_id} onChange={(e) => cambio("lote_id", e.target.value)} required><option value="">Selecciona un lote</option>{lotesCampania.map((l) => <option value={l.id} key={l.id}>{l.codigo_lote} · {l.activo ? "Activo" : "Pendiente / inactivo"} · caduca {formatearFecha(l.fecha_caducidad)}</option>)}</select></div>}
          {modo === "recepcion" && <>
            <label className="inv-checkline"><input type="checkbox" checked={nuevoLote} onChange={(e) => setNuevoLote(e.target.checked)}/><span>La recepción corresponde a un lote nuevo</span></label>
            {nuevoLote ? <div className="inv-form-grid"><div className="inv-field"><label>Código de lote</label><input value={form.codigo_lote} onChange={(e) => cambio("codigo_lote", e.target.value)} required/></div><div className="inv-field"><label>Fabricante</label><input value={form.fabricante} onChange={(e) => cambio("fabricante", e.target.value)} required/></div><div className="inv-field"><label>Fecha de caducidad</label><input type="date" value={form.fecha_caducidad} onChange={(e) => cambio("fecha_caducidad", e.target.value)} required/></div></div> : null}
          </>}
          {modo !== "recepcion" && modo !== "confirmar" && requiereBrigada && <div className="inv-field"><label>Brigada responsable</label><select value={form.brigada_id} onChange={(e) => cambio("brigada_id", e.target.value)} required><option value="">Selecciona una brigada</option>{brigadas.map((b) => <option key={b.brigada_id} value={b.brigada_id}>{b.brigada_codigo} · {b.brigada_nombre}</option>)}</select></div>}
          {modo !== "recepcion" && modo !== "confirmar" && requiereVisita && <div className="inv-field"><label>Visita</label><select value={form.visita_id} onChange={(e) => cambio("visita_id", e.target.value)} required><option value="">Selecciona una visita</option>{visitas.map((v) => <option key={v.visita_id} value={v.visita_id}>{v.visita_codigo} · {v.visita_nombre}</option>)}</select></div>}
          {modo !== "recepcion" && modo !== "confirmar" && requiereJornada && <div className="inv-field"><label>Jornada / punto de vacunación</label><select value={form.visita_jornada_id} onChange={(e) => cambio("visita_jornada_id", e.target.value)} required><option value="">Selecciona un punto</option>{jornadas.map((j) => <option key={j.visita_jornada_id} value={j.visita_jornada_id}>{j.visita_codigo} · {j.punto_nombre} · {formatearFecha(j.fecha_inicio)}</option>)}</select></div>}
          {modo !== "confirmar" && <div className="inv-form-grid"><div className="inv-field"><label>{modo === "recepcion" ? "Dosis recibidas" : "Cantidad de dosis"}</label><input type="number" min="1" step="1" value={form.cantidad} onChange={(e) => cambio("cantidad", e.target.value)} required/></div><div className="inv-field"><label>Fecha de operación</label><input type="date" value={form.fecha_operacion} onChange={(e) => cambio("fecha_operacion", e.target.value)} required/></div></div>}
          {modo === "confirmar" && <div className="inv-field"><label>Fecha de recepción física</label><input type="date" value={form.fecha_operacion} onChange={(e) => cambio("fecha_operacion", e.target.value)} required/></div>}
          {modo === "confirmar" && <div className="inv-confirm-preview"><span className="material-symbols-rounded">inventory</span><div><small>Recepción programada</small><strong>{formatearCantidad(recepcionProgramada?.cantidad)} dosis</strong><span>{recepcionProgramada?.codigo_lote || campaign?.biologico_codigo} · {campaign?.campania_codigo}</span></div></div>}
          {modo !== "confirmar" && <div className="inv-form-grid"><div className="inv-field"><label>{modo === "recepcion" ? "Persona que recibe" : "Persona que entrega"}</label><input value={modo === "recepcion" ? form.persona_recibe : form.persona_entrega} onChange={(e) => cambio(modo === "recepcion" ? "persona_recibe" : "persona_entrega", e.target.value)} placeholder="Nombre de responsable"/></div>{modo !== "recepcion" && <div className="inv-field"><label>Persona que recibe</label><input value={form.persona_recibe} onChange={(e) => cambio("persona_recibe", e.target.value)} placeholder="Responsable receptor"/></div>}</div>}
          {modo === "confirmar" && <div className="inv-field"><label>Persona que recibe</label><input value={form.persona_recibe} onChange={(e) => cambio("persona_recibe", e.target.value)} placeholder="Nombre de responsable" required/></div>}
          <div className="inv-field"><label>Observaciones {requiereObservacion && <em>Obligatorias para este movimiento</em>}</label><textarea rows="3" value={form.observaciones} onChange={(e) => cambio("observaciones", e.target.value)} required={requiereObservacion} placeholder="Añade un detalle o referencia del comprobante…"/></div>
          {error && <div className="inv-form-error"><span className="material-symbols-rounded">error</span>{error}</div>}
          <div className="inv-modal-actions"><button type="button" className="inv-button light" onClick={onClose}>Cancelar</button><button type="submit" className="inv-button primary" disabled={enviando}>{enviando ? "Guardando…" : modo === "confirmar" ? "Confirmar recepción" : "Guardar movimiento"}<span className="material-symbols-rounded">{modo === "confirmar" ? "verified" : "arrow_forward"}</span></button></div>
        </form>
      </section>
    </div>
  );
}

export default function BiologicosPanel({
  campanias = [],
  seleccionada,
  detalle,
  movimientos = [],
  onSeleccionar,
  onAbrirModal,
  cargandoDetalle,
}) {
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [expandida, setExpandida] = useState({});
  const resumen = detalle?.resumen || seleccionada || {};
  const distribucion = detalle?.distribucion || [];
  const gruposBrigada = useMemo(() => agruparPor(distribucion, "brigada_codigo"), [distribucion]);
  const recepcionProgramada = movimientos.find((m) => m.tipo_movimiento === "recepcion_programada");
  const puntosConDiferencia = distribucion.filter((r) => numero(r.dosis_sin_justificar) > 0).length;

  return (
    <div className="bio-panel">
      <section className="bio-campaign-selector">
        <div className="inv-section-heading"><div><span className="inv-eyebrow">INVENTARIO DE BIOLÓGICOS</span><h2>Campañas con inventario configurado</h2><p>Se muestran las campañas con reserva o lote registrado. Dentro de cada campaña, las dosis se organizan por brigada, visita y punto de vacunación.</p></div><span className="inv-count-pill">{campanias.length} campañas</span></div>
        <div className="bio-campaign-grid">{campanias.map((campania) => <CardCampania key={campania.campania_id} campania={campania} seleccionada={Number(campania.campania_id) === Number(seleccionada?.campania_id)} onClick={() => onSeleccionar(campania)}/>)}</div>
      </section>

      {seleccionada && <>
        <section className="bio-detail-heading">
          <div><span className="inv-eyebrow">DETALLE DEL INVENTARIO · {resumen.campania_codigo}</span><h2>{resumen.campania_nombre}</h2><p>{resumen.biologico_codigo} · {resumen.biologico_nombre}</p></div>
          <div className="bio-detail-actions"><button type="button" className="inv-button light" onClick={() => onAbrirModal("movimiento")}><span className="material-symbols-rounded">swap_horiz</span> Registrar distribución</button><button type="button" className="inv-button primary" onClick={() => onAbrirModal("recepcion")}><span className="material-symbols-rounded">add_box</span> Registrar recepción</button></div>
        </section>

        <section className="bio-balance-grid">
          <article className="bio-balance-card received">
            <div className="bio-balance-head"><span className="bio-balance-icon"><span className="material-symbols-rounded">move_to_inbox</span></span><div><small>01 · ENTRADA</small><h3>Recepción a campaña</h3></div></div>
            <div className="bio-main-number">{formatearCantidad(resumen.dosis_recibidas)} <small>dosis</small></div>
            <div className="bio-balance-lines"><div><span>Dosis asignadas</span><b>{formatearCantidad(resumen.dosis_asignadas)}</b></div><div><span>Stock mínimo reservado</span><b>{formatearCantidad(resumen.stock_minimo)}</b></div><div><span>Recepción programada</span><b>{formatearCantidad(resumen.dosis_programadas_recibir)}</b></div><div><span>Faltantes para plan + reserva</span><b>{formatearCantidad(resumen.dosis_faltantes_para_plan_y_reserva)}</b></div></div>
            <div className="bio-balance-footer"><span>Plan + reserva</span><strong>{formatearCantidad(numero(resumen.dosis_asignadas) + numero(resumen.stock_minimo))}</strong></div>
          </article>

          <article className="bio-balance-card distributed">
            <div className="bio-balance-head"><span className="bio-balance-icon"><span className="material-symbols-rounded">account_tree</span></span><div><small>02 · DISTRIBUCIÓN</small><h3>Dosis en recorrido</h3></div></div>
            <div className="bio-main-number">{formatearCantidad(resumen.entregadas_a_brigadas)} <small>a brigadas</small></div>
            <div className="bio-balance-lines"><div><span>Entregadas a visitas</span><b>{formatearCantidad(resumen.entregadas_a_visitas)}</b></div><div><span>Entregadas a jornadas</span><b>{formatearCantidad(resumen.entregadas_a_jornadas)}</b></div><div><span>Objetivo de vacunación</span><b>{formatearCantidad(resumen.objetivo_vacunacion)}</b></div></div>
            <div className="bio-balance-footer"><span>Dosis aplicadas</span><strong>{formatearCantidad(resumen.dosis_aplicadas)}</strong></div>
          </article>

          <article className="bio-balance-card returned">
            <div className="bio-balance-head"><span className="bio-balance-icon"><span className="material-symbols-rounded">keyboard_return</span></span><div><small>03 · RETORNO Y CONTROL</small><h3>Conciliación de dosis</h3></div></div>
            <div className="bio-main-number">{formatearCantidad(resumen.existencia_en_campania)} <small>en campaña</small></div>
            <div className="bio-balance-lines"><div><span>Devueltas por jornadas</span><b>{formatearCantidad(resumen.devueltas_por_jornadas)}</b></div><div><span>Devueltas por visitas</span><b>{formatearCantidad(resumen.devueltas_por_visitas)}</b></div><div><span>Devueltas por brigadas</span><b>{formatearCantidad(resumen.devueltas_por_brigadas)}</b></div><div><span>Merma registrada</span><b>{formatearCantidad(resumen.dosis_merma)}</b></div></div>
            <div className={`bio-balance-footer ${numero(resumen.dosis_sin_justificar) > 0 ? "danger" : ""}`}><span>{numero(resumen.dosis_sin_justificar) > 0 ? "Dosis sin justificar" : "Dosis sin justificar"}</span><strong>{formatearCantidad(resumen.dosis_sin_justificar)}</strong></div>
          </article>
        </section>
        <div className="bio-return-note"><span className="material-symbols-rounded">info</span>Las devoluciones por jornada, visita y brigada se muestran por separado: pueden corresponder a las mismas dosis durante su recorrido de regreso y no deben sumarse entre sí.</div>

        {recepcionProgramada && <div className="bio-scheduled-receipt"><div className="bio-scheduled-icon"><span className="material-symbols-rounded">event_available</span></div><div><strong>Recepción pendiente de confirmación</strong><span>{formatearCantidad(recepcionProgramada.cantidad)} dosis programadas · {formatearFecha(recepcionProgramada.fecha_operacion)} · {recepcionProgramada.codigo_lote || "Lote pendiente"}</span></div><button type="button" className="inv-button primary small" onClick={() => onAbrirModal("confirmar", recepcionProgramada)}>Confirmar recepción</button></div>}

        <section className="bio-distribution-section">
          <div className="inv-section-heading"><div><span className="inv-eyebrow">TRAZABILIDAD JERÁRQUICA</span><h2>Distribución por brigada, visita y punto</h2><p>Las asignaciones muestran el plan; las entregas y devoluciones se alimentan del kardex.</p></div><span className="inv-count-pill">{distribucion.length} jornadas</span></div>
          {cargandoDetalle ? <div className="inv-loading"><span className="inv-spinner"/>Consultando el detalle de la campaña…</div> : distribucion.length === 0 ? <div className="inv-empty"><span className="material-symbols-rounded">account_tree</span><strong>Sin jornadas vinculadas</strong><span>Esta campaña todavía no tiene jornadas para mostrar.</span></div> : <div className="bio-brigade-list">{Object.entries(gruposBrigada).map(([brigada, filas]) => {
            const primera = filas[0];
            const abiertas = expandida[brigada] !== false;
            const plan = filas.reduce((sum, r) => sum + numero(r.dosis_asignadas), 0);
            const entregadas = filas.reduce((sum, r) => sum + numero(r.dosis_entregadas), 0);
            return <article className="bio-brigade-card" key={brigada}>
              <button type="button" className="bio-brigade-toggle" onClick={() => setExpandida((s) => ({ ...s, [brigada]: !abiertas }))}>
                <span className="bio-brigade-symbol material-symbols-rounded">groups</span><span className="bio-brigade-title"><strong>{brigada} · {primera.brigada_nombre}</strong><small>{filas.length} jornadas · {primera.brigada_estado || "Sin estado"}</small></span><span className="bio-brigade-total"><b>{formatearCantidad(plan)}</b><small>asignadas</small></span><span className="bio-brigade-total secondary"><b>{formatearCantidad(entregadas)}</b><small>entregadas a puntos</small></span><span className="material-symbols-rounded bio-expand-icon">{abiertas ? "expand_less" : "expand_more"}</span>
              </button>
              {abiertas && <div className="bio-journey-table-wrap"><table className="bio-journey-table"><thead><tr><th>Visita / punto</th><th>Periodo</th><th>Asignadas</th><th>Entregadas</th><th>Aplicadas</th><th>Devueltas</th><th>Diferencia</th><th>Estado</th></tr></thead><tbody>{filas.map((r) => {
                const estado = estadoConciliacion(r.estado_conciliacion);
                return <tr key={r.visita_jornada_id}><td><strong>{r.visita_codigo}</strong><span>{r.punto_nombre}</span></td><td>{formatearFecha(r.fecha_inicio)}{r.fecha_fin && r.fecha_fin !== r.fecha_inicio ? ` – ${formatearFecha(r.fecha_fin)}` : ""}<small>{String(r.hora_inicio || "").slice(0,5)} – {String(r.hora_fin || "").slice(0,5)}</small></td><td>{formatearCantidad(r.dosis_asignadas)}</td><td>{formatearCantidad(r.dosis_entregadas)}</td><td>{formatearCantidad(r.dosis_aplicadas)}</td><td>{formatearCantidad(r.dosis_devueltas)}</td><td className={numero(r.dosis_sin_justificar) > 0 ? "bio-number-danger" : ""}>{formatearCantidad(r.dosis_sin_justificar)}</td><td><span className={`bio-reconcile-pill ${estado.clase}`}><span className="material-symbols-rounded">{estado.icono}</span>{estado.etiqueta}</span></td></tr>;
              })}</tbody></table></div>}
            </article>;
          })}</div>}
          {puntosConDiferencia > 0 && <div className="bio-alert-inline"><span className="material-symbols-rounded">report</span><div><strong>Hay jornadas que requieren aclaración</strong><span>{puntosConDiferencia} punto(s) registran dosis pendientes de justificar. Consulta el detalle antes de cerrar la conciliación.</span></div></div>}
        </section>

        <section className="bio-bottom-grid">
          <article className="inv-white-card bio-lot-card">
            <div className="inv-card-heading">
              <div>
                <span className="inv-eyebrow">CONTROL DE CADUCIDAD</span>
                <h3>Lotes de biológico</h3>
              </div>
              <span className="material-symbols-rounded">qr_code_2</span>
            </div>

            {(detalle?.lotes || []).map((lote) => (
              <div className="bio-lot-row" key={lote.id}>
                <span
                  className={`bio-lot-dot ${
                    lote.activo ? "active" : "pending"
                  }`}
                />

                <div>
                  <strong>{lote.codigo_lote}</strong>
                  <small>{lote.fabricante}</small>
                </div>

                <div className="bio-lot-expiry">
                  <small>Caducidad</small>
                  <b>{formatearFecha(lote.fecha_caducidad)}</b>
                </div>

                <span
                  className={`bio-lot-status ${
                    lote.activo ? "active" : "pending"
                  }`}
                >
                  {lote.activo ? "Activo" : "Pendiente"}
                </span>
              </div>
            ))}
          </article>

          <article className="inv-white-card bio-history-card">
            <div className="inv-card-heading">
              <div>
                <span className="inv-eyebrow">KARDEX</span>
                <h3>Movimientos recientes</h3>
              </div>

              <button
                type="button"
                className="inv-text-button"
                onClick={() => setMostrarHistorial(!mostrarHistorial)}
              >
                <span className="button-text">
                  {mostrarHistorial
                    ? "Ocultar historial completo"
                    : "Ver historial completo"}
                </span>

                <span className="material-symbols-rounded">
                  {mostrarHistorial ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                </span>
              </button>
            </div>

            <div className="bio-history-list">
              {(mostrarHistorial
                ? movimientos
                : movimientos.slice(0, 4)
              ).map((m) => (
                <div className="bio-history-row" key={m.id}>
                  <span
                    className={`bio-history-icon ${
                      String(m.tipo_movimiento).startsWith("devolucion")
                        ? "return"
                        : m.tipo_movimiento === "aplicacion"
                          ? "apply"
                          : "entry"
                    }`}
                  >
                    <span className="material-symbols-rounded">
                      {m.tipo_movimiento === "aplicacion"
                        ? "vaccines"
                        : String(m.tipo_movimiento).startsWith("devolucion")
                          ? "keyboard_return"
                          : "swap_horiz"}
                    </span>
                  </span>

                  <div>
                    <strong>
                      {m.tipo_movimiento?.replaceAll("_", " ")}
                    </strong>
                    <small>
                      {m.punto_nombre ||
                        m.brigada_codigo ||
                        m.visita_codigo ||
                        m.campania_codigo}
                      {" · "}
                      {formatearFecha(m.fecha_operacion)}
                    </small>
                  </div>

                  <b>{formatearCantidad(m.cantidad)}</b>
                </div>
              ))}

              {movimientos.length === 0 && (
                <div className="inv-empty compact">
                  Todavía no hay movimientos para esta campaña.
                </div>
              )}
            </div>
          </article>
        </section>
      </>}
    </div>
  );
}

export { ModalMovimientos };