import { useState, useEffect } from "react";
import "./CampaniaForm.css";

const valoresIniciales = {
  codigo: "",
  nombre: "",
  descripcion: "",
  categoria: "humana",
  icono: "",
  fecha_inicio: "",
  fecha_fin: "",
  objetivo_dosis: 0,
  dosis_asignadas: 0,
  estado: "activa",
  responsable_id: "",
};

function fechaParaInput(fecha) {
  if (!fecha) return "";
  return String(fecha).slice(0, 10);
}

function obtenerValoresIniciales(campania) {
  if (!campania) {
    return { ...valoresIniciales };
  }

  return {
    codigo: campania.codigo || "",
    nombre: campania.nombre || "",
    descripcion: campania.descripcion || "",
    categoria: campania.categoria || "humana",
    icono: campania.icono || "",
    fecha_inicio: fechaParaInput(campania.fecha_inicio),
    fecha_fin: fechaParaInput(campania.fecha_fin),
    objetivo_dosis: campania.objetivo_dosis ?? 0,
    dosis_asignadas: campania.dosis_asignadas ?? 0,
    estado: campania.estado || "activa",
    responsable_id: campania.responsable_id ?? "",
  };
}

export default function CampaniaForm({
  campania,
  responsables = [],
  guardando = false,
  onGuardar,
  onCerrar,
}) {
  const [formulario, setFormulario] = useState(
    () => obtenerValoresIniciales(campania)
  );

  const [error, setError] = useState("");

  // Cerrar con Escape
  useEffect(() => {
    const manejarEscape = (evento) => {
      if (evento.key === "Escape" && !guardando) {
        onCerrar();
      }
    };

    document.addEventListener("keydown", manejarEscape);

    return () => {
      document.removeEventListener("keydown", manejarEscape);
    };
  }, [guardando, onCerrar]);

  const cambiarCampo = (evento) => {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  const enviarFormulario = async (evento) => {
    evento.preventDefault();
    setError("");

    if (!formulario.codigo.trim() || !formulario.nombre.trim()) {
      setError("El código y el nombre son obligatorios.");
      return;
    }

    if (!formulario.fecha_inicio || !formulario.fecha_fin) {
      setError("Debes indicar las fechas de inicio y finalización.");
      return;
    }

    if (formulario.fecha_fin < formulario.fecha_inicio) {
      setError(
        "La fecha de finalización no puede ser anterior al inicio."
      );
      return;
    }

    const objetivo = Number(formulario.objetivo_dosis);
    const asignadas = Number(formulario.dosis_asignadas);

    if (
      formulario.objetivo_dosis === "" ||
      !Number.isInteger(objetivo) ||
      objetivo < 0
    ) {
      setError(
        "El objetivo debe ser un número entero igual o mayor a cero."
      );
      return;
    }

    if (
      formulario.dosis_asignadas === "" ||
      !Number.isInteger(asignadas) ||
      asignadas < 0
    ) {
      setError(
        "Las dosis asignadas deben ser un número entero igual o mayor a cero."
      );
      return;
    }

    if (asignadas > objetivo) {
      setError(
        "Las dosis asignadas no pueden superar el objetivo de dosis."
      );
      return;
    }

    const datos = {
      ...formulario,
      codigo: formulario.codigo.trim(),
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim() || null,
      icono: formulario.icono.trim() || null,
      objetivo_dosis: objetivo,
      dosis_asignadas: asignadas,
      responsable_id: formulario.responsable_id
        ? Number(formulario.responsable_id)
        : null,
    };

    try {
      await onGuardar(datos);
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        error.message ||
        "No fue posible guardar la campaña."
      );
    }
  };

  return (
    <div
      className="campania-modal-overlay"
      onMouseDown={(evento) => {
        if (
          evento.target === evento.currentTarget &&
          !guardando
        ) {
          onCerrar();
        }
      }}
    >
      <section className="campania-modal">
        <div className="campania-modal-header">
          <div>
            <span className="campania-eyebrow">
              {campania ? "ACTUALIZACIÓN" : "NUEVO REGISTRO"}
            </span>

            <h2>
              {campania ? "Editar campaña" : "Nueva campaña"}
            </h2>

            <p>
              Completa la información de la campaña de vacunación.
            </p>
          </div>

          <button
            type="button"
            className="campania-close-button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar formulario"
          >
            <span className="material-symbols-rounded">
              close
            </span>
          </button>
        </div>

        <form onSubmit={enviarFormulario}>
          <div className="campania-form-body">
            {error && (
              <div
                className="campania-form-error"
                role="alert"
              >
                <span className="material-symbols-rounded">
                  error
                </span>
                {error}
              </div>
            )}

            {/* Información general */}
            <div className="campania-form-section">
              <h3>Información general</h3>

              <div className="campania-form-grid">
                <label className="campania-field">
                  <span>Código de campaña *</span>

                  <input
                    name="codigo"
                    value={formulario.codigo}
                    onChange={cambiarCampo}
                    placeholder="Ej. CAM-001"
                    maxLength={30}
                    required
                    disabled={guardando}
                  />
                </label>

                <label className="campania-field">
                  <span>Categoría *</span>

                  <select
                    name="categoria"
                    value={formulario.categoria}
                    onChange={cambiarCampo}
                    required
                    disabled={guardando}
                  >
                    <option value="humana">Salud Humana</option>
                    <option value="veterinaria">Salud Veterinaria</option>
                  </select>
                </label>

                <label className="campania-field campania-field-full">
                  <span>Nombre de la campaña *</span>

                  <input
                    name="nombre"
                    value={formulario.nombre}
                    onChange={cambiarCampo}
                    placeholder="Nombre de la campaña"
                    maxLength={150}
                    required
                    disabled={guardando}
                  />
                </label>

                <label className="campania-field campania-field-full">
                  <span>Descripción</span>

                  <textarea
                    name="descripcion"
                    value={formulario.descripcion}
                    onChange={cambiarCampo}
                    placeholder="Describe brevemente la campaña..."
                    rows={3}
                    disabled={guardando}
                  />
                </label>
              </div>
            </div>

            {/* Programación y objetivo */}
            <div className="campania-form-section">
              <h3>Programación y objetivo</h3>

              <div className="campania-form-grid">
                <label className="campania-field">
                  <span>Fecha de inicio *</span>

                  <input
                    type="date"
                    name="fecha_inicio"
                    value={formulario.fecha_inicio}
                    onChange={cambiarCampo}
                    required
                    disabled={guardando}
                  />
                </label>

                <label className="campania-field">
                  <span>Fecha de finalización *</span>

                  <input
                    type="date"
                    name="fecha_fin"
                    value={formulario.fecha_fin}
                    onChange={cambiarCampo}
                    min={formulario.fecha_inicio || undefined}
                    required
                    disabled={guardando}
                  />
                </label>

                <label className="campania-field">
                  <span>Dosis asignadas *</span>

                  <input
                    type="number"
                    name="dosis_asignadas"
                    value={formulario.dosis_asignadas}
                    onChange={cambiarCampo}
                    placeholder="Ej. 5000"
                    min="0"
                    step="1"
                    required
                    disabled={guardando}
                  />

                  <small>
                    Cantidad de dosis asignadas a la campaña.
                  </small>
                </label>

                <label className="campania-field">
                  <span>Objetivo de dosis *</span>

                  <input
                    type="number"
                    name="objetivo_dosis"
                    value={formulario.objetivo_dosis}
                    onChange={cambiarCampo}
                    placeholder="Ej. 10000"
                    min="0"
                    step="1"
                    required
                    disabled={guardando}
                  />

                  <small>
                    Cantidad total de dosis que se pretende alcanzar.
                  </small>
                </label>

                <label className="campania-field campania-field-full">
                  <span>Estado</span>

                  <select
                    name="estado"
                    value={formulario.estado}
                    onChange={cambiarCampo}
                    disabled={guardando}
                  >
                    <option value="activa">Activa</option>
                    <option value="planeada">Planeada</option>
                    <option value="finalizada">Finalizada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Responsable e imagen */}
            <div className="campania-form-section">
              <h3>Responsable e imagen</h3>

              <div className="campania-form-grid">
                <label className="campania-field campania-field-full">
                  <span>Coordinador responsable</span>

                  <select
                    name="responsable_id"
                    value={formulario.responsable_id}
                    onChange={cambiarCampo}
                    disabled={guardando}
                  >
                    <option value="">
                      Sin responsable asignado
                    </option>

                    {responsables.map((persona) => (
                      <option
                        key={persona.id}
                        value={persona.id}
                      >
                        {[
                          persona.nombres,
                          persona.apellido_paterno,
                          persona.apellido_materno,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="campania-field campania-field-full">
                  <span>Ruta de imagen (opcional)</span>

                  <input
                    name="icono"
                    value={formulario.icono}
                    onChange={cambiarCampo}
                    placeholder="/icons/campanias/CAM-001.png"
                    maxLength={100}
                    disabled={guardando}
                  />

                  <small>
                    Si la dejas vacía, la tarjeta buscará la imagen usando el código.
                  </small>
                </label>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="campania-modal-footer">
            <button
              type="button"
              className="campania-button campania-button-light"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="campania-button campania-button-primary"
              disabled={guardando}
            >
              <span className="material-symbols-rounded">
                {guardando ? "hourglass_top" : "save"}
              </span>

              {guardando
                ? "Guardando..."
                : "Guardar campaña"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}