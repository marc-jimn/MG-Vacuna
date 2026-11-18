import { useEffect, useState } from "react";

import PageHeader from "../../components/PageHeader/PageHeader";
import PersonalForm from "./PersonalForm";

import {
  obtenerPersonal,
  crearPersonal,
  actualizarPersonal,
  subirFotoPersonal,
} from "../../services/personalService";

import "./Personal.css";

function Personal() {
  const [personal, setPersonal] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [personaEditar, setPersonaEditar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Cargar todo el personal desde el servidor
  const cargarPersonal = async () => {
    try {
      setCargando(true);
      setError("");

      const respuesta = await obtenerPersonal();

      setPersonal(respuesta.datos || []);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.mensaje ||
        "No fue posible cargar el personal."
      );
    } finally {
      setCargando(false);
    }
  };

  // Cargar registros una sola vez al entrar al módulo
  useEffect(() => {
    let componenteActivo = true;

    obtenerPersonal()
      .then((respuesta) => {
        if (componenteActivo) {
          setPersonal(respuesta.datos || []);
          setError("");
        }
      })
      .catch((error) => {
        console.error(error);

        if (componenteActivo) {
          setError(
            error.response?.data?.mensaje ||
            "No fue posible cargar el personal."
          );
        }
      })
      .finally(() => {
        if (componenteActivo) {
          setCargando(false);
        }
      });

    return () => {
      componenteActivo = false;
    };
  }, []);

  // Abrir formulario para registrar
  const abrirNuevo = () => {
    setPersonaEditar(null);
    setMensaje("");
    setMostrarFormulario(true);
  };

  // Abrir formulario para editar
  const abrirEdicion = (persona) => {
    setPersonaEditar(persona);
    setMensaje("");
    setMostrarFormulario(true);
  };

  // Cerrar formulario
  const cerrarFormulario = () => {
    if (guardando) return;

    setMostrarFormulario(false);
    setPersonaEditar(null);
  };

  // Guardar o actualizar personal
  const guardarPersonal = async (datos, foto) => {
    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      let resultado;

      if (personaEditar) {
        resultado = await actualizarPersonal(
          personaEditar.id,
          datos
        );
      } else {
        resultado = await crearPersonal(datos);
      }

      const personaGuardada = resultado.datos;
      let avisoFoto = "";

      if (foto && personaGuardada?.id) {
        try {
          await subirFotoPersonal(personaGuardada.id, foto);
        } catch (errorFoto) {
          console.error(errorFoto);

          avisoFoto =
            " El registro se guardó, pero no se pudo subir la fotografía.";
        }
      }

      setMostrarFormulario(false);
      setPersonaEditar(null);

      await cargarPersonal();

      setMensaje(
        (personaEditar
          ? "Personal actualizado correctamente."
          : "Personal registrado correctamente.") + avisoFoto
      );
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.mensaje ||
        "No fue posible guardar la información."
      );
    } finally {
      setGuardando(false);
    }
  };

  // Obtener totales por estado
  const totalActivos = personal.filter(
    (persona) => persona.estado === "activo"
  ).length;

  const totalVacaciones = personal.filter(
    (persona) => persona.estado === "vacaciones"
  ).length;

  const totalBajas = personal.filter(
    (persona) => persona.estado === "baja"
  ).length;

  // Obtener nombre completo
  const obtenerNombreCompleto = (persona) =>
    [
      persona.nombres,
      persona.apellido_paterno,
      persona.apellido_materno,
    ]
      .filter(Boolean)
      .join(" ");

  // Filtro combinado de búsqueda y estado
  const personalFiltrado = [...personal]
  .sort((a, b) => Number(a.id) - Number(b.id))
  .filter((persona) => {
    const termino = busqueda.trim().toLowerCase();

    const nombreCompleto = obtenerNombreCompleto(persona);

    const coincideBusqueda = [
      nombreCompleto,
      persona.nombres,
      persona.apellido_paterno,
      persona.apellido_materno,
      persona.numero_empleado,
      persona.curp,
      persona.telefono,
      persona.correo,
      persona.rol_nombre,
    ]
      .filter(Boolean)
      .some((valor) =>
        String(valor).toLowerCase().includes(termino)
      );

    const coincideEstado =
      !estadoFiltro || persona.estado === estadoFiltro;

    return coincideBusqueda && coincideEstado;
  });

  return (
    <div className="personal-page">
      <PageHeader
        titulo="Personal"
        descripcion="Administra y consulta al personal registrado en la plataforma."
        accion="Agregar personal"
        onAccion={abrirNuevo}
      />

      {mensaje && (
        <div className="personal-feedback success-feedback">
          <span className="material-symbols-rounded">
            check_circle
          </span>
          {mensaje}
        </div>
      )}

      {error && (
        <div className="personal-feedback error-feedback">
          <span className="material-symbols-rounded">
            error
          </span>
          {error}
        </div>
      )}

      <section className="personal-stats">
        <article className="personal-stat-card">
          <span className="personal-stat-icon total">
            <span className="material-symbols-rounded">
              groups
            </span>
          </span>
          <div>
            <small>Personal encontrado</small>
            <strong>{personalFiltrado.length}</strong>
          </div>
        </article>

        <article className="personal-stat-card">
          <span className="personal-stat-icon active">
            <span className="material-symbols-rounded">
              check_circle
            </span>
          </span>
          <div>
            <small>Activos</small>
            <strong>{totalActivos}</strong>
          </div>
        </article>

        <article className="personal-stat-card">
          <span className="personal-stat-icon vacation">
            <span className="material-symbols-rounded">
              beach_access
            </span>
          </span>
          <div>
            <small>Vacaciones</small>
            <strong>{totalVacaciones}</strong>
          </div>
        </article>

        <article className="personal-stat-card">
          <span className="personal-stat-icon inactive">
            <span className="material-symbols-rounded">
              person_off
            </span>
          </span>
          <div>
            <small>Bajas</small>
            <strong>{totalBajas}</strong>
          </div>
        </article>
      </section>

      <section className="personal-list-card">
        <div className="personal-list-heading">
          <div>
            <h2>Directorio de personal</h2>
            <p>
              Consulta y administra los registros del equipo.
            </p>
          </div>
        </div>

        <div className="personal-filters">
          <div className="personal-search">
            <span className="material-symbols-rounded">
              search
            </span>

            <input
              type="search"
              value={busqueda}
              onChange={(event) =>
                setBusqueda(event.target.value)
              }
              placeholder="Buscar por nombre, CURP, número de empleado o rol..."
            />
          </div>

          <select
            value={estadoFiltro}
            onChange={(event) =>
              setEstadoFiltro(event.target.value)
            }
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="vacaciones">Vacaciones</option>
            <option value="baja">Bajas</option>
          </select>
        </div>

        <div className="personal-table-wrapper">
          <table className="personal-table">
            <thead>
              <tr>
                <th>PERSONAL</th>
                <th>NÚMERO</th>
                <th>CURP</th>
                <th>ROL</th>
                <th>TELÉFONO</th>
                <th>ESTADO</th>
                <th>ACCIÓN</th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="7" className="personal-empty">
                    Cargando registros...
                  </td>
                </tr>
              ) : personalFiltrado.length === 0 ? (
                <tr>
                  <td colSpan="7" className="personal-empty">
                    No se encontraron registros de personal.
                  </td>
                </tr>
              ) : (
                personalFiltrado.map((persona) => (
                  <tr key={persona.id}>
                    <td>
                      <div className="personal-person-cell">
                        {persona.foto ? (
                          <img
                            src={`http://localhost:3000${persona.foto}`}
                            alt=""
                          />
                        ) : (
                          <span className="personal-table-avatar material-symbols-rounded">
                            account_circle
                          </span>
                        )}

                        <div>
                          <strong>
                            {obtenerNombreCompleto(persona)}
                          </strong>

                          <small>
                            {persona.correo || "Sin correo"}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>{persona.numero_empleado}</td>

                    <td>{persona.curp}</td>

                    <td>
                      <span className="personal-role">
                        {persona.rol_nombre || "Sin asignar"}
                      </span>
                    </td>

                    <td>{persona.telefono || "—"}</td>

                    <td>
                      <span
                        className={`personal-status ${persona.estado}`}
                      >
                        {persona.estado}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="personal-edit-button"
                        title="Editar personal"
                        onClick={() => abrirEdicion(persona)}
                      >
                        <span className="material-symbols-rounded">
                          edit
                        </span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {mostrarFormulario && (
        <PersonalForm
          persona={personaEditar}
          guardando={guardando}
          onGuardar={guardarPersonal}
          onCerrar={cerrarFormulario}
        />
      )}
    </div>
  );
}

export default Personal;