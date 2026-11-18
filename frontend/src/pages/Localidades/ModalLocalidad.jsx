import { useState } from "react";
import { crearLocalidad } from "../../services/localidadService";
import "./ModalesLocalidades.css";

const FORMULARIO_INICIAL = {
  codigo: "",
  nombre: "",
  tipo: "localidad",
  municipio: "Tuxtla Gutiérrez",
  estado: "Chiapas",
  codigo_postal: "",
  poblacion: "",
  latitud: "",
  longitud: "",
  color_marcador: "#2878B8",
};

function ModalLocalidad({ onClose, onGuardado }) {
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const cambiarCampo = (e) => {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  const guardarLocalidad = async (e) => {
    e.preventDefault();
    setError("");

    const datos = {
      codigo: formulario.codigo.trim(),
      nombre: formulario.nombre.trim(),
      tipo: formulario.tipo || null,
      municipio: formulario.municipio.trim(),
      estado: formulario.estado.trim(),
      codigo_postal: formulario.codigo_postal.trim() || null,
      poblacion:
        formulario.poblacion === ""
          ? null
          : Number(formulario.poblacion),
      latitud:
        formulario.latitud === ""
          ? null
          : Number(formulario.latitud),
      longitud:
        formulario.longitud === ""
          ? null
          : Number(formulario.longitud),
      color_marcador: formulario.color_marcador,
      activa: true,
    };

    try {
      setGuardando(true);

      await crearLocalidad(datos);

      await onGuardado();

      onClose();
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        err.message ||
        "No fue posible registrar la localidad."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="modal-localidades-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !guardando) {
          onClose();
        }
      }}
    >
      <section
        className="modal-localidades modal-localidad-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-localidad-titulo"
      >
        <header className="modal-localidades-header">
          <div className="modal-localidades-heading">
            <div className="modal-localidades-icon modal-icon-blue">
              <span className="material-symbols-rounded">
                add_location_alt
              </span>
            </div>

            <div>
              <h2 id="modal-localidad-titulo">
                Agregar localidad
              </h2>

              <p>
                Registra una nueva localidad en el directorio.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="modal-localidades-close"
            onClick={onClose}
            disabled={guardando}
            aria-label="Cerrar"
          >
            <span className="material-symbols-rounded">
              close
            </span>
          </button>
        </header>

        <form onSubmit={guardarLocalidad}>
          <div className="modal-localidades-body">

            {error && (
              <div className="modal-localidades-error">
                <span className="material-symbols-rounded">
                  error
                </span>
                {error}
              </div>
            )}

            <div className="modal-form-section-title">
              <span className="material-symbols-rounded">
                description
              </span>
              Información general
            </div>

            <div className="modal-localidades-grid">

              <div className="modal-localidad-field">
                <label htmlFor="localidad-codigo">
                  Código <span>*</span>
                </label>

                <input
                  id="localidad-codigo"
                  name="codigo"
                  value={formulario.codigo}
                  onChange={cambiarCampo}
                  maxLength={30}
                  placeholder="Ej. LOC-011"
                  required
                />
              </div>

              <div className="modal-localidad-field">
                <label htmlFor="localidad-tipo">
                  Tipo de localidad
                </label>

                <select
                  id="localidad-tipo"
                  name="tipo"
                  value={formulario.tipo}
                  onChange={cambiarCampo}
                >
                  <option value="localidad">Localidad</option>
                  <option value="colonia">Colonia</option>
                  <option value="barrio">Barrio</option>
                  <option value="ejido">Ejido</option>
                  <option value="rancheria">Ranchería</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="modal-localidad-field modal-field-full">
                <label htmlFor="localidad-nombre">
                  Nombre de la localidad <span>*</span>
                </label>

                <input
                  id="localidad-nombre"
                  name="nombre"
                  value={formulario.nombre}
                  onChange={cambiarCampo}
                  maxLength={150}
                  placeholder="Nombre de la localidad"
                  required
                />
              </div>

              <div className="modal-localidad-field">
                <label htmlFor="localidad-municipio">
                  Municipio <span>*</span>
                </label>

                <input
                  id="localidad-municipio"
                  name="municipio"
                  value={formulario.municipio}
                  onChange={cambiarCampo}
                  maxLength={120}
                  required
                />
              </div>

              <div className="modal-localidad-field">
                <label htmlFor="localidad-estado">
                  Estado <span>*</span>
                </label>

                <input
                  id="localidad-estado"
                  name="estado"
                  value={formulario.estado}
                  onChange={cambiarCampo}
                  maxLength={120}
                  required
                />
              </div>

              <div className="modal-localidad-field">
                <label htmlFor="localidad-cp">
                  Código postal
                </label>

                <input
                  id="localidad-cp"
                  name="codigo_postal"
                  value={formulario.codigo_postal}
                  onChange={cambiarCampo}
                  maxLength={10}
                  placeholder="Ej. 29100"
                />
              </div>

              <div className="modal-localidad-field">
                <label htmlFor="localidad-poblacion">
                  Población
                </label>

                <input
                  id="localidad-poblacion"
                  name="poblacion"
                  type="number"
                  min="0"
                  step="1"
                  value={formulario.poblacion}
                  onChange={cambiarCampo}
                  placeholder="Número de habitantes"
                />
              </div>

            </div>

            <div className="modal-form-section-title modal-section-location">
              <span className="material-symbols-rounded">
                map
              </span>
              Ubicación geográfica
            </div>

            <p className="modal-form-help">
              Las coordenadas permiten mostrar la localidad en el mapa.
              Puedes capturarlas ahora o agregarlas posteriormente.
            </p>

            <div className="modal-localidades-grid">

              <div className="modal-localidad-field">
                <label htmlFor="localidad-latitud">
                  Latitud
                </label>

                <input
                  id="localidad-latitud"
                  name="latitud"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={formulario.latitud}
                  onChange={cambiarCampo}
                  placeholder="Ej. 16.71158"
                />
              </div>

              <div className="modal-localidad-field">
                <label htmlFor="localidad-longitud">
                  Longitud
                </label>

                <input
                  id="localidad-longitud"
                  name="longitud"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={formulario.longitud}
                  onChange={cambiarCampo}
                  placeholder="Ej. -93.11939"
                />
              </div>

            </div>

            <div className="modal-localidad-color-field">
              <div>
                <strong>Color del marcador</strong>
                <span>Personaliza cómo aparecerá en el mapa.</span>
              </div>

              <label className="modal-localidad-color-picker">
                <input
                  type="color"
                  name="color_marcador"
                  value={formulario.color_marcador}
                  onChange={cambiarCampo}
                />

                <span>{formulario.color_marcador.toUpperCase()}</span>
              </label>
            </div>

          </div>

          <footer className="modal-localidades-footer">
            <span className="modal-form-required">
              * Campos obligatorios
            </span>

            <div className="modal-localidades-footer-actions">
              <button
                type="button"
                className="modal-button-secondary"
                onClick={onClose}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="modal-button-primary"
                disabled={guardando}
              >
                <span className="material-symbols-rounded">
                  {guardando ? "progress_activity" : "save"}
                </span>

                {guardando ? "Guardando..." : "Guardar localidad"}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default ModalLocalidad;