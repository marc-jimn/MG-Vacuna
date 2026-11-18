import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader/PageHeader";

import {
  obtenerBrigadas,
  obtenerBrigadaPorId,
  crearBrigada,
  actualizarBrigada,
  asignarIntegrantes,
} from "../../services/brigadaService";

import { obtenerCampanias } from "../../services/campaniaService";
import { obtenerPersonal } from "../../services/personalService";

import "./Brigadas.css";

// Configuración

const API_URL = "http://localhost:3000";

const nombresEstados = {
  disponible: "Disponible",
  asignada: "Asignada",
  en_ruta: "En ruta",
  en_visita: "En visita",
  terminada: "Terminada",
  cancelada: "Cancelada",
};

const funcionesEquipo = [
  {
    key: "responsable",
    funcion: "responsable",
    label: "Responsable de brigada",
    rol_id: 3,
    icono: "supervisor_account",
  },
  {
    key: "medico",
    funcion: "medico",
    label: "Médico",
    rol_id: 5,
    icono: "medical_services",
  },
  {
    key: "enfermero1",
    funcion: "enfermero",
    label: "Primer enfermero",
    rol_id: 6,
    icono: "health_and_safety",
  },
  {
    key: "enfermero2",
    funcion: "enfermero",
    label: "Segundo enfermero",
    rol_id: 6,
    icono: "health_and_safety",
  },
  {
    key: "conductor",
    funcion: "conductor",
    label: "Conductor",
    rol_id: 7,
    icono: "directions_car",
  },
];

// Funciones auxiliares

function extraerLista(respuesta) {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.datos)) return respuesta.datos;
  if (Array.isArray(respuesta?.data)) return respuesta.data;

  return [];
}

function obtenerNombreCompleto(persona) {
  if (!persona) return "Sin asignar";

  return [
    persona.nombres,
    persona.apellido_paterno,
    persona.apellido_materno,
  ]
    .filter(Boolean)
    .join(" ");
}

function obtenerUrlFoto(ruta) {
  if (!ruta) return "";

  if (ruta.startsWith("http://") || ruta.startsWith("https://")) {
    return ruta;
  }

  return `${API_URL}${ruta.startsWith("/") ? "" : "/"}${ruta}`;
}

function obtenerIconoCampania(brigada) {
  return (
    brigada.campania_icono ||
    brigada.icono ||
    `/icons/campanias/${brigada.campania_codigo}.png`
  );
}

