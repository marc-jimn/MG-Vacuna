import { useEffect, useMemo, useState } from "react";
import { codigoSiguiente, formatearHora, jornadaVacia, obtenerDatos, obtenerMensajeError } from "../visitaUtils";

function JornadaCampos({ jornada, onChange, puntos, localidadId, disabled = false }) {
  const puntosLocalidad = puntos.filter((punto) => Number(punto.localidad_id) === Number(localidadId));
  const cambiar = (campo, valor) => onChange({ ...jornada, [campo]: valor });

  return (
    <div className="vis-jornada-form">
      <label className="vis-field vis-field-full">
        <span>Punto de vacunación <b>*</b></span>
        <select value={jornada.punto_vacunacion_id} onChange={(e) => cambiar("punto_vacunacion_id", e.target.value)} required disabled={disabled}>
          <option value="">Selecciona el punto</option>
          {puntosLocalidad.map((punto) => <option key={punto.id} value={String(punto.id)}>{punto.nombre}</option>)}
        </select>
        {puntosLocalidad.length === 0 && <small>Esta localidad todavía no tiene puntos registrados. Puedes crear uno desde aquí.</small>}
      </label>
      <label className="vis-field"><span>Fecha de inicio <b>*</b></span><input type="date" value={jornada.fecha_inicio} onChange={(e) => cambiar("fecha_inicio", e.target.value)} required disabled={disabled} /></label>
      <label className="vis-field"><span>Fecha de fin <b>*</b></span><input type="date" min={jornada.fecha_inicio || undefined} value={jornada.fecha_fin} onChange={(e) => cambiar("fecha_fin", e.target.value)} required disabled={disabled} /></label>
      <label className="vis-field"><span>Hora de inicio <b>*</b></span><input type="time" value={jornada.hora_inicio} onChange={(e) => cambiar("hora_inicio", e.target.value)} required disabled={disabled} /></label>
      <label className="vis-field"><span>Hora de fin <b>*</b></span><input type="time" min={jornada.hora_inicio || undefined} value={jornada.hora_fin} onChange={(e) => cambiar("hora_fin", e.target.value)} required disabled={disabled} /></label>
      <label className="vis-field"><span>Dosis asignadas <b>*</b></span><input type="number" min="0" step="1" value={jornada.dosis_asignadas} onChange={(e) => cambiar("dosis_asignadas", e.target.value)} placeholder="Ej. 500" required disabled={disabled} /></label>
      <label className="vis-field"><span>Objetivo de dosis <b>*</b></span><input type="number" min="0" step="1" value={jornada.objetivo_dosis} onChange={(e) => cambiar("objetivo_dosis", e.target.value)} placeholder="Ej. 455" required disabled={disabled} /></label>
      <label className="vis-field vis-field-full"><span>Observaciones de la jornada</span><textarea rows="2" value={jornada.observaciones || ""} onChange={(e) => cambiar("observaciones", e.target.value)} placeholder="Información adicional del punto..." disabled={disabled} /></label>
    </div>
  );
}

