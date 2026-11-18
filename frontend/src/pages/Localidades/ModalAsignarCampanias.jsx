import { useEffect, useMemo, useState } from "react";

import { obtenerCampanias } from "../../services/campaniaService";

import {
  asignarCampaniasALocalidades,
} from "../../services/localidadService";

import "./ModalesLocalidades.css";

function extraerLista(respuesta) {
  if (Array.isArray(respuesta)) {
    return respuesta;
  }

  if (Array.isArray(respuesta?.datos)) {
    return respuesta.datos;
  }

  if (Array.isArray(respuesta?.data)) {
    return respuesta.data;
  }

  return [];
}

function ModalAsignarCampanias({
  localidades = [],
  onClose,
  onGuardado,
}) {
  const [campanias, setCampanias] = useState([]);
  const [campaniaSeleccionadaId, setCampaniaSeleccionadaId] =
    useState("");

  const [localidadesSeleccionadas, setLocalidadesSeleccionadas] =
    useState([]);

  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // =========================================
  // CARGAR CAMPAÑAS
  // =========================================

  useEffect(() => {
    let componenteActivo = true;

    const cargarCampanias = async () => {
      try {
        const respuesta = await obtenerCampanias();

        if (!componenteActivo) return;

        setCampanias(extraerLista(respuesta));

      } catch (err) {
        if (!componenteActivo) return;

        setError(
          err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No fue posible cargar las campañas."
        );

      } finally {
        if (componenteActivo) {
          setCargando(false);
        }
      }
    };

    void cargarCampanias();

    return () => {
      componenteActivo = false;
    };
  }, []);


  // =========================================
  // CAMBIAR CAMPAÑA SELECCIONADA
  // =========================================

  const cambiarCampania = (e) => {
    const id = e.target.value;

    setCampaniaSeleccionadaId(id);
    setError("");

    if (!id) {
      setLocalidadesSeleccionadas([]);
      return;
    }

    const idsAsignados = localidades
      .filter((localidad) =>
        Array.isArray(localidad.campanias) &&
        localidad.campanias.some(
          (campania) =>
            String(campania.id) === String(id)
        )
      )
      .map((localidad) => String(localidad.id));

    setLocalidadesSeleccionadas(idsAsignados);
  };


  // =========================================
  // FILTRAR LOCALIDADES
  // =========================================

  const localidadesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return localidades;

    return localidades.filter((localidad) => {
      const nombre = String(localidad.nombre || "").toLowerCase();
      const codigo = String(localidad.codigo || "").toLowerCase();
      const codigoPostal = String(
        localidad.codigo_postal || ""
      ).toLowerCase();

      return (
        nombre.includes(texto) ||
        codigo.includes(texto) ||
        codigoPostal.includes(texto)
      );
    });
  }, [localidades, busqueda]);


  // =========================================
  // MARCAR / DESMARCAR LOCALIDAD
  // =========================================

  const cambiarLocalidad = (id, marcada) => {
    const identificador = String(id);

    setLocalidadesSeleccionadas((anteriores) => {
      if (marcada) {
        return anteriores.includes(identificador)
          ? anteriores
          : [...anteriores, identificador];
      }

      return anteriores.filter(
        (elemento) => elemento !== identificador
      );
    });
  };


  // =========================================
  // SELECCIONAR TODAS LAS VISIBLES
  // =========================================

  const seleccionarTodas = () => {
    const idsVisibles = localidadesFiltradas.map(
      (localidad) => String(localidad.id)
    );

    setLocalidadesSeleccionadas((anteriores) => [
      ...new Set([...anteriores, ...idsVisibles]),
    ]);
  };


  // =========================================
  // LIMPIAR SELECCIÓN
  // =========================================

  const limpiarSeleccion = () => {
    setLocalidadesSeleccionadas([]);
  };


  // =========================================
  // GUARDAR ASIGNACIONES
  // =========================================

  const guardarAsignaciones = async () => {
    if (!campaniaSeleccionadaId) {
      setError("Selecciona una campaña para continuar.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      await asignarCampaniasALocalidades(
        Number(campaniaSeleccionadaId),
        localidadesSeleccionadas.map(Number)
      );

      await onGuardado();

      onClose();

    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        err.message ||
        "No fue posible guardar las asignaciones."
      );

    } finally {
      setGuardando(false);
    }
  };


  // =========================================
  // CAMPAÑA ACTUAL
  // =========================================

  const campaniaActual = campanias.find(
    (campania) =>
      String(campania.id) === String(campaniaSeleccionadaId)
  );

  const cantidadSeleccionada = localidadesSeleccionadas.length;


  // =========================================
  // RENDERIZADO
  // =========================================

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
        className="modal-localidades modal-asignacion-campanias"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-asignacion-titulo"
      >

        <header className="modal-localidades-header">
          <div className="modal-localidades-heading">

            <div className="modal-localidades-icon modal-icon-purple">
              <span className="material-symbols-rounded">
                campaign
              </span>
            </div>

            <div>
              <h2 id="modal-asignacion-titulo">
                Asignar campañas
              </h2>

              <p>
                Define en qué localidades se desarrollará cada campaña.
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


        <div className="modal-localidades-body">

          {error && (
            <div className="modal-localidades-error">
              <span className="material-symbols-rounded">
                error
              </span>
              {error}
            </div>
          )}

          <div className="modal-localidad-field">
            <label htmlFor="asignacion-campania">
              Selecciona una campaña <span>*</span>
            </label>

            <select
              id="asignacion-campania"
              value={campaniaSeleccionadaId}
              onChange={cambiarCampania}
              disabled={cargando || guardando}
            >
              <option value="">
                {cargando
                  ? "Cargando campañas..."
                  : "Selecciona una campaña"}
              </option>

              {campanias.map((campania) => (
                <option
                  key={campania.id}
                  value={campania.id}
                >
                  {campania.nombre} · {campania.estado}
                </option>
              ))}
            </select>
          </div>


          {campaniaActual && (
            <div className="asignacion-campania-resumen">
              <div className="asignacion-campania-resumen-icon">
                <span className="material-symbols-rounded">
                  event_note
                </span>
              </div>

              <div>
                <strong>{campaniaActual.nombre}</strong>

                <span>
                  {campaniaActual.codigo || "Sin código"} ·{" "}
                  {campaniaActual.categoria === "humana"
                    ? "Humana"
                    : campaniaActual.categoria === "veterinaria"
                      ? "Veterinaria"
                      : "Sin categoría"}
                </span>
              </div>

              <span className={`asignacion-estado asignacion-estado-${campaniaActual.estado}`}>
                {campaniaActual.estado}
              </span>
            </div>
          )}


          <div className="asignacion-localidades-heading">
            <div>
              <h3>Localidades participantes</h3>

              <p>
                Marca todas las localidades donde se realizará esta campaña.
              </p>
            </div>

            <span className="asignacion-seleccion-counter">
              {cantidadSeleccionada} de {localidades.length}
            </span>
          </div>


          <div className="asignacion-toolbar">
            <div className="asignacion-search">
              <span className="material-symbols-rounded">
                search
              </span>

              <input
                type="text"
                placeholder="Buscar localidad..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                disabled={!campaniaSeleccionadaId || cargando}
              />
            </div>

            <div className="asignacion-toolbar-actions">
              <button
                type="button"
                onClick={seleccionarTodas}
                disabled={!campaniaSeleccionadaId || localidadesFiltradas.length === 0}
              >
                Seleccionar todas
              </button>

              <button
                type="button"
                onClick={limpiarSeleccion}
                disabled={!campaniaSeleccionadaId || cantidadSeleccionada === 0}
              >
                Limpiar
              </button>
            </div>
          </div>


          <div className="asignacion-localidades-list">

            {cargando && (
              <div className="asignacion-empty">
                Cargando campañas...
              </div>
            )}

            {!cargando && !campaniaSeleccionadaId && (
              <div className="asignacion-empty">
                <span className="material-symbols-rounded">
                  touch_app
                </span>

                Selecciona una campaña para consultar sus localidades.
              </div>
            )}

            {!cargando &&
              campaniaSeleccionadaId &&
              localidadesFiltradas.length === 0 && (
                <div className="asignacion-empty">
                  No se encontraron localidades con esa búsqueda.
                </div>
              )}

            {!cargando &&
              campaniaSeleccionadaId &&
              localidadesFiltradas.map((localidad) => {
                const id = String(localidad.id);

                const marcada = localidadesSeleccionadas.includes(id);

                return (
                  <label
                    key={id}
                    className={`asignacion-localidad-item ${marcada ? "seleccionada" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={marcada}
                      onChange={(e) =>
                        cambiarLocalidad(id, e.target.checked)
                      }
                    />

                    <span className="asignacion-checkbox-visual">
                      <span className="material-symbols-rounded">
                        check
                      </span>
                    </span>

                    <span
                      className="asignacion-localidad-color"
                      style={{
                        backgroundColor:
                          localidad.color_marcador || "#2878B8",
                      }}
                    />

                    <span className="asignacion-localidad-info">
                      <strong>{localidad.nombre}</strong>

                      <span>
                        {localidad.codigo} · {localidad.municipio}
                      </span>
                    </span>

                    <span
                      className={`asignacion-localidad-estado ${localidad.activa ? "localidad-activa" : "localidad-inactiva"}`}
                    >
                      {localidad.activa ? "Activa" : "Inactiva"}
                    </span>
                  </label>
                );
              })}

          </div>

          <div className="asignacion-nota">
            <span className="material-symbols-rounded">
              info
            </span>

            Al guardar, se reemplazarán las localidades asignadas a esta
            campaña. Las asignaciones de las demás campañas no cambiarán.
          </div>

        </div>


        <footer className="modal-localidades-footer">
          <span className="modal-form-required">
            {campaniaSeleccionadaId
              ? `${cantidadSeleccionada} localidades seleccionadas`
              : "Selecciona una campaña"}
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
              type="button"
              className="modal-button-primary"
              onClick={guardarAsignaciones}
              disabled={
                guardando ||
                cargando ||
                !campaniaSeleccionadaId
              }
            >
              <span className="material-symbols-rounded">
                {guardando ? "progress_activity" : "save"}
              </span>

              {guardando ? "Guardando..." : "Guardar asignaciones"}
            </button>

          </div>
        </footer>

      </section>
    </div>
  );
}

export default ModalAsignarCampanias;