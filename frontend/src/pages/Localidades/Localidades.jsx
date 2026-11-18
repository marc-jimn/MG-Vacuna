
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader/PageHeader";

import { obtenerLocalidades } from "../../services/localidadService";

import MapaLocalidades from "./MapaLocalidades";
import TablaLocalidades from "./TablaLocalidades";
import ModalLocalidad from "./ModalLocalidad";
import ModalAsignarCampanias from "./ModalAsignarCampanias";

import "./Localidades.css";
import "./TablaLocalidades.css";

const REGISTROS_POR_PAGINA = 8;

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

function formatearPoblacion(valor) {
  if (valor === null || valor === undefined) {
    return "Sin dato";
  }

  return Number(valor).toLocaleString("es-MX");
}

function Localidades() {
  const [localidades, setLocalidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [ordenamiento, setOrdenamiento] = useState("nombre");

  const [localidadSeleccionadaId, setLocalidadSeleccionadaId] =
    useState(null);

  const [paginaActual, setPaginaActual] = useState(1);

  // =========================================
  // ESTADOS DE LOS MODALES
  // =========================================

  const [modalAgregarAbierto, setModalAgregarAbierto] = useState(false);
  const [modalAsignacionAbierto, setModalAsignacionAbierto] = useState(false);

  // =========================================
  // CARGAR LOCALIDADES
  // =========================================

  useEffect(() => {
    let componenteActivo = true;

    const cargarLocalidades = async () => {
      try {
        const respuesta = await obtenerLocalidades();

        if (!componenteActivo) return;

        setLocalidades(extraerLista(respuesta));
        setError("");

      } catch (err) {
        if (!componenteActivo) return;

        setError(
          err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No fue posible cargar las localidades."
        );

      } finally {
        if (componenteActivo) {
          setCargando(false);
        }
      }
    };

    void cargarLocalidades();

    return () => {
      componenteActivo = false;
    };
  }, []);

  // =========================================
  // RECARGAR LOCALIDADES
  // =========================================

  const recargarLocalidades = async () => {
    try {
      const respuesta = await obtenerLocalidades();

      setLocalidades(extraerLista(respuesta));
      setError("");

    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        "No fue posible actualizar las localidades."
      );
    }
  };

  // =========================================
  // FILTRAR Y ORDENAR
  // =========================================

  const localidadesFiltradas = useMemo(() => {
    let resultado = [...localidades];

    // Búsqueda por nombre, código o código postal.
    if (busqueda.trim()) {
      const texto = busqueda.trim().toLowerCase();

      resultado = resultado.filter((localidad) => {
        const nombre = String(
          localidad.nombre || ""
        ).toLowerCase();

        const codigo = String(
          localidad.codigo || ""
        ).toLowerCase();

        const codigoPostal = String(
          localidad.codigo_postal || ""
        ).toLowerCase();

        return (
          nombre.split(/\s+/).some((palabra) => palabra.startsWith(texto)) ||
          codigo.startsWith(texto) ||
          codigoPostal.startsWith(texto)
        );
      });
    }

    // Filtrar por estado del registro.
    if (filtroEstado === "activas") {
      resultado = resultado.filter(
        (localidad) => localidad.activa === true
      );
    }

    if (filtroEstado === "inactivas") {
      resultado = resultado.filter(
        (localidad) => localidad.activa === false
      );
    }

    // Ordenamiento.
    resultado.sort((a, b) => {
      if (ordenamiento === "poblacion_desc") {
        return (
          Number(b.poblacion || 0) -
          Number(a.poblacion || 0)
        );
      }

      if (ordenamiento === "poblacion_asc") {
        return (
          Number(a.poblacion || 0) -
          Number(b.poblacion || 0)
        );
      }

      return String(a.nombre || "").localeCompare(
        String(b.nombre || ""),
        "es",
        { sensitivity: "base" }
      );
    });

    return resultado;

  }, [
    localidades,
    busqueda,
    filtroEstado,
    ordenamiento,
  ]);

  // =========================================
  // ESTADÍSTICAS
  // =========================================

  const totalLocalidades = localidades.length;

  const localidadesActivas = localidades.filter(
    (localidad) => localidad.activa === true
  ).length;

  const localidadesUbicadas = localidades.filter(
    (localidad) =>
      localidad.latitud !== null &&
      localidad.latitud !== undefined &&
      localidad.longitud !== null &&
      localidad.longitud !== undefined
  ).length;

  const poblacionTotal = localidades.reduce(
    (total, localidad) => {
      if (
        localidad.poblacion === null ||
        localidad.poblacion === undefined
      ) {
        return total;
      }

      return total + Number(localidad.poblacion || 0);
    },
    0
  );

  // =========================================
  // PAGINACIÓN
  // =========================================

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      localidadesFiltradas.length / REGISTROS_POR_PAGINA
    )
  );

  const paginaVisible = Math.min(
    paginaActual,
    totalPaginas
  );

  const indiceInicial =
    (paginaVisible - 1) * REGISTROS_POR_PAGINA;

  const localidadesDePagina = localidadesFiltradas.slice(
    indiceInicial,
    indiceInicial + REGISTROS_POR_PAGINA
  );

  // =========================================
  // SELECCIONAR LOCALIDAD
  // =========================================

  const seleccionarLocalidad = (localidad) => {
    setLocalidadSeleccionadaId(String(localidad.id));

    const indice = localidadesFiltradas.findIndex(
      (item) => String(item.id) === String(localidad.id)
    );

    if (indice >= 0) {
      setPaginaActual(
        Math.floor(indice / REGISTROS_POR_PAGINA) + 1
      );
    }
  };

  // =========================================
  // LIMPIAR FILTROS
  // =========================================

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstado("todas");
    setOrdenamiento("nombre");
    setPaginaActual(1);
    setLocalidadSeleccionadaId(null);
  };

  // =========================================
  // RENDERIZADO
  // =========================================

  return (
    <div className="localidades-page">

      {/* ENCABEZADO */}
      <PageHeader
        titulo="Localidades"
        descripcion="Consulta y administra la distribución geográfica de las localidades de Tuxtla Gutiérrez, Chiapas."
        acciones={[
          {
            id: "agregar-localidad",
            label: "Agregar localidad",
            icono: "add_location_alt",
            variante: "primary",
            onClick: () => setModalAgregarAbierto(true),
          },
          {
            id: "asignar-campanias",
            label: "Asignar campañas",
            icono: "campaign",
            variante: "secondary",
            onClick: () => setModalAsignacionAbierto(true),
          },
        ]}
      />

      {/* ERROR DE CARGA */}
      {error && (
        <div className="localidades-error">
          <span className="material-symbols-rounded">
            error
          </span>

          {error}
        </div>
      )}

      {/* ESTADÍSTICAS */}
      <section className="localidades-stats">

        <div className="localidades-stat-card">

          <div className="localidades-stat-icon localidades-stat-icon-blue">
            <span className="material-symbols-rounded">
              location_city
            </span>
          </div>

          <div>
            <span className="localidades-stat-label">
              Total de localidades
            </span>

            <strong className="localidades-stat-value">
              {cargando ? "—" : totalLocalidades}
            </strong>
          </div>

        </div>

        <div className="localidades-stat-card">

          <div className="localidades-stat-icon localidades-stat-icon-green">
            <span className="material-symbols-rounded">
              check_circle
            </span>
          </div>

          <div>
            <span className="localidades-stat-label">
              Localidades activas
            </span>

            <strong className="localidades-stat-value">
              {cargando ? "—" : localidadesActivas}
            </strong>
          </div>

        </div>

        <div className="localidades-stat-card">

          <div className="localidades-stat-icon localidades-stat-icon-purple">
            <span className="material-symbols-rounded">
              map
            </span>
          </div>

          <div>
            <span className="localidades-stat-label">
              Con ubicación geográfica
            </span>

            <strong className="localidades-stat-value">
              {cargando ? "—" : localidadesUbicadas}
            </strong>
          </div>

        </div>

        <div className="localidades-stat-card">

          <div className="localidades-stat-icon localidades-stat-icon-orange">
            <span className="material-symbols-rounded">
              groups
            </span>
          </div>

          <div>
            <span className="localidades-stat-label">
              Población registrada
            </span>

            <strong className="localidades-stat-value">
              {cargando
                ? "—"
                : formatearPoblacion(poblacionTotal)}
            </strong>
          </div>

        </div>

      </section>

      {/* MAPA */}
      <section className="localidades-section">

        <div className="localidades-section-header">

          <div className="localidades-section-title">

            <div className="localidades-section-icon">
              <span className="material-symbols-rounded">
                public
              </span>
            </div>

            <div>
              <h2>Distribución geográfica</h2>

              <p>
                Selecciona un marcador para consultar una localidad.
              </p>
            </div>

          </div>

          <span className="localidades-map-counter">

            <span className="material-symbols-rounded">
              location_on
            </span>

            {localidadesFiltradas.filter(
              (localidad) =>
                localidad.latitud !== null &&
                localidad.latitud !== undefined &&
                localidad.longitud !== null &&
                localidad.longitud !== undefined
            ).length}{" "}
            puntos en el mapa

          </span>

        </div>

        <MapaLocalidades
          localidades={localidadesFiltradas}
          localidadSeleccionadaId={localidadSeleccionadaId}
          onSeleccionarLocalidad={seleccionarLocalidad}
        />

        <div className="localidades-map-footer">

          <span>
            <span className="material-symbols-rounded">
              touch_app
            </span>

            Puedes seleccionar los marcadores para consultar sus datos.
          </span>

          <span className="localidades-map-attribution">
            Mapa © OpenStreetMap
          </span>

        </div>

      </section>

      {/* TABLA */}
      <section className="localidades-section localidades-table-section">

        <div className="localidades-section-header">

          <div className="localidades-section-title">

            <div className="localidades-section-icon">
              <span className="material-symbols-rounded">
                table_view
              </span>
            </div>

            <div>
              <h2>Directorio de localidades</h2>

              <p>
                Consulta los datos y selecciona una fila para localizarla en el mapa.
              </p>
            </div>

          </div>

          <span className="localidades-record-counter">
            {localidadesFiltradas.length} registros
          </span>

        </div>

        {/* BÚSQUEDA Y FILTROS */}
        <div className="localidades-toolbar">

          <div className="localidades-search">

            <span className="material-symbols-rounded">
              search
            </span>

            <input
              type="text"
              placeholder="Buscar por nombre, código o C.P."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
            />

          </div>

          <div className="localidades-filter">

            <label htmlFor="localidades-filtro-estado">
              Estado
            </label>

            <select
              id="localidades-filtro-estado"
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPaginaActual(1);
              }}
            >
              <option value="todas">Todas</option>
              <option value="activas">Activas</option>
              <option value="inactivas">Inactivas</option>
            </select>

          </div>

          <div className="localidades-filter">

            <label htmlFor="localidades-ordenamiento">
              Ordenar por
            </label>

            <select
              id="localidades-ordenamiento"
              value={ordenamiento}
              onChange={(e) => {
                setOrdenamiento(e.target.value);
                setPaginaActual(1);
              }}
            >
              <option value="nombre">Nombre (A-Z)</option>

              <option value="poblacion_desc">
                Mayor población
              </option>

              <option value="poblacion_asc">
                Menor población
              </option>

            </select>

          </div>

          <button
            type="button"
            className="localidades-clear-filters"
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </button>

        </div>

        <TablaLocalidades
          localidades={localidadesDePagina}
          cargando={cargando}
          localidadSeleccionadaId={localidadSeleccionadaId}
          onSeleccionarLocalidad={seleccionarLocalidad}
          paginaActual={paginaVisible}
          totalPaginas={totalPaginas}
          onCambiarPagina={setPaginaActual}
          totalRegistros={localidadesFiltradas.length}
        />

      </section>

      {/* =========================================
          MODAL PARA AGREGAR LOCALIDAD
      ========================================= */}

      {modalAgregarAbierto && (
        <ModalLocalidad
          onClose={() => setModalAgregarAbierto(false)}
          onGuardado={recargarLocalidades}
        />
      )}

      {/* =========================================
          MODAL PARA ASIGNAR CAMPAÑAS
      ========================================= */}

      {modalAsignacionAbierto && (
        <ModalAsignarCampanias
          localidades={localidades}
          onClose={() => setModalAsignacionAbierto(false)}
          onGuardado={recargarLocalidades}
        />
      )}

    </div>
  );
}

export default Localidades;