function NuevoPunto({ localidadId, onCrear, onSeleccionar, onCerrar, disabled }) {
  const [datos, setDatos] = useState({ nombre: "", direccion: "", referencia: "" });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const enviar = async () => {
    if (!datos.nombre.trim()) {
      setError("Escribe el nombre del punto de vacunación.");
      return;
    }
    try {
      setGuardando(true);
      setError("");
      const respuesta = await onCrear({
        localidad_id: Number(localidadId),
        nombre: datos.nombre.trim(),
        direccion: datos.direccion.trim() || null,
        referencia: datos.referencia.trim() || null,
      });
      const punto = obtenerDatos(respuesta);
      if (punto?.id) onSeleccionar(punto.id);
      onCerrar();
    } catch (err) {
      setError(obtenerMensajeError(err, "No fue posible registrar el punto."));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="vis-new-point-box">
      <div className="vis-new-point-title">
        <strong>Nuevo punto de vacunación</strong>
        <button type="button" onClick={onCerrar} aria-label="Cerrar"><span className="material-symbols-rounded">close</span></button>
      </div>
      <div className="vis-form-grid">
        <label className="vis-field vis-field-full"><span>Nombre del punto <b>*</b></span><input value={datos.nombre} onChange={(e) => setDatos((a) => ({ ...a, nombre: e.target.value }))} placeholder="Ej. Centro de Salud..." /></label>
        <label className="vis-field"><span>Dirección</span><input value={datos.direccion} onChange={(e) => setDatos((a) => ({ ...a, direccion: e.target.value }))} placeholder="Calle y número" /></label>
        <label className="vis-field"><span>Referencia</span><input value={datos.referencia} onChange={(e) => setDatos((a) => ({ ...a, referencia: e.target.value }))} placeholder="Entre calles..." /></label>
      </div>
      {error && <div className="vis-form-error"><span className="material-symbols-rounded">error</span>{error}</div>}
      <button type="button" className="vis-save-point" onClick={enviar} disabled={disabled || guardando}>
        <span className="material-symbols-rounded">save</span>{guardando ? "Guardando punto..." : "Guardar punto"}
      </button>
    </div>
  );
}

export function NuevaVisitaModal({ visitas, catalogos, guardando, onGuardar, onCrearPunto, onCerrar }) {
  const [brigadaLocalidadId, setBrigadaLocalidadId] = useState("");
  const [nombre, setNombre] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [jornadas, setJornadas] = useState([jornadaVacia()]);
  const [error, setError] = useState("");
  const [nuevoPuntoJornada, setNuevoPuntoJornada] = useState(null);

  const asignacion = catalogos.brigadas_localidades.find((item) => String(item.brigada_localidad_id) === String(brigadaLocalidadId));
  const puntos = catalogos.puntos_vacunacion || [];
  const biologicos = asignacion?.biologicos || [];
  const puntosDisponibles = useMemo(() => asignacion ? puntos.filter((p) => Number(p.localidad_id) === Number(asignacion.localidad_id)) : [], [puntos, asignacion]);

  useEffect(() => {
    if (!asignacion) return;
    setNombre(`Visita - ${asignacion.localidad}`);
    setJornadas([jornadaVacia()]);
  }, [brigadaLocalidadId]);

  const cambiarJornada = (indice, datos) => setJornadas((actuales) => actuales.map((j, i) => i === indice ? datos : j));
  const agregarJornada = () => setJornadas((actuales) => [...actuales, jornadaVacia()]);
  const eliminarJornada = (indice) => setJornadas((actuales) => actuales.filter((_, i) => i !== indice));

  const enviar = async (evento) => {
    evento.preventDefault();
    setError("");
    if (!asignacion) return setError("Selecciona una brigada y localidad.");
    if (!nombre.trim()) return setError("Escribe el nombre de la visita.");

    for (const j of jornadas) {
      if (!j.punto_vacunacion_id || !j.fecha_inicio || !j.fecha_fin || j.fecha_fin < j.fecha_inicio || !j.hora_inicio || !j.hora_fin || j.hora_fin <= j.hora_inicio || j.dosis_asignadas === "" || j.objetivo_dosis === "") {
        return setError("Revisa los datos de cada jornada: punto, fechas, horarios y dosis.");
      }
      if (!Number.isInteger(Number(j.dosis_asignadas)) || !Number.isInteger(Number(j.objetivo_dosis)) || Number(j.dosis_asignadas) < 0 || Number(j.objetivo_dosis) < 0) {
        return setError("Las cantidades de dosis deben ser números enteros no negativos.");
      }
    }

    try {
      await onGuardar({
        brigada_localidad_id: Number(brigadaLocalidadId),
        codigo: codigoSiguiente(visitas),
        nombre: nombre.trim(),
        observaciones: observaciones.trim() || null,
        jornadas: jornadas.map((j) => ({
          ...j,
          punto_vacunacion_id: Number(j.punto_vacunacion_id),
          dosis_asignadas: Number(j.dosis_asignadas),
          objetivo_dosis: Number(j.objetivo_dosis),
        })),
      });
    } catch (err) {
      setError(obtenerMensajeError(err, "No fue posible registrar la visita."));
    }
  };

  return (
    <div className="vis-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !guardando) onCerrar(); }}>
      <section className="vis-modal" role="dialog" aria-modal="true" aria-labelledby="vis-new-title">
        <header className="vis-modal-header">
          <div className="vis-modal-heading-icon"><span className="material-symbols-rounded">event_available</span></div>
          <div><span className="vis-modal-eyebrow">NUEVA PROGRAMACIÓN</span><h2 id="vis-new-title">Crear visita</h2><p>Asigna una brigada, localidad y sus puntos de vacunación.</p></div>
          <button type="button" className="vis-modal-close" onClick={onCerrar} disabled={guardando} aria-label="Cerrar"><span className="material-symbols-rounded">close</span></button>
        </header>

        <form onSubmit={enviar}>
          <div className="vis-modal-body">
            {error && <div className="vis-form-error" role="alert"><span className="material-symbols-rounded">error</span>{error}</div>}

            <section className="vis-form-section">
              <div className="vis-section-heading"><span>01</span><div><h3>Asignación de visita</h3><p>Selecciona la brigada y la localidad que atenderá.</p></div></div>
              <div className="vis-form-grid">
                <label className="vis-field vis-field-full">
                  <span>Brigada y localidad <b>*</b></span>
                  <select value={brigadaLocalidadId} onChange={(e) => setBrigadaLocalidadId(e.target.value)} required disabled={guardando}>
                    <option value="">Selecciona una asignación</option>
                    {catalogos.brigadas_localidades.map((item) => <option key={item.brigada_localidad_id} value={String(item.brigada_localidad_id)}>{item.brigada_codigo} · {item.brigada_nombre} — {item.localidad} · {item.campania_codigo}</option>)}
                  </select>
                </label>
                {asignacion && (
                  <div className="vis-assignment-preview vis-field-full">
                    <div className="vis-campaign-icon"><span className="material-symbols-rounded">{asignacion.campania_categoria === "veterinaria" ? "pets" : "vaccines"}</span></div>
                    <div><small>{asignacion.campania_codigo}</small><strong>{asignacion.campania_nombre}</strong><span>{asignacion.brigada_codigo} · {asignacion.localidad}</span></div>
                    <div className="vis-assignment-biologics">{biologicos.map((bio) => <span key={bio.id}>{bio.nombre_corto || bio.nombre}</span>)}</div>
                  </div>
                )}
                <label className="vis-field vis-field-full"><span>Nombre de la visita <b>*</b></span><input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={150} placeholder="Ej. Visita de vacunación - Copoya" required disabled={guardando} /></label>
                <label className="vis-field vis-field-full"><span>Observaciones generales</span><textarea rows="2" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Notas generales de la visita..." disabled={guardando} /></label>
              </div>
            </section>

            <section className="vis-form-section">
              <div className="vis-section-heading"><span>02</span><div><h3>Puntos y jornadas</h3><p>Cada punto tiene su propio intervalo de fechas y horario.</p></div></div>
              {asignacion && <div className="vis-point-toolbar"><span><span className="material-symbols-rounded">location_on</span>{asignacion.localidad}</span><button type="button" onClick={() => setNuevoPuntoJornada(0)} disabled={guardando}><span className="material-symbols-rounded">add_location_alt</span>Nuevo punto</button></div>}

              {jornadas.map((jornada, indice) => (
                <div className="vis-jornada-form-card" key={indice}>
                  <div className="vis-jornada-form-heading">
                    <div className="vis-jornada-form-number">{String(indice + 1).padStart(2, "0")}</div>
                    <div><strong>Jornada {indice + 1}</strong><small>{puntosDisponibles.find((p) => String(p.id) === String(jornada.punto_vacunacion_id))?.nombre || "Selecciona un punto de vacunación"}</small></div>
                    {jornadas.length > 1 && <button type="button" className="vis-remove-row" onClick={() => eliminarJornada(indice)} disabled={guardando} aria-label="Eliminar jornada"><span className="material-symbols-rounded">delete</span></button>}
                  </div>
                  {asignacion ? <JornadaCampos jornada={jornada} onChange={(datos) => cambiarJornada(indice, datos)} puntos={puntos} localidadId={asignacion.localidad_id} disabled={guardando} /> : <div className="vis-form-placeholder">Selecciona primero la brigada y su localidad.</div>}
                  {nuevoPuntoJornada === indice && asignacion && <NuevoPunto localidadId={asignacion.localidad_id} onCrear={onCrearPunto} onSeleccionar={(id) => cambiarJornada(indice, { ...jornada, punto_vacunacion_id: String(id) })} onCerrar={() => setNuevoPuntoJornada(null)} disabled={guardando} />}
                </div>
              ))}
              <button type="button" className="vis-add-jornada" onClick={agregarJornada} disabled={guardando || !asignacion}><span className="material-symbols-rounded">add_circle</span>Agregar otro punto / jornada</button>
            </section>
            <div className="vis-form-note"><span className="material-symbols-rounded">lightbulb</span><p>El estado de cada jornada se actualizará automáticamente según su intervalo de fechas. No necesitas capturarlo.</p></div>
          </div>
          <footer className="vis-modal-footer"><button type="button" className="vis-button-light" onClick={onCerrar} disabled={guardando}>Cancelar</button><button type="submit" className="vis-button-primary" disabled={guardando}><span className="material-symbols-rounded">save</span>{guardando ? "Guardando visita..." : "Crear visita"}</button></footer>
        </form>
      </section>
    </div>
  );
}

export function EditarVisitaModal({ visita, guardando, onGuardar, onCerrar }) {
  const [nombre, setNombre] = useState(visita.nombre || "");
  const [observaciones, setObservaciones] = useState(visita.observaciones || "");
  const [error, setError] = useState("");

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    if (!nombre.trim()) return setError("El nombre de la visita es obligatorio.");
    try {
      await onGuardar({ nombre: nombre.trim(), observaciones: observaciones.trim() || null });
    } catch (err) {
      setError(obtenerMensajeError(err, "No fue posible actualizar la visita."));
    }
  };

  return (
    <div className="vis-modal-overlay">
      <section className="vis-modal vis-modal-small" role="dialog" aria-modal="true">
        <header className="vis-modal-header"><div className="vis-modal-heading-icon"><span className="material-symbols-rounded">edit_calendar</span></div><div><span className="vis-modal-eyebrow">DATOS GENERALES</span><h2>Editar visita</h2><p>{visita.codigo} · {visita.localidad}</p></div><button type="button" className="vis-modal-close" onClick={onCerrar} disabled={guardando}><span className="material-symbols-rounded">close</span></button></header>
        <form onSubmit={enviar}>
          <div className="vis-modal-body">{error && <div className="vis-form-error"><span className="material-symbols-rounded">error</span>{error}</div>}<div className="vis-form-grid"><label className="vis-field vis-field-full"><span>Nombre de la visita <b>*</b></span><input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={150} required disabled={guardando} /></label><label className="vis-field vis-field-full"><span>Observaciones</span><textarea rows="4" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} disabled={guardando} /></label></div></div>
          <footer className="vis-modal-footer"><button type="button" className="vis-button-light" onClick={onCerrar} disabled={guardando}>Cancelar</button><button type="submit" className="vis-button-primary" disabled={guardando}><span className="material-symbols-rounded">save</span>Guardar cambios</button></footer>
        </form>
      </section>
    </div>
  );
}