function obtenerIniciales(persona) {
  if (!persona) return "?";

  const nombre = persona.nombres?.trim() || "";
  const apellido = persona.apellido_paterno?.trim() || "";

  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

function obtenerMensajeError(error, mensajePredeterminado) {
  return (
    error.response?.data?.mensaje ||
    error.response?.data?.message ||
    error.message ||
    mensajePredeterminado
  );
}

// Fotografía

function AvatarPersonal({
  persona,
  className = "",
}) {
  const foto = obtenerUrlFoto(persona?.foto);

  const [fotoFallida, setFotoFallida] = useState("");

  const imagenDisponible = foto && fotoFallida !== foto;

  return (
    <div
      className={`brigada-avatar ${className}`}
      title={
        persona
          ? `${obtenerNombreCompleto(persona)} · ${persona.funcion || ""}`
          : "Integrante pendiente"
      }
    >
      {imagenDisponible ? (
        <img
          src={foto}
          alt={obtenerNombreCompleto(persona)}
          onError={() => setFotoFallida(foto)}
        />
      ) : persona ? (
        <span className="brigada-avatar-initials">
          {obtenerIniciales(persona)}
        </span>
      ) : (
        <span className="material-symbols-rounded">
          person
        </span>
      )}
    </div>
  );
}

// Icono de la campaña

function IconoCampania({
  brigada,
  className = "",
}) {
  const icono = obtenerIconoCampania(brigada);

  const [iconoFallido, setIconoFallido] = useState("");

  const imagenDisponible = icono && iconoFallido !== icono;

  return (
    <div className={`brigada-campaign-icon ${className}`}>
      {imagenDisponible ? (
        <img
          src={icono}
          alt={`Icono de ${brigada.campania_nombre || "campaña"}`}
          onError={() => setIconoFallido(icono)}
        />
      ) : (
        <span className="material-symbols-rounded">
          {brigada.campania_categoria === "veterinaria"
            ? "pets"
            : "vaccines"}
        </span>
      )}
    </div>
  );
}

// Tarjeta

function BrigadaCard({
  brigada,
  onVerDetalles,
  onEditar,
}) {
  const integrantes = brigada.integrantes || [];

  const equipo = funcionesEquipo.map((funcion) => {
    if (funcion.key === "enfermero1") {
      return integrantes.filter(
        (persona) => persona.funcion === "enfermero"
      )[0];
    }

    if (funcion.key === "enfermero2") {
      return integrantes.filter(
        (persona) => persona.funcion === "enfermero"
      )[1];
    }

    return integrantes.find(
      (persona) => persona.funcion === funcion.funcion
    );
  });

  const estado = brigada.estado || "disponible";

  const localidadesCount = Number(brigada.localidades_count || 0);

  return (
    <article className="brigada-card">

      {/* Encabezado */}

      <div className="brigada-card-campaign">
        <IconoCampania brigada={brigada} />

        <div className="brigada-card-campaign-info">
          <span>CAMPAÑA ASIGNADA</span>

          <strong>
            {brigada.campania_nombre || "Sin campaña"}
          </strong>

          <small>
            {brigada.campania_codigo || ""}
          </small>
        </div>

        <span className={`brigada-status ${estado}`}>
          {nombresEstados[estado] || estado}
        </span>
      </div>

      {/* Identificación*/}

      <div className="brigada-card-identity">
        <div>
          <span className="brigada-code">
            {brigada.codigo}
          </span>

          <h3>{brigada.nombre}</h3>
        </div>

        <span className="material-symbols-rounded brigada-identity-icon">
          groups
        </span>
      </div>

      {/* Descripción */}

      <p className="brigada-description">
        {brigada.descripcion || "Sin descripción disponible."}
      </p>

      {/* Dosis de vacunación */}

      <div className="brigada-doses-section">

        <div className="brigada-dose-item">
          <div className="brigada-dose-icon assigned">
            <span className="material-symbols-rounded">
              vaccines
            </span>
          </div>

          <div>
            <small>Dosis asignadas</small>
            <strong>
              {Number(brigada.dosis_asignadas || 0).toLocaleString("es-MX")}
            </strong>
          </div>
        </div>

        <div className="brigada-dose-divider"></div>

        <div className="brigada-dose-item">
          <div className="brigada-dose-icon objective">
            <span className="material-symbols-rounded">
              flag
            </span>
          </div>

          <div>
            <small>Objetivo de dosis</small>
            <strong>
              {Number(brigada.objetivo_dosis || 0).toLocaleString("es-MX")}
            </strong>
          </div>
        </div>
      </div>

      {/* Equipo */}

      <div className="brigada-team-section">
        <div className="brigada-section-label">
          <div>
            <span className="material-symbols-rounded">
              groups
            </span>

            <strong>Equipo de trabajo</strong>
          </div>

          <small>
            {integrantes.length}/5 integrantes
          </small>
        </div>

        <div className="brigada-team-avatars">
          {equipo.map((persona, index) => (
            <div
              className="brigada-team-member"
              key={`${brigada.id}-${funcionesEquipo[index].key}`}
            >
              <AvatarPersonal persona={persona} />

              <span>
                {persona
                  ? funcionesEquipo[index].key === "enfermero1"
                    ? "Enfermero 1"
                    : funcionesEquipo[index].key === "enfermero2"
                      ? "Enfermero 2"
                      : funcionesEquipo[index].label
                  : "Pendiente"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen */}

      <div className="brigada-card-summary">

        <div className="brigada-summary-item">
          <span className="material-symbols-rounded">
            person_check
          </span>

          <div>
            <small>Integrantes</small>
            <strong>{integrantes.length} de 5</strong>
          </div>
        </div>

        <div className="brigada-summary-item">
          <span className="material-symbols-rounded">
            location_on
          </span>

          <div>
            <small>Localidades</small>
            <strong>{localidadesCount}</strong>
          </div>
        </div>

      </div>

      {/* Acciones */}

      <div className="brigada-card-actions">
        <button
          type="button"
          className="brigada-button-details"
          onClick={() => onVerDetalles(brigada)}
        >
          <span className="material-symbols-rounded">
            visibility
          </span>

          Ver detalles
        </button>

        <button
          type="button"
          className="brigada-button-edit"
          onClick={() => onEditar(brigada)}
        >
          <span className="material-symbols-rounded">
            edit
          </span>

          Editar
        </button>
      </div>

    </article>
  );
}

// Formulario de brigada

function BrigadaForm({
  brigada,
  campanias,
  guardando,
  onGuardar,
  onCerrar,
}) {
  const [formulario, setFormulario] = useState(() => ({
    campania_id: brigada?.campania_id
      ? String(brigada.campania_id)
      : "",
    codigo: brigada?.codigo || "",
    nombre: brigada?.nombre || "",
    descripcion: brigada?.descripcion || "",
    estado: brigada?.estado || "disponible",
  }));

  const [error, setError] = useState("");

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

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
  };

  const enviarFormulario = async (evento) => {
    evento.preventDefault();
    setError("");

    if (
      brigada &&
      ["terminada", "cancelada"].includes(brigada.estado) &&
      formulario.estado !== brigada.estado
    ) {
      setError(
        "No se puede cambiar el estado de una brigada terminada o cancelada."
      );
      return;
    }

    if (!brigada && !formulario.campania_id) {
      setError("Debes seleccionar una campaña.");
      return;
    }

    if (!formulario.codigo.trim()) {
      setError("El código de la brigada es obligatorio.");
      return;
    }

    if (!formulario.nombre.trim()) {
      setError("El nombre de la brigada es obligatorio.");
      return;
    }

    const datos = {
      codigo: formulario.codigo.trim(),
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim() || null,
      estado: formulario.estado,
    };

    if (!brigada) {
      datos.campania_id = Number(formulario.campania_id);
    }

    try {
      await onGuardar(datos);
    } catch (errorGuardar) {
      setError(
        obtenerMensajeError(
          errorGuardar,
          "No fue posible guardar la brigada."
        )
      );
    }
  };

  return (
    <div
      className="brigada-modal-overlay"
      onMouseDown={(evento) => {
        if (
          evento.target === evento.currentTarget &&
          !guardando
        ) {
          onCerrar();
        }
      }}
    >
      <section
        className="brigada-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brigada-form-title"
      >

        <header className="brigada-modal-header">
          <div>
            <span className="brigada-modal-eyebrow">
              GESTIÓN DE BRIGADAS
            </span>

            <h2 id="brigada-form-title">
              {brigada ? "Editar brigada" : "Nueva brigada"}
            </h2>

            <p>
              {brigada
                ? "Actualiza la información general del equipo."
                : "Registra un nuevo equipo de trabajo para una campaña."}
            </p>
          </div>

          <button
            type="button"
            className="brigada-modal-close"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar formulario"
          >
            <span className="material-symbols-rounded">
              close
            </span>
          </button>
        </header>

        <form onSubmit={enviarFormulario}>

          <div className="brigada-modal-body">

            {error && (
              <div className="brigada-form-error" role="alert">
                <span className="material-symbols-rounded">
                  error
                </span>

                {error}
              </div>
            )}

            <div className="brigada-form-section">
              <h3>Información general</h3>

              <div className="brigada-form-grid">

                <label className="brigada-field brigada-field-full">
                  <span>Campaña <b>*</b></span>

                  <select
                    name="campania_id"
                    value={formulario.campania_id}
                    onChange={cambiarCampo}
                    required
                    disabled={guardando || Boolean(brigada)}
                  >
                    <option value="">
                      Selecciona una campaña
                    </option>

                    {campanias.map((campania) => (
                      <option
                        key={campania.id}
                        value={String(campania.id)}
                      >
                        {campania.codigo} · {campania.nombre}
                      </option>
                    ))}
                  </select>

                  {brigada && (
                    <small>
                      La campaña de una brigada registrada no se modifica.
                    </small>
                  )}
                </label>

                <label className="brigada-field">
                  <span>Código <b>*</b></span>

                  <input
                    name="codigo"
                    value={formulario.codigo}
                    onChange={cambiarCampo}
                    placeholder="Ej. BRI-011"
                    maxLength={30}
                    required
                    disabled={guardando}
                  />
                </label>

                <label className="brigada-field">
                  <span>Estado</span>

                  <select
                    name="estado"
                    value={formulario.estado}
                    onChange={cambiarCampo}
                    disabled={guardando}
                  >
                    <option value="disponible">Disponible</option>
                    <option value="asignada">Asignada</option>
                    <option value="en_ruta">En ruta</option>
                    <option value="en_visita">En visita</option>
                    <option value="terminada">Terminada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </label>

                <label className="brigada-field brigada-field-full">
                  <span>Nombre de la brigada <b>*</b></span>

                  <input
                    name="nombre"
                    value={formulario.nombre}
                    onChange={cambiarCampo}
                    placeholder="Nombre del equipo"
                    maxLength={120}
                    required
                    disabled={guardando}
                  />
                </label>

                <label className="brigada-field brigada-field-full">
                  <span>Descripción</span>

                  <textarea
                    name="descripcion"
                    value={formulario.descripcion}
                    onChange={cambiarCampo}
                    placeholder="Describe las actividades de esta brigada..."
                    rows={4}
                    maxLength={5000}
                    disabled={guardando}
                  />
                </label>

              </div>
            </div>

            <div className="brigada-form-note">
              <span className="material-symbols-rounded">
                groups
              </span>

              <p>
                Cada brigada está integrada por cinco personas:
                un responsable, un médico, dos enfermeros y un conductor.
              </p>
            </div>

          </div>

          <footer className="brigada-modal-footer">

            <button
              type="button"
              className="brigada-button-light"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="brigada-button-primary"
              disabled={guardando}
            >
              <span className="material-symbols-rounded">
                {guardando ? "hourglass_top" : "save"}
              </span>

              {guardando ? "Guardando..." : "Guardar brigada"}
            </button>

          </footer>

        </form>
      </section>
    </div>
  );
}

// Formulario de integrantes

function BrigadaEquipoForm({
  brigada,
  personal,
  guardando,
  onGuardar,
  onCerrar,
}) {
  const integrantesActuales = brigada.integrantes || [];

  const enfermerosActuales = integrantesActuales.filter(
    (persona) => persona.funcion === "enfermero"
  );

  const [seleccionados, setSeleccionados] = useState(() => ({
    responsable:
      String(
        integrantesActuales.find(
          (persona) => persona.funcion === "responsable"
        )?.personal_id || ""
      ),

    medico:
      String(
        integrantesActuales.find(
          (persona) => persona.funcion === "medico"
        )?.personal_id || ""
      ),

    enfermero1: String(enfermerosActuales[0]?.personal_id || ""),

    enfermero2: String(enfermerosActuales[1]?.personal_id || ""),

    conductor:
      String(
        integrantesActuales.find(
          (persona) => persona.funcion === "conductor"
        )?.personal_id || ""
      ),
  }));

  const [error, setError] = useState("");

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

  const cambiarIntegrante = (key, value) => {
    setSeleccionados((actuales) => ({
      ...actuales,
      [key]: value,
    }));
  };

  const candidatos = (rolId) =>
    personal.filter(
      (persona) =>
        persona.estado === "activo" &&
        Number(persona.rol_id) === rolId
    );

  const enviarFormulario = async (evento) => {
    evento.preventDefault();
    setError("");

    const valores = Object.values(seleccionados);

    if (valores.some((valor) => !valor)) {
      setError("Debes seleccionar a los cinco integrantes.");
      return;
    }

    if (new Set(valores).size !== 5) {
      setError("No puedes seleccionar a la misma persona dos veces.");
      return;
    }

    const integrantes = funcionesEquipo.map((campo) => {
      const key = campo.key;

      return {
        personal_id: Number(seleccionados[key]),
        funcion: campo.funcion,
      };
    });

    try {
      await onGuardar(integrantes);
    } catch (errorGuardar) {
      setError(
        obtenerMensajeError(
          errorGuardar,
          "No fue posible asignar el equipo."
        )
      );
    }
  };

  return (
    <div
      className="brigada-modal-overlay"
      onMouseDown={(evento) => {
        if (
          evento.target === evento.currentTarget &&
          !guardando
        ) {
          onCerrar();
        }
      }}
    >
      <section
        className="brigada-modal brigada-team-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brigada-team-title"
      >

        <header className="brigada-modal-header">
          <div>
            <span className="brigada-modal-eyebrow">
              INTEGRACIÓN DEL EQUIPO
            </span>

            <h2 id="brigada-team-title">
              Integrantes de {brigada.codigo}
            </h2>

            <p>{brigada.nombre}</p>
          </div>

          <button
            type="button"
            className="brigada-modal-close"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
          >
            <span className="material-symbols-rounded">
              close
            </span>
          </button>
        </header>

        <form onSubmit={enviarFormulario}>

          <div className="brigada-modal-body">

            {error && (
              <div className="brigada-form-error" role="alert">
                <span className="material-symbols-rounded">
                  error
                </span>

                {error}
              </div>
            )}

            <div className="brigada-team-intro">
              <span className="material-symbols-rounded">
                groups
              </span>

              <div>
                <strong>Composición del equipo</strong>

                <p>
                  Selecciona cinco personas activas.
                  Los candidatos se filtran automáticamente por rol.
                </p>
              </div>
            </div>

            <div className="brigada-team-form-list">

              {funcionesEquipo.map((campo, index) => {
                const opciones = candidatos(campo.rol_id);

                return (
                  <div
                    className="brigada-team-form-field"
                    key={campo.key}
                  >
                    <div className="brigada-team-form-number">
                      {index + 1}
                    </div>

                    <div className="brigada-team-form-content">
                      <label htmlFor={`integrante-${campo.key}`}>
                        {campo.label}
                      </label>

                      <select
                        id={`integrante-${campo.key}`}
                        value={seleccionados[campo.key]}
                        onChange={(evento) =>
                          cambiarIntegrante(
                            campo.key,
                            evento.target.value
                          )
                        }
                        disabled={guardando}
                        required
                      >
                        <option value="">
                          Selecciona una persona
                        </option>

                        {opciones.map((persona) => {
                          const id = String(persona.id);

                          const yaSeleccionado = Object.entries(
                            seleccionados
                          ).some(
                            ([otraClave, otroId]) =>
                              otraClave !== campo.key &&
                              otroId === id
                          );

                          return (
                            <option
                              key={persona.id}
                              value={id}
                              disabled={yaSeleccionado}
                            >
                              {obtenerNombreCompleto(persona)}
                              {" · "}
                              {persona.numero_empleado || `ID ${persona.id}`}
                            </option>
                          );
                        })}
                      </select>

                      <small>
                        {opciones.length} candidatos activos disponibles.
                      </small>
                    </div>

                    <span className="material-symbols-rounded brigada-team-function-icon">
                      {campo.icono}
                    </span>
                  </div>
                );
              })}

            </div>

            <div className="brigada-form-note">
              <span className="material-symbols-rounded">
                info
              </span>

              <p>
                Guardar el equipo reemplazará la integración anterior
                de esta brigada.
              </p>
            </div>

          </div>

          <footer className="brigada-modal-footer">

            <button
              type="button"
              className="brigada-button-light"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="brigada-button-primary"
              disabled={guardando}
            >
              <span className="material-symbols-rounded">
                {guardando ? "hourglass_top" : "save"}
              </span>

              {guardando ? "Guardando..." : "Guardar equipo"}
            </button>

          </footer>

        </form>
      </section>
    </div>
  );
}

// Modal de detalles

function BrigadaDetalle({
  brigada,
  onCerrar,
  onEditar,
  onEditarEquipo,
}) {
  const integrantes = brigada.integrantes || [];
  const localidades = brigada.localidades || [];

  return (
    <div
      className="brigada-modal-overlay"
      onClick={onCerrar}
    >
      <section
        className="brigada-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brigada-detail-title"
        onClick={(evento) => evento.stopPropagation()}
      >

        <header className="brigada-detail-header">
          <div className="brigada-detail-campaign">
            <IconoCampania brigada={brigada} />

            <div>
              <span>DETALLES DE BRIGADA</span>

              <small>
                {brigada.campania_codigo} · {brigada.campania_nombre}
              </small>
            </div>
          </div>

          <button
            type="button"
            className="brigada-modal-close"
            onClick={onCerrar}
            aria-label="Cerrar detalles"
          >
            <span className="material-symbols-rounded">
              close
            </span>
          </button>
        </header>

        <div className="brigada-detail-body">

          <div className="brigada-detail-title-row">
            <div>
              <span className="brigada-code">
                {brigada.codigo}
              </span>

              <h2 id="brigada-detail-title">
                {brigada.nombre}
              </h2>
            </div>

            <span className={`brigada-status ${brigada.estado}`}>
              {nombresEstados[brigada.estado] || brigada.estado}
            </span>
          </div>

          <p className="brigada-detail-description">
            {brigada.descripcion || "Sin descripción disponible."}
          </p>

          {/* Equipo */}

          <section className="brigada-detail-section">
            <div className="brigada-detail-section-heading">
              <div>
                <span className="material-symbols-rounded">
                  groups
                </span>

                <h3>Equipo de trabajo</h3>
              </div>

              <button
                type="button"
                onClick={onEditarEquipo}
              >
                <span className="material-symbols-rounded">
                  edit
                </span>

                Editar equipo
              </button>
            </div>

            {integrantes.length > 0 ? (
              <div className="brigada-detail-members">
                {funcionesEquipo.map((campo) => {
                  const persona = campo.key === "enfermero1"
                    ? integrantes.filter(
                        (p) => p.funcion === "enfermero"
                      )[0]
                    : campo.key === "enfermero2"
                      ? integrantes.filter(
                          (p) => p.funcion === "enfermero"
                        )[1]
                      : integrantes.find(
                          (p) => p.funcion === campo.funcion
                        );

                  return (
                    <div
                      className="brigada-detail-member"
                      key={campo.key}
                    >
                      <AvatarPersonal
                        persona={persona}
                        className="brigada-detail-avatar"
                      />

                      <div>
                        <strong>
                          {obtenerNombreCompleto(persona)}
                        </strong>

                        <small>{campo.label}</small>

                        {persona?.numero_empleado && (
                          <small>{persona.numero_empleado}</small>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="brigada-detail-empty">
                <span className="material-symbols-rounded">
                  person_add
                </span>

                <p>Aún no se han asignado integrantes.</p>

                <button type="button" onClick={onEditarEquipo}>
                  Integrar equipo
                </button>
              </div>
            )}
          </section>

          {/* Localidades */}

          <section className="brigada-detail-section">
            <div className="brigada-detail-section-heading">
              <div>
                <span className="material-symbols-rounded">
                  location_on
                </span>

                <h3>Localidades asignadas</h3>
              </div>

              <span className="brigada-detail-count">
                {localidades.length}
              </span>
            </div>

            {localidades.length > 0 ? (
              <div className="brigada-detail-localities">
                {localidades.map((localidad) => (
                  <div
                    className="brigada-locality-item"
                    key={localidad.id}
                  >
                    <span className="material-symbols-rounded">
                      location_on
                    </span>

                    <div>
                      <strong>{localidad.nombre}</strong>

                      <small>
                        {localidad.codigo || "Localidad"}
                        {localidad.municipio
                          ? ` · ${localidad.municipio}`
                          : ""}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="brigada-detail-empty compact">
                <span className="material-symbols-rounded">
                  location_off
                </span>

                <p>No hay localidades asignadas todavía.</p>
              </div>
            )}
          </section>

        </div>

        <footer className="brigada-detail-footer">
          <button
            type="button"
            className="brigada-button-light"
            onClick={onCerrar}
          >
            Cerrar
          </button>

          <button
            type="button"
            className="brigada-button-primary"
            onClick={onEditar}
          >
            <span className="material-symbols-rounded">
              edit
            </span>

            Editar brigada
          </button>
        </footer>

      </section>
    </div>
  );
}

// Página principal

export default function Brigadas() {

  // Estados principales

  const [brigadas, setBrigadas] = useState([]);
  const [campanias, setCampanias] = useState([]);
  const [personal, setPersonal] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Filtros

  const [busqueda, setBusqueda] = useState("");
  const [filtroCampania, setFiltroCampania] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // Modales

  const [modalFormulario, setModalFormulario] = useState(false);
  const [brigadaEditar, setBrigadaEditar] = useState(null);

  const [modalEquipo, setModalEquipo] = useState(null);
  const [brigadaDetalle, setBrigadaDetalle] = useState(null);

  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Cargar información

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError("");

      const [
        respuestaBrigadas,
        respuestaCampanias,
        respuestaPersonal,
      ] = await Promise.all([
        obtenerBrigadas(),
        obtenerCampanias(),
        obtenerPersonal(),
      ]);

      setBrigadas(extraerLista(respuestaBrigadas));
      setCampanias(extraerLista(respuestaCampanias));
      setPersonal(extraerLista(respuestaPersonal));

    } catch (errorCarga) {
      console.error("Error al cargar brigadas:", errorCarga);

      setError(
        obtenerMensajeError(
          errorCarga,
          "No fue posible cargar la información de brigadas."
        )
      );

    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let componenteActivo = true;

    const cargar = async () => {
      await cargarDatos();

      if (!componenteActivo) return;
    };

    cargar();

    return () => {
      componenteActivo = false;
    };
  }, [cargarDatos]);

  // Limpiar mensajes

  useEffect(() => {
    if (!mensaje) return;

    const temporizador = setTimeout(() => {
      setMensaje("");
    }, 3500);

    return () => clearTimeout(temporizador);
  }, [mensaje]);

  // Filtrar brigadas

  const brigadasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return brigadas.filter((brigada) => {

      const coincideCampania =
        filtroCampania === "todos" ||
        String(brigada.campania_id) === filtroCampania;

      const coincideEstado =
        filtroEstado === "todos" ||
        brigada.estado === filtroEstado;

      const coincideBusqueda =
        !texto ||
        [
          brigada.codigo,
          brigada.nombre,
          brigada.campania_nombre,
        ]
          .filter(Boolean)
          .some((valor) =>
            String(valor).trim().toLowerCase().startsWith(texto)
          );

      return (
        coincideCampania &&
        coincideEstado &&
        coincideBusqueda
      );
    });
  }, [
    brigadas,
    busqueda,
    filtroCampania,
    filtroEstado,
  ]);

  // Agrupar por campaña

  const gruposCampanias = useMemo(() => {
    const grupos = new Map();

    brigadasFiltradas.forEach((brigada) => {
      const clave = String(brigada.campania_id);

      if (!grupos.has(clave)) {
        const campania = campanias.find(
          (item) => Number(item.id) === Number(brigada.campania_id)
        );

        grupos.set(clave, {
          id: clave,
          codigo: brigada.campania_codigo || campania?.codigo || "",
          nombre: brigada.campania_nombre || campania?.nombre || "Campaña",
          categoria:
            brigada.campania_categoria ||
            campania?.categoria ||
            "humana",
          icono:
            brigada.campania_icono ||
            campania?.icono ||
            "",
          brigadas: [],
        });
      }

      grupos.get(clave).brigadas.push(brigada);
    });

    return [...grupos.values()].sort((a, b) =>
      a.codigo.localeCompare(b.codigo, "es", {
        numeric: true,
      })
    );
  }, [brigadasFiltradas, campanias]);

  // Estadísticas

  const estadisticas = useMemo(() => ({
  total: brigadas.length,

    disponibles: brigadas.filter(
      (b) => b.estado === "disponible"
    ).length,

    asignadas: brigadas.filter(
      (b) => b.estado === "asignada"
    ).length,

    enActividad: brigadas.filter(
      (b) => ["en_ruta", "en_visita"].includes(b.estado)
    ).length,

  }), [brigadas]);

  // Abrir formularios

  const abrirNueva = () => {
    setBrigadaEditar(null);
    setError("");
    setModalFormulario(true);
  };

  const abrirEdicion = (brigada) => {
    setBrigadaEditar(brigada);
    setBrigadaDetalle(null);
    setError("");
    setModalFormulario(true);
  };

  const cerrarFormulario = () => {
    if (guardando) return;

    setModalFormulario(false);
    setBrigadaEditar(null);
  };

// Guardar brigada

const guardarBrigada = async (datos) => {
  try {
    setGuardando(true);
    setError("");

    if (brigadaEditar) {
      await actualizarBrigada(brigadaEditar.id, datos);

      setMensaje("La brigada se actualizó correctamente.");
    } else {
      await crearBrigada(datos);

      setMensaje("La brigada se registró correctamente.");
    }

    setModalFormulario(false);
    setBrigadaEditar(null);

    await cargarDatos();

  } catch (errorGuardar) {
    setError(
      obtenerMensajeError(
        errorGuardar,
        "No fue posible guardar la brigada."
      )
    );

    throw errorGuardar;

  } finally {
    setGuardando(false);
  }
};

// Consultar detalles

const verDetalles = async (brigada) => {
  try {
    setCargandoDetalle(true);
    setError("");

    const respuesta = await obtenerBrigadaPorId(brigada.id);

    setBrigadaDetalle(respuesta.datos || respuesta);

  } catch (errorDetalle) {
    setError(
      obtenerMensajeError(
        errorDetalle,
        "No fue posible consultar los detalles de la brigada."
      )
    );

  } finally {
    setCargandoDetalle(false);
  }
};


const guardarEquipo = async (integrantes) => {
  if (!modalEquipo) return;

  try {
    setGuardando(true);
    setError("");

    const respuesta = await asignarIntegrantes(
      modalEquipo.id,
      integrantes
    );

    const brigadaActualizada = respuesta.datos || respuesta;

    setBrigadas((actuales) =>
      actuales.map((brigada) =>
        Number(brigada.id) === Number(brigadaActualizada.id)
          ? brigadaActualizada
          : brigada
      )
    );

    setModalEquipo(null);

    setMensaje("El equipo de trabajo se actualizó correctamente.");

  } catch (errorEquipo) {
    setError(
      obtenerMensajeError(
        errorEquipo,
        "No fue posible actualizar el equipo."
      )
    );

    throw errorEquipo;

  } finally {
    setGuardando(false);
  }
};

const abrirEdicionEquipo = () => {
  setModalEquipo(brigadaDetalle);
  setBrigadaDetalle(null);
};

const limpiarFiltros = () => {
  setBusqueda("");
  setFiltroCampania("todos");
  setFiltroEstado("todos");
};


return (
  <main className="brigadas-page">

    {/* EncabezadO */}

    <PageHeader
      titulo="Brigadas"
      descripcion="Administra los equipos de trabajo y su integración en las campañas de vacunación."
      accion="Nueva brigada"
      onAccion={abrirNueva}
    />

    {/* Mensajes */}

    {mensaje && (
      <div className="brigadas-feedback success">
        <span className="material-symbols-rounded">
          check_circle
        </span>

        {mensaje}
      </div>
    )}

    {error && (
      <div className="brigadas-feedback error">
        <span className="material-symbols-rounded">
          error
        </span>

        {error}

        <button
          type="button"
          onClick={() => setError("")}
          aria-label="Cerrar mensaje"
        >
          <span className="material-symbols-rounded">
            close
          </span>
        </button>
      </div>
    )}

    {/* Estadísticas */}

    <section className="brigadas-stats">

      <article className="brigada-stat-card">
        <div className="brigada-stat-icon total">
          <span className="material-symbols-rounded">
            groups
          </span>
        </div>

        <div>
          <small>Total de brigadas</small>
          <strong>{estadisticas.total}</strong>
        </div>
      </article>

      <article className="brigada-stat-card">
        <div className="brigada-stat-icon available">
          <span className="material-symbols-rounded">
            check_circle
          </span>
        </div>

        <div>
          <small>Disponibles</small>
          <strong>{estadisticas.disponibles}</strong>
        </div>
      </article>

      <article className="brigada-stat-card">
        <div className="brigada-stat-icon assigned">
          <span className="material-symbols-rounded">
            assignment_ind
          </span>
        </div>

        <div>
          <small>Asignadas</small>
          <strong>{estadisticas.asignadas}</strong>
        </div>
      </article>

      <article className="brigada-stat-card">
        <div className="brigada-stat-icon activity">
          <span className="material-symbols-rounded">
            route
          </span>
        </div>

        <div>
          <small>En actividad</small>
          <strong>{estadisticas.enActividad}</strong>
        </div>
      </article>

    </section>

    {/* Filtros */}

    <section className="brigadas-filters">

      <div className="brigadas-filters-grid">

        <label className="brigadas-filter-field search">
          <span>Buscar brigada</span>

          <div className="brigadas-search-input">
            <span className="material-symbols-rounded">
              search
            </span>

            <input
              type="search"
              placeholder="Código, nombre o integrante..."
              value={busqueda}
              onChange={(evento) =>
                setBusqueda(evento.target.value)
              }
            />
          </div>
        </label>

        <label className="brigadas-filter-field">
          <span>Campaña</span>

          <select
            value={filtroCampania}
            onChange={(evento) =>
              setFiltroCampania(evento.target.value)
            }
          >
            <option value="todos">Todas las campañas</option>

            {campanias.map((campania) => (
              <option
                key={campania.id}
                value={String(campania.id)}
              >
                {campania.codigo} · {campania.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="brigadas-filter-field">
          <span>Estado</span>

          <select
            value={filtroEstado}
            onChange={(evento) =>
              setFiltroEstado(evento.target.value)
            }
          >
            <option value="todos">Todos los estados</option>
            <option value="todos">Todos los estados</option>
            <option value="disponible">Disponible</option>
            <option value="asignada">Asignada</option>
            <option value="en_ruta">En ruta</option>
            <option value="en_visita">En visita</option>
            <option value="terminada">Terminada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </label>

      </div>

      <div className="brigadas-filters-footer">
        <span>
          {brigadasFiltradas.length}{" "}
          {brigadasFiltradas.length === 1
            ? "brigada encontrada"
            : "brigadas encontradas"}
        </span>

        <button
          type="button"
          onClick={limpiarFiltros}
        >
          <span className="material-symbols-rounded">
            filter_alt_off
          </span>

          Limpiar filtros
        </button>
      </div>

    </section>

    {/* Listado */}

    {cargando ? (

      <div className="brigadas-loading">
        <span className="material-symbols-rounded">
          progress_activity
        </span>

        <p>Cargando brigadas...</p>
      </div>

    ) : brigadasFiltradas.length === 0 ? (

      <div className="brigadas-empty">
        <span className="material-symbols-rounded">
          groups
        </span>

        <h3>No se encontraron brigadas</h3>

        <p>
          Ajusta los filtros o registra una nueva brigada.
        </p>

        <button
          type="button"
          className="brigada-button-primary"
          onClick={abrirNueva}
        >
          <span className="material-symbols-rounded">
            add
          </span>

          Nueva brigada
        </button>
      </div>

    ) : (

      <div className="brigadas-campaign-groups">

        {gruposCampanias.map((grupo) => (
          <section
            className="brigadas-campaign-section"
            key={grupo.id}
          >

            <header className="brigadas-campaign-heading">

              <div className={`brigadas-campaign-heading-icon ${grupo.categoria}`}>
                <span className="material-symbols-rounded">
                  {grupo.categoria === "veterinaria"
                    ? "pets"
                    : "vaccines"}
                </span>
              </div>

              <div className="brigadas-campaign-heading-text">
                <span>{grupo.codigo}</span>

                <h2>{grupo.nombre}</h2>

                <p>
                  Brigadas participantes en esta campaña.
                </p>
              </div>

              <div className="brigadas-campaign-count">
                {grupo.brigadas.length}{" "}
                {grupo.brigadas.length === 1
                  ? "brigada"
                  : "brigadas"}
              </div>

            </header>

            <div className="brigadas-grid">

              {grupo.brigadas.map((brigada) => (
                <BrigadaCard
                  key={brigada.id}
                  brigada={brigada}
                  onVerDetalles={verDetalles}
                  onEditar={abrirEdicion}
                />
              ))}

            </div>

          </section>
        ))}

      </div>
    )}

    {/* Formulario de brigada */}

    {modalFormulario && (
      <BrigadaForm
        key={brigadaEditar?.id || "nueva"}
        brigada={brigadaEditar}
        campanias={campanias}
        guardando={guardando}
        onGuardar={guardarBrigada}
        onCerrar={cerrarFormulario}
      />
    )}

    {/* Formulario de equipo */}

    {modalEquipo && (
      <BrigadaEquipoForm
        key={modalEquipo.id}
        brigada={modalEquipo}
        personal={personal}
        guardando={guardando}
        onGuardar={guardarEquipo}
        onCerrar={() => {
          if (!guardando) setModalEquipo(null);
        }}
      />
    )}

    {/* Detalles */}

    {cargandoDetalle && (
      <div className="brigada-detail-loading">
        <span className="material-symbols-rounded">
          progress_activity
        </span>

        <p>Consultando información de la brigada...</p>
      </div>
    )}

    {brigadaDetalle && (
      <BrigadaDetalle
        brigada={brigadaDetalle}
        onCerrar={() => setBrigadaDetalle(null)}
        onEditar={() => abrirEdicion(brigadaDetalle)}
        onEditarEquipo={abrirEdicionEquipo}
      />
    )}

  </main>
);
}