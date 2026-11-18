import { useEffect, useState } from "react";
import "./PersonalForm.css";
import { obtenerRoles } from "../../services/rolService";

const formularioInicial = {
  nombres: "",
  apellido_paterno: "",
  apellido_materno: "",
  curp: "",
  telefono: "",
  correo: "",
  fecha_nacimiento: "",
  estado: "activo",
  rol_id: "",
};

const API_URL = "http://localhost:3000";

const obtenerUrlFoto = (ruta) => {
  if (!ruta) return "";

  if (ruta.startsWith("http://") || ruta.startsWith("https://")) {
    return ruta;
  }

  return `${API_URL}${ruta.startsWith("/") ? "" : "/"}${ruta}`;
};

function PersonalForm({
  persona,
  guardando,
  onGuardar,
  onCerrar,
}) {
  const [roles, setRoles] = useState([]);
  const [cargandoRoles, setCargandoRoles] = useState(true);
  const [errorRoles, setErrorRoles] = useState("");

  const [datos, setDatos] = useState(() => ({
    ...formularioInicial,
    ...(persona || {}),
    fecha_nacimiento: persona?.fecha_nacimiento
      ? String(persona.fecha_nacimiento).slice(0, 10)
      : "",
    estado: persona?.estado || "activo",
    rol_id: persona?.rol_id ? String(persona.rol_id) : "",
  }));

  const [foto, setFoto] = useState(null);

  const [vistaPrevia, setVistaPrevia] = useState(
    obtenerUrlFoto(persona?.foto)
  );

  const [errorFoto, setErrorFoto] = useState("");

  // Cargar roles desde el backend
  useEffect(() => {
    let componenteActivo = true;

    obtenerRoles()
      .then((resultado) => {
        if (componenteActivo) {
          setRoles(resultado || []);
          setErrorRoles("");
        }
      })
      .catch((error) => {
        console.error("Error al cargar roles:", error);

        if (componenteActivo) {
          setErrorRoles(
            "No fue posible cargar los roles. Intenta nuevamente."
          );
        }
      })
      .finally(() => {
        if (componenteActivo) {
          setCargandoRoles(false);
        }
      });

    return () => {
      componenteActivo = false;
    };
  }, []);

  // Liberar URL temporal de fotografías
  useEffect(() => {
    return () => {
      if (vistaPrevia.startsWith("blob:")) {
        URL.revokeObjectURL(vistaPrevia);
      }
    };
  }, [vistaPrevia]);

  const cambiarCampo = (event) => {
    const { name, value } = event.target;

    setDatos((actuales) => ({
      ...actuales,
      [name]: name === "curp" ? value.toUpperCase() : value,
    }));
  };

  // Seleccionar y validar fotografía
  const seleccionarFoto = (event) => {
    const archivo = event.target.files?.[0];

    setErrorFoto("");
    setFoto(null);

    if (!archivo) return;

    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!tiposPermitidos.includes(archivo.type)) {
      setErrorFoto("Selecciona una imagen JPG, PNG o WEBP.");
      event.target.value = "";
      return;
    }

    if (archivo.size > 2 * 1024 * 1024) {
      setErrorFoto("La fotografía no debe superar los 2 MB.");
      event.target.value = "";
      return;
    }

    setFoto(archivo);
    setVistaPrevia(URL.createObjectURL(archivo));
  };

  // Enviar formulario
  const enviarFormulario = (event) => {
    event.preventDefault();

    if (!datos.nombres.trim() || !datos.apellido_paterno.trim()) {
      return;
    }

    if (!/^[A-Z0-9]{18}$/.test(datos.curp)) {
      setErrorFoto("");
      alert("La CURP debe contener exactamente 18 caracteres alfanuméricos.");
      return;
    }

    if (!datos.rol_id) {
      alert("Debes seleccionar un rol para el integrante.");
      return;
    }

    if (errorRoles || cargandoRoles) {
      alert("Espera a que se carguen los roles antes de guardar.");
      return;
    }

    onGuardar(datos, foto);
  };

  return (
    <div
      className="personal-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !guardando) {
          onCerrar();
        }
      }}
    >
      <section
        className="personal-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="personal-modal-title"
      >
        <header className="personal-modal-header">
          <div>
            <span className="personal-modal-eyebrow">
              DIRECTORIO DE PERSONAL
            </span>

            <h2 id="personal-modal-title">
              {persona ? "Editar personal" : "Agregar personal"}
            </h2>

            <p>
              Completa la información del integrante del equipo.
            </p>
          </div>

          <button
            type="button"
            className="personal-modal-close"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar formulario"
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        </header>

        <form onSubmit={enviarFormulario}>
          <div className="personal-modal-body">
            <section className="photo-section">
              <div className="photo-preview">
                {vistaPrevia ? (
                  <img
                    src={vistaPrevia}
                    alt="Vista previa de fotografía"
                  />
                ) : (
                  <span className="material-symbols-rounded">
                    account_circle
                  </span>
                )}
              </div>

              <div className="photo-information">
                <strong>Fotografía del personal</strong>
                <p>JPG, PNG o WEBP. Tamaño máximo: 2 MB.</p>

                <label className="photo-select-button">
                  <span className="material-symbols-rounded">
                    upload
                  </span>
                  Seleccionar fotografía

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={seleccionarFoto}
                    disabled={guardando}
                  />
                </label>

                {errorFoto && (
                  <span className="photo-error">
                    {errorFoto}
                  </span>
                )}
              </div>
            </section>

            <div className="form-section-title">
              <span className="material-symbols-rounded">
                person
              </span>
              Información personal
            </div>

            <div className="personal-form-grid">
              <label className="personal-field">
                <span>Nombres <b>*</b></span>
                <input
                  name="nombres"
                  value={datos.nombres}
                  onChange={cambiarCampo}
                  maxLength={150}
                  placeholder="Nombre(s)"
                  required
                  disabled={guardando}
                />
              </label>

              <label className="personal-field">
                <span>Apellido paterno <b>*</b></span>
                <input
                  name="apellido_paterno"
                  value={datos.apellido_paterno}
                  onChange={cambiarCampo}
                  maxLength={100}
                  placeholder="Apellido paterno"
                  required
                  disabled={guardando}
                />
              </label>

              <label className="personal-field">
                <span>Apellido materno</span>
                <input
                  name="apellido_materno"
                  value={datos.apellido_materno}
                  onChange={cambiarCampo}
                  maxLength={100}
                  placeholder="Apellido materno"
                  disabled={guardando}
                />
              </label>

              <label className="personal-field">
                <span>CURP <b>*</b></span>
                <input
                  name="curp"
                  value={datos.curp}
                  onChange={cambiarCampo}
                  maxLength={18}
                  minLength={18}
                  pattern="[A-Za-z0-9]{18}"
                  placeholder="18 caracteres"
                  required
                  disabled={guardando}
                />
              </label>

              <label className="personal-field">
                <span>Teléfono</span>
                <input
                  name="telefono"
                  value={datos.telefono}
                  onChange={cambiarCampo}
                  maxLength={20}
                  placeholder="Número telefónico"
                  disabled={guardando}
                />
              </label>

              <label className="personal-field">
                <span>Correo electrónico</span>
                <input
                  type="email"
                  name="correo"
                  value={datos.correo}
                  onChange={cambiarCampo}
                  maxLength={150}
                  placeholder="correo@ejemplo.com"
                  disabled={guardando}
                />
              </label>

              <label className="personal-field">
                <span>Fecha de nacimiento</span>
                <input
                  type="date"
                  name="fecha_nacimiento"
                  value={datos.fecha_nacimiento}
                  onChange={cambiarCampo}
                  max={new Date().toISOString().slice(0, 10)}
                  disabled={guardando}
                />
              </label>

              <label className="personal-field">
                <span>Estado</span>
                <select
                  name="estado"
                  value={datos.estado}
                  onChange={cambiarCampo}
                  disabled={guardando}
                >
                  <option value="activo">Activo</option>
                  <option value="vacaciones">Vacaciones</option>
                  <option value="baja">Baja</option>
                </select>
              </label>

              {/* Selector dinámico de roles */}
              <label className="personal-field">
                <span>Rol del integrante <b>*</b></span>

                <select
                  name="rol_id"
                  value={datos.rol_id}
                  onChange={cambiarCampo}
                  required
                  disabled={
                    guardando ||
                    cargandoRoles ||
                    roles.length === 0
                  }
                >
                  <option value="">
                    {cargandoRoles
                      ? "Cargando roles..."
                      : "Selecciona un rol"}
                  </option>

                  {roles.map((rol) => (
                    <option
                      key={rol.id}
                      value={String(rol.id)}
                    >
                      {rol.nombre}
                    </option>
                  ))}
                </select>

                {errorRoles && (
                  <span className="photo-error">
                    {errorRoles}
                  </span>
                )}
              </label>
            </div>

            <p className="personal-required-note">
              <b>*</b> Los campos marcados son obligatorios.
            </p>
          </div>

          <footer className="personal-modal-footer">
            <button
              type="button"
              className="personal-cancel-button"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="personal-save-button"
              disabled={
                guardando ||
                cargandoRoles ||
                roles.length === 0
              }
            >
              <span className="material-symbols-rounded">
                {guardando ? "hourglass_top" : "save"}
              </span>

              {guardando
                ? "Guardando..."
                : persona
                  ? "Guardar cambios"
                  : "Registrar personal"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default PersonalForm;