export function JornadaModal({ visita, jornada, puntos, guardando, onGuardar, onCrearPunto, onCerrar }) {
  const [formulario, setFormulario] = useState(() => ({
    ...jornadaVacia(),
    ...(jornada || {}),
    punto_vacunacion_id: String(jornada?.punto_vacunacion_id || ""),
    fecha_inicio: String(jornada?.fecha_inicio || "").slice(0, 10),
    fecha_fin: String(jornada?.fecha_fin || "").slice(0, 10),
    hora_inicio: jornada?.hora_inicio ? formatearHora(jornada.hora_inicio) : "08:00",
    hora_fin: jornada?.hora_fin ? formatearHora(jornada.hora_fin) : "14:00",
    dosis_asignadas: String(jornada?.dosis_asignadas ?? ""),
    objetivo_dosis: String(jornada?.objetivo_dosis ?? ""),
  }));
  const [error, setError] = useState("");
  const [mostrarPunto, setMostrarPunto] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    if (!formulario.punto_vacunacion_id || !formulario.fecha_inicio || !formulario.fecha_fin || formulario.fecha_fin < formulario.fecha_inicio || !formulario.hora_inicio || !formulario.hora_fin || formulario.hora_fin <= formulario.hora_inicio || formulario.dosis_asignadas === "" || formulario.objetivo_dosis === "") {
      return setError("Revisa el punto, las fechas, horarios y cantidades.");
    }
    if (!Number.isInteger(Number(formulario.dosis_asignadas)) || !Number.isInteger(Number(formulario.objetivo_dosis)) || Number(formulario.dosis_asignadas) < 0 || Number(formulario.objetivo_dosis) < 0) {
      return setError("Las cantidades deben ser números enteros no negativos.");
    }
    try {
      await onGuardar({ ...formulario, punto_vacunacion_id: Number(formulario.punto_vacunacion_id), dosis_asignadas: Number(formulario.dosis_asignadas), objetivo_dosis: Number(formulario.objetivo_dosis) });
    } catch (err) {
      setError(obtenerMensajeError(err, "No fue posible guardar la jornada."));
    }
  };

  return (
    <div className="vis-modal-overlay">
      <section className="vis-modal vis-modal-small" role="dialog" aria-modal="true">
        <header className="vis-modal-header"><div className="vis-modal-heading-icon"><span className="material-symbols-rounded">event</span></div><div><span className="vis-modal-eyebrow">{jornada ? "EDICIÓN DE JORNADA" : "PROGRAMACIÓN"}</span><h2>{jornada ? "Editar jornada" : "Agregar jornada"}</h2><p>{visita.codigo} · {visita.localidad}</p></div><button type="button" className="vis-modal-close" onClick={onCerrar} disabled={guardando}><span className="material-symbols-rounded">close</span></button></header>
        <form onSubmit={enviar}>
          <div className="vis-modal-body">
            {error && <div className="vis-form-error"><span className="material-symbols-rounded">error</span>{error}</div>}
            <JornadaCampos jornada={formulario} onChange={setFormulario} puntos={puntos} localidadId={visita.localidad_id} disabled={guardando} />
            <div className="vis-inline-point-action"><button type="button" onClick={() => setMostrarPunto((v) => !v)} disabled={guardando}><span className="material-symbols-rounded">add_location_alt</span>Registrar punto nuevo en {visita.localidad}</button></div>
            {mostrarPunto && <NuevoPunto localidadId={visita.localidad_id} onCrear={onCrearPunto} onSeleccionar={(id) => setFormulario((actual) => ({ ...actual, punto_vacunacion_id: String(id) }))} onCerrar={() => setMostrarPunto(false)} disabled={guardando} />}
          </div>
          <footer className="vis-modal-footer"><button type="button" className="vis-button-light" onClick={onCerrar} disabled={guardando}>Cancelar</button><button type="submit" className="vis-button-primary" disabled={guardando}><span className="material-symbols-rounded">save</span>{guardando ? "Guardando..." : "Guardar jornada"}</button></footer>
        </form>
      </section>
    </div>
  );
}
