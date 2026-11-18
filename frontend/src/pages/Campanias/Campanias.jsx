import { useCallback, useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/PageHeader/PageHeader";

import {
  obtenerCampanias,
  crearCampania,
  actualizarCampania,
} from "../../services/campaniaService";

import { obtenerPersonal } from "../../services/personalService";
import { obtenerUsuario } from "../../services/authService";

import CampaniaForm from "./CampaniaForm";
import CronogramaCampania from "./CronogramaCampania";

import "./Campanias.css";

function extraerLista(respuesta) {
  const posibles = [
    respuesta,
    respuesta?.datos,
    respuesta?.data,
    respuesta?.data?.datos,
    respuesta?.data?.data,
    respuesta?.data?.campanias,
    respuesta?.data?.personal,
    respuesta?.campanias,
    respuesta?.personal,
    respuesta?.rows,
  ];

  return posibles.find(Array.isArray) || [];
}

// Normalizar texto para comparar categorías y estados.
function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Obtener categoría normalizada.
function obtenerCategoria(campania) {
  const categoria = normalizarTexto(
    campania.categoria ??
    campania.tipo ??
    campania.tipo_campania ??
    campania.categoria_campania
  );

  if (
    ["humana", "humano", "personas", "human"].includes(categoria)
  ) {
    return "humana";
  }

  if (
    ["veterinaria", "veterinario", "animal", "animales", "veterinary"].includes(categoria)
  ) {
    return "veterinaria";
  }

  return categoria;
}

// Obtener estado normalizado.
function obtenerEstado(campania) {
  return normalizarTexto(
    campania.estado ??
    campania.status ??
    campania.estado_campania
  );
}

// Obtener identificador del responsable.
function obtenerResponsableId(campania) {
  return (
    campania.responsable_id ??
    campania.responsableId ??
    campania.id_responsable ??
    campania.personal_id ??
    campania.responsable?.id ??
    campania.personal?.id ??
    campania.usuario_responsable?.personal_id ??
    null
  );
}

// Convertir fecha sin problemas de zona horaria.
const convertirFecha = (valor) => {
  if (!valor) return null;

  const texto = String(valor);

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [anio, mes, dia] = texto.split("-").map(Number);
    const fecha = new Date(anio, mes - 1, dia);

    if (
      fecha.getFullYear() !== anio ||
      fecha.getMonth() !== mes - 1 ||
      fecha.getDate() !== dia
    ) {
      return null;
    }

    return fecha;
  }

  const fecha = new Date(texto);

  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

// Fecha utilizada para ordenar campañas.
const obtenerFechaOrden = (campania) => {
  return (
    campania.created_at ||
    campania.fecha_creacion ||
    campania.fecha_inicio
  );
};

// Comprobar si pertenece al periodo seleccionado.
const perteneceAlPeriodo = (campania, periodo) => {
  if (periodo === "todos") return true;

  const fechaCampania = convertirFecha(campania.fecha_inicio);

  if (!fechaCampania) return false;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const inicioMes = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    1
  );

  const inicioAnio = new Date(
    hoy.getFullYear(),
    0,
    1
  );

  const hace30Dias = new Date(hoy);
  hace30Dias.setDate(hace30Dias.getDate() - 30);

  const dentroDe30Dias = new Date(hoy);
  dentroDe30Dias.setDate(dentroDe30Dias.getDate() + 30);

  switch (periodo) {
    case "este_mes":
      return (
        fechaCampania >= inicioMes &&
        fechaCampania.getMonth() === hoy.getMonth() &&
        fechaCampania.getFullYear() === hoy.getFullYear()
      );

    case "ultimos_30_dias":
      return (
        fechaCampania >= hace30Dias &&
        fechaCampania <= hoy
      );

    case "proximos_30_dias":
      return (
        fechaCampania >= hoy &&
        fechaCampania <= dentroDe30Dias
      );

    case "este_anio":
      return (
        fechaCampania >= inicioAnio &&
        fechaCampania.getFullYear() === hoy.getFullYear()
      );

    default:
      return true;
  }
};

// Formatear fechas.
const formatearFechaCampania = (fecha) => {
  const fechaConvertida = convertirFecha(fecha);

  if (!fechaConvertida) return "Sin definir";

  return fechaConvertida.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Nombres de estados.
const nombresEstadosCampania = {
  planeada: "Planeada",
  activa: "Activa",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

// Obtener nombre del responsable.
function nombreResponsable(campania) {
  return (
    campania.responsable_nombre ||
    campania.responsable?.nombre ||
    campania.personal?.nombre ||
    "Sin asignar"
  );
}

// Tarjeta de campaña

function CampaniaCard({
  campania,
  onEditar,
  onVerDetalles,
  puedeEditar = true,
}) {
  const [imagenError, setImagenError] = useState(false);

  const estado = obtenerEstado(campania) || "planeada";
  const categoria = obtenerCategoria(campania);

  const rutaImagen =
    campania.icono ||
    `/icons/campanias/${campania.codigo}.png`;

  return (
    <article className="campania-card campania-card-v2">

      <div className="campania-card-top">
        {!imagenError ? (
          <img
            className="campania-card-avatar"
            src={rutaImagen}
            alt={`Icono de ${campania.nombre}`}
            onError={() => setImagenError(true)}
          />
        ) : (
          <div className="campania-card-avatar campania-image-fallback">
            <span className="material-symbols-rounded">
              {categoria === "veterinaria" ? "pets" : "vaccines"}
            </span>
          </div>
        )}

        <div className="campania-card-identity">
          <h3 className="campania-card-name">
            {campania.nombre}
          </h3>

          <span className="campania-card-code">
            {campania.codigo}
          </span>
        </div>
      </div>

      <p className="campania-card-description">
        {campania.descripcion || "Sin descripción disponible."}
      </p>

      <div className="campania-card-timeline">

        <div className="campania-card-timeline-item">
          <div className="campania-card-timeline-heading">
            <span className="material-symbols-rounded">schedule</span>
            <span>Inicio</span>
          </div>

          <p className="campania-card-timeline-value">
            {formatearFechaCampania(campania.fecha_inicio)}
          </p>
        </div>

        <div className="campania-card-timeline-item">
          <div className="campania-card-timeline-heading">
            <span className="material-symbols-rounded">calendar_month</span>
            <span>Fin</span>
          </div>

          <p className="campania-card-timeline-value">
            {formatearFechaCampania(campania.fecha_fin)}
          </p>
        </div>

        <div className="campania-card-timeline-item">
          <div className="campania-card-timeline-heading">
            <span className="material-symbols-rounded">key</span>
            <span>Status</span>
          </div>

          <p className="campania-card-timeline-value">
            <span className={`campania-state campania-state--${estado}`}>
              {nombresEstadosCampania[estado] ||
                campania.estado ||
                "Sin estado"}
            </span>
          </p>
        </div>

      </div>

      <div className="campania-card-extra">

        <div className="campania-card-doses">

          <div className="campania-card-meta-line">
            <span className="material-symbols-rounded">vaccines</span>

            <div className="campania-card-meta-content">
              <span className="campania-card-meta-label">
                Dosis asignadas
              </span>

              <span className="campania-card-meta-value">
                {Number(campania.dosis_asignadas ?? 0).toLocaleString("es-MX")}
              </span>
            </div>
          </div>

          <div className="campania-card-meta-line">
            <span className="material-symbols-rounded">flag</span>

            <div className="campania-card-meta-content">
              <span className="campania-card-meta-label">
                Dosis objetivo
              </span>

              <span className="campania-card-meta-value">
                {Number(campania.objetivo_dosis ?? 0).toLocaleString("es-MX")}
              </span>
            </div>
          </div>

        </div>

        <div className="campania-card-meta-line">
          <span className="material-symbols-rounded">person</span>

          <div className="campania-card-meta-content">
            <span className="campania-card-meta-label">
              Responsable
            </span>

            <span className="campania-card-meta-value">
              {nombreResponsable(campania)}
            </span>
          </div>
        </div>

      </div>

      <div className="campania-card-actions">

        <button
          type="button"
          className="campania-button-details"
          onClick={() => onVerDetalles(campania)}
        >
          <span className="material-symbols-rounded">visibility</span>
          Ver detalles
        </button>

        <button
          type="button"
          className={`campania-button-edit ${
            !puedeEditar ? "campania-button-disabled" : ""
          }`}
          onClick={
            puedeEditar ? () => onEditar(campania) : undefined
          }
          disabled={!puedeEditar}
          aria-disabled={!puedeEditar}
          title={
            !puedeEditar
              ? "Tu rol permite consultar, no editar campañas"
              : "Editar campaña"
          }
        >
          <span className="material-symbols-rounded">edit</span>
          Editar campaña
        </button>

      </div>
    </article>
  );
}

// Sección de campañas

function SeccionCampanias({
  titulo,
  descripcion,
  icono,
  campanias,
  onEditar,
  onVerDetalles,
  tipo,
  puedeEditar = true,
}) {
  return (
    <section className="campanias-section">

      <div className="campanias-section-heading">

        <div className={`campanias-section-icon ${tipo}`}>
          <span className="material-symbols-rounded">
            {icono}
          </span>
        </div>

        <div>
          <h2>{titulo}</h2>
          <p>{descripcion}</p>
        </div>

        <span className="campanias-section-count">
          {campanias.length}{" "}
          {campanias.length === 1 ? "campaña" : "campañas"}
        </span>

      </div>

      {campanias.length > 0 ? (
        <div className="campanias-grid">
          {campanias.map((campania) => (
            <CampaniaCard
              key={campania.id}
              campania={campania}
              onEditar={onEditar}
              onVerDetalles={onVerDetalles}
              puedeEditar={puedeEditar}
            />
          ))}
        </div>
      ) : (
        <div className="campanias-empty">
          <span className="material-symbols-rounded">
            {tipo === "veterinaria" ? "pets" : "vaccines"}
          </span>

          <h3>Aún no hay campañas en esta sección</h3>

          <p>
            Las campañas registradas aparecerán aquí.
          </p>
        </div>
      )}

    </section>
  );
}

// Componente principal

export default function Campanias() {

  // Usuario actual

  const usuarioActual = obtenerUsuario();

  const correoUsuario = String(
    usuarioActual?.correo ||
    usuarioActual?.email ||
    usuarioActual?.usuario?.correo ||
    usuarioActual?.usuario?.email ||
    ""
  ).trim().toLowerCase();

  const rolId = Number(
    usuarioActual?.rol_id ??
    usuarioActual?.rol?.id ??
    usuarioActual?.id_rol
  );

  const correosCoordinadores = [
    "andrea.salazar28@mgvacuna.mx",
    "ximena.beltran89@mgvacuna.mx",
  ];

  const esCoordinador =
    rolId === 2 ||
    correosCoordinadores.includes(correoUsuario);

  // Estados principales

  const [campanias, setCampanias] = useState([]);
  const [responsables, setResponsables] = useState([]);
  //const [personal, setPersonal] = useState([]);
  const [, setPersonal] = useState([]);
  const [personalActual, setPersonalActual] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Filtrar campañas

  const campaniasPermitidas = useMemo(() => {

    // El administrador puede consultar todas.
    if (!esCoordinador) {
      return campanias;
    }

    // Si todavía no se identificó al coordinador, no mostrar campañas incorrectamente.
    if (!personalActual?.id) {
      return [];
    }

    const idPersonal = Number(personalActual.id);

    return campanias.filter((campania) => {

      const responsableId = obtenerResponsableId(campania);

      if (responsableId === null || responsableId === undefined) {
        return false;
      }

      return Number(responsableId) === idPersonal;

    });

  }, [campanias, esCoordinador, personalActual]);

  // Mensajes

  useEffect(() => {

    if (!mensaje) return;

    const temporizador = setTimeout(() => {
      setMensaje("");
    }, 3000);

    return () => clearTimeout(temporizador);

  }, [mensaje]);

  // Filtros

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [ordenamiento, setOrdenamiento] = useState("reciente");

  // Modales

  const [modalAbierto, setModalAbierto] = useState(false);
  const [campaniaEditar, setCampaniaEditar] = useState(null);
  const [campaniaDetalle, setCampaniaDetalle] = useState(null);

  // Identificar al coordinador

  const identificarPersonalActual = (listaPersonal) => {

    const idUsuario = Number(
      usuarioActual?.id ??
      usuarioActual?.usuario?.id
    );

    const personaEncontrada = listaPersonal.find((persona) => {

      const correoPersonal = String(
        persona.correo ||
        persona.email ||
        persona.usuario?.correo ||
        persona.usuario?.email ||
        ""
      ).trim().toLowerCase();

      const usuarioRelacionado = Number(
        persona.usuario_id ??
        persona.user_id ??
        persona.id_usuario ??
        persona.usuario?.id
      );

      const coincideCorreo =
        correoUsuario !== "" &&
        correoPersonal === correoUsuario;

      const coincideUsuario =
        Number.isFinite(idUsuario) &&
        idUsuario > 0 &&
        usuarioRelacionado === idUsuario;

      return coincideCorreo || coincideUsuario;

    });

    return personaEncontrada || null;
  };

  // Cargar campañas

  const cargarDatos = useCallback(async () => {

    setCargando(true);
    setError("");

    try {

      const [
        respuestaCampanias,
        respuestaPersonal,
      ] = await Promise.all([
        obtenerCampanias(),
        obtenerPersonal(),
      ]);

      const listaCampanias = extraerLista(respuestaCampanias);
      const listaPersonal = extraerLista(respuestaPersonal);

      console.log(
        "RESPUESTA ORIGINAL DE CAMPAÑAS:",
        respuestaCampanias
      );

      console.log(
        "CAMPAÑAS EXTRAÍDAS:",
        listaCampanias
      );

      console.log(
        "PERSONAL EXTRAÍDO:",
        listaPersonal
      );

      setCampanias(listaCampanias);
      setPersonal(listaPersonal);

      if (esCoordinador) {

        const personaEncontrada =
          identificarPersonalActual(listaPersonal);

        console.log(
          "USUARIO ACTUAL:",
          usuarioActual
        );

        console.log(
          "CORREO DEL USUARIO:",
          correoUsuario
        );

        console.log(
          "PERSONAL IDENTIFICADO:",
          personaEncontrada
        );

        if (!personaEncontrada) {

          setPersonalActual(null);

          console.error(
            "No se encontró al usuario actual en la tabla personal."
          );

          setError(
            "No se pudo identificar tu registro en personal. Comprueba que tu correo o usuario_id coincida con el registro de personal."
          );

        } else {

          setPersonalActual(personaEncontrada);

          const campaniasAsignadas = listaCampanias.filter(
            (campania) =>
              Number(obtenerResponsableId(campania)) ===
              Number(personaEncontrada.id)
          );

          console.log(
            "ID DEL PERSONAL ACTUAL:",
            personaEncontrada.id
          );

          console.log(
            "CAMPAÑAS ASIGNADAS AL COORDINADOR:",
            campaniasAsignadas
          );

        }

      } else {

        setPersonalActual(null);

      }

      const listaResponsables = listaPersonal.filter(
        (persona) => Number(persona.rol_id) === 2
      );

      setResponsables(listaResponsables);

      console.log(
        "TOTAL DE CAMPAÑAS RECIBIDAS:",
        listaCampanias.length
      );

      console.log(
        "TOTAL DE PERSONAL RECIBIDO:",
        listaPersonal.length
      );

    } catch (errorCarga) {

      console.error(
        "ERROR AL CARGAR CAMPAÑAS:",
        errorCarga
      );

      setCampanias([]);
      setPersonal([]);
      setResponsables([]);
      setPersonalActual(null);

      setError(
        errorCarga.response?.data?.mensaje ||
        errorCarga.response?.data?.message ||
        errorCarga.message ||
        "No fue posible cargar la información de campañas."
      );

    } finally {

      setCargando(false);

    }

  }, [
    esCoordinador,
    correoUsuario,
    usuarioActual?.id,
    usuarioActual?.usuario?.id,
  ]);

  useEffect(() => {
    let activo = true;
    const iniciar = async () => {
      await Promise.resolve();

      if (activo) {
        await cargarDatos();
      }
    };

    iniciar();

    return () => {
      activo = false;
    };
  }, [cargarDatos]);

  const campaniasFiltradas = useMemo(() => {

    let resultado = [...campaniasPermitidas];

    // BUSCAR POR NOMBRE O CÓDIGO

    if (busqueda.trim()) {

      const texto = normalizarTexto(busqueda);

      resultado = resultado.filter((campania) => {

        const nombre = normalizarTexto(campania.nombre);
        const codigo = normalizarTexto(campania.codigo);

        return (
          nombre.includes(texto) ||
          codigo.includes(texto)
        );

      });

    }

    if (filtroEstado !== "todos") {

      resultado = resultado.filter(
        (campania) =>
          obtenerEstado(campania) === filtroEstado
      );

    }

    resultado = resultado.filter((campania) =>
      perteneceAlPeriodo(campania, filtroPeriodo)
    );

    resultado.sort((a, b) => {

      if (ordenamiento === "alfabetico") {

        return String(a.nombre || "").localeCompare(
          String(b.nombre || ""),
          "es",
          { sensitivity: "base" }
        );

      }

      const fechaA =
        convertirFecha(obtenerFechaOrden(a))?.getTime() ?? 0;

      const fechaB =
        convertirFecha(obtenerFechaOrden(b))?.getTime() ?? 0;

      if (ordenamiento === "antiguo") {
        return fechaA - fechaB;
      }

      return fechaB - fechaA;

    });

    return resultado;

  }, [
    campaniasPermitidas,
    busqueda,
    filtroEstado,
    filtroPeriodo,
    ordenamiento,
  ]);

  const campaniasHumanas = useMemo(
    () =>
      campaniasFiltradas.filter(
        (campania) => obtenerCategoria(campania) === "humana"
      ),
    [campaniasFiltradas]
  );

  const campaniasVeterinarias = useMemo(
    () =>
      campaniasFiltradas.filter(
        (campania) => obtenerCategoria(campania) === "veterinaria"
      ),
    [campaniasFiltradas]
  );

  const limpiarFiltros = () => {

    setBusqueda("");
    setFiltroEstado("todos");
    setFiltroPeriodo("todos");
    setOrdenamiento("reciente");

  };

  const estadisticas = useMemo(() => {

    return {

      total: campaniasPermitidas.length,

      activas: campaniasPermitidas.filter(
        (c) => obtenerEstado(c) === "activa"
      ).length,

      planeadas: campaniasPermitidas.filter(
        (c) => obtenerEstado(c) === "planeada"
      ).length,

      finalizadas: campaniasPermitidas.filter(
        (c) => obtenerEstado(c) === "finalizada"
      ).length,

      canceladas: campaniasPermitidas.filter(
        (c) => obtenerEstado(c) === "cancelada"
      ).length,

    };

  }, [campaniasPermitidas]);

  const abrirNueva = () => {

    setCampaniaEditar(null);
    setCampaniaDetalle(null);
    setMensaje("");
    setError("");
    setModalAbierto(true);

  };

  const abrirEdicion = (campania) => {

    setCampaniaDetalle(null);
    setCampaniaEditar(campania);
    setMensaje("");
    setError("");
    setModalAbierto(true);

  };

  const abrirDetalles = (campania) => {

    setCampaniaDetalle(campania);

  };

  const guardarCampania = async (datos) => {

    setGuardando(true);
    setError("");

    try {

      if (campaniaEditar) {

        await actualizarCampania(
          campaniaEditar.id,
          datos
        );

        setMensaje(
          "La campaña se actualizó correctamente."
        );

      } else {

        await crearCampania(datos);

        setMensaje(
          "La campaña se registró correctamente."
        );

      }

      setModalAbierto(false);
      setCampaniaEditar(null);

      await cargarDatos();

    } catch (errorGuardar) {

      const mensajeError =
        errorGuardar.response?.data?.mensaje ||
        errorGuardar.response?.data?.message ||
        errorGuardar.message ||
        "No fue posible guardar la campaña.";

      setError(mensajeError);

      throw errorGuardar;

    } finally {

      setGuardando(false);

    }

  };

  return (

    <main className="campanias-page">

      {/* ================================================
          Encabezado
      ================================================= */}

      <PageHeader
        titulo="Campañas"
        descripcion="Administra y organiza las campañas de vacunación."
        accion={esCoordinador ? undefined : "Nueva campaña"}
        onAccion={esCoordinador ? undefined : abrirNueva}
      />

      {/* ================================================
          Mensaje de éxito
      ================================================= */}

      {mensaje && (

        <div className="campanias-feedback success">

          <span className="material-symbols-rounded">
            check_circle
          </span>

          {mensaje}

        </div>

      )}

      {/* ================================================
          Mensaje de error
      ================================================= */}

      {error && (

        <div className="campanias-feedback error">

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

      {/* ================================================
          Estadísticas
      ================================================= */}

      <section className="campanias-stats">

        {/* Total */}

        <div className="campanias-stat-card">

          <div className="campanias-stat-icon total">

            <span className="material-symbols-rounded">
              campaign
            </span>

          </div>

          <div>
            <span>Total</span>
            <strong>{estadisticas.total}</strong>
          </div>

        </div>

        {/* Activas */}

        <div className="campanias-stat-card">

          <div className="campanias-stat-icon active">

            <span className="material-symbols-rounded">
              play_circle
            </span>

          </div>

          <div>
            <span>Activas</span>
            <strong>{estadisticas.activas}</strong>
          </div>

        </div>

        {/* Planeadas */}

        <div className="campanias-stat-card">

          <div className="campanias-stat-icon planned">

            <span className="material-symbols-rounded">
              event
            </span>

          </div>

          <div>
            <span>Planeadas</span>
            <strong>{estadisticas.planeadas}</strong>
          </div>

        </div>

        {/* Finalizadas */}

        <div className="campanias-stat-card">

          <div className="campanias-stat-icon finished">

            <span className="material-symbols-rounded">
              task_alt
            </span>

          </div>

          <div>
            <span>Finalizadas</span>
            <strong>{estadisticas.finalizadas}</strong>
          </div>

        </div>

        {/* Canceladas */}

        <div className="campanias-stat-card">

          <div className="campanias-stat-icon cancelled">

            <span className="material-symbols-rounded">
              cancel
            </span>

          </div>

          <div>
            <span>Canceladas</span>
            <strong>{estadisticas.canceladas}</strong>
          </div>

        </div>

      </section>

      {/* ================================================
          Búsqueda y filtros
      ================================================= */}

      <div className="campania-filters-panel">

        <div className="campania-filters-grid">

          {/* Buscar */}

          <div className="campania-filter-field campania-search-field">

            <label htmlFor="buscar-campania">
              Buscar campaña
            </label>

            <div className="campania-search-input">

              <span className="material-symbols-rounded">
                search
              </span>

              <input
                id="buscar-campania"
                type="text"
                placeholder="Nombre o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />

            </div>

          </div>

          {/* Estado */}

          <div className="campania-filter-field">

            <label htmlFor="filtro-estado">
              Estado
            </label>

            <select
              id="filtro-estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >

              <option value="todos">
                Todos los estados
              </option>

              <option value="activa">Activa</option>
              <option value="planeada">Planeada</option>
              <option value="finalizada">Finalizada</option>
              <option value="cancelada">Cancelada</option>

            </select>

          </div>

          {/* Periodo */}

          <div className="campania-filter-field">

            <label htmlFor="filtro-periodo">
              Periodo
            </label>

            <select
              id="filtro-periodo"
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
            >

              <option value="todos">
                Todos los periodos
              </option>

              <option value="este_mes">
                Este mes
              </option>

              <option value="ultimos_30_dias">
                Últimos 30 días
              </option>

              <option value="proximos_30_dias">
                Próximos 30 días
              </option>

              <option value="este_anio">
                Este año
              </option>

            </select>

          </div>

          {/* Ordenamiento */}

          <div className="campania-filter-field">

            <label htmlFor="orden-campania">
              Ordenar por
            </label>

            <select
              id="orden-campania"
              value={ordenamiento}
              onChange={(e) => setOrdenamiento(e.target.value)}
            >

              <option value="reciente">
                Más reciente
              </option>

              <option value="antiguo">
                Menos reciente
              </option>

              <option value="alfabetico">
                Alfabéticamente (A-Z)
              </option>

            </select>

          </div>

        </div>

        {/* Resultados y limpiar */}

        <div className="campania-filters-footer">

          <span className="campania-filter-results">

            {campaniasFiltradas.length}{" "}

            {campaniasFiltradas.length === 1
              ? "campaña encontrada"
              : "campañas encontradas"}

          </span>

          <button
            type="button"
            className="campania-clear-filters"
            onClick={limpiarFiltros}
          >

            <span className="material-symbols-rounded">
              filter_alt_off
            </span>

            <span className="campania-clear-filters-text">
              Limpiar filtros
            </span>

          </button>

        </div>

      </div>

      {/* ================================================
          Seccciones de campañas
      ================================================= */}

      {cargando ? (

        <div className="campanias-loading">

          <span className="material-symbols-rounded">
            progress_activity
          </span>

          <p>Cargando campañas...</p>

        </div>

      ) : (

        <>

          {/* Campañas humanas */}

          <SeccionCampanias
            titulo="Campañas humanas"
            descripcion="Campañas de vacunación dirigidas a personas."
            icono="vaccines"
            tipo="humana"
            campanias={campaniasHumanas}
            onEditar={abrirEdicion}
            onVerDetalles={abrirDetalles}
            puedeEditar={!esCoordinador}
          />

          {/* Campañas veterinarias */}

          <SeccionCampanias
            titulo="Campañas veterinarias"
            descripcion="Campañas de vacunación dirigidas a animales."
            icono="pets"
            tipo="veterinaria"
            campanias={campaniasVeterinarias}
            onEditar={abrirEdicion}
            onVerDetalles={abrirDetalles}
            puedeEditar={!esCoordinador}
          />

        </>

      )}

      {/* ================================================
          Modal de detalles
      ================================================= */}

      {campaniaDetalle && (

        <div
          className="campania-details-overlay"
          onClick={() => setCampaniaDetalle(null)}
        >

          <div
            className="campania-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="campania-details-title"
            onClick={(e) => e.stopPropagation()}
          >

            {/* ENCABEZADO */}

            <div className="campania-details-header">

              <div>

                <span className="campania-details-eyebrow">
                  DETALLES DE CAMPAÑA
                </span>

                <h2 id="campania-details-title">
                  {campaniaDetalle.nombre}
                </h2>

                <span className="campania-card-code">
                  {campaniaDetalle.codigo}
                </span>

              </div>

              <button
                type="button"
                className="campania-details-close"
                onClick={() => setCampaniaDetalle(null)}
                aria-label="Cerrar detalles"
              >

                <span className="material-symbols-rounded">
                  close
                </span>

              </button>

            </div>

            {/* INFORMACIÓN */}

            <div className="campania-details-body">

              <div className="campania-details-item">

                <span className="campania-details-label">
                  Categoría
                </span>

                <span className="campania-details-value">

                  {obtenerCategoria(campaniaDetalle) === "humana"
                    ? "Humana"
                    : obtenerCategoria(campaniaDetalle) === "veterinaria"
                      ? "Veterinaria"
                      : "Sin categoría"}

                </span>

              </div>

              <div className="campania-details-item">

                <span className="campania-details-label">
                  Estado
                </span>

                <span
                  className={`campania-state campania-state--${obtenerEstado(campaniaDetalle) || "planeada"}`}
                >

                  {nombresEstadosCampania[
                    obtenerEstado(campaniaDetalle)
                  ] ||
                    campaniaDetalle.estado ||
                    "Sin estado"}

                </span>

              </div>

              <div className="campania-details-item campania-details-item-full">

                <span className="campania-details-label">
                  Descripción
                </span>

                <p className="campania-details-value">

                  {campaniaDetalle.descripcion ||
                    "Sin descripción disponible."}

                </p>

              </div>

              <div className="campania-details-item">

                <span className="campania-details-label">
                  Fecha de inicio
                </span>

                <span className="campania-details-value">

                  {formatearFechaCampania(
                    campaniaDetalle.fecha_inicio
                  )}

                </span>

              </div>

              <div className="campania-details-item">

                <span className="campania-details-label">
                  Fecha de finalización
                </span>

                <span className="campania-details-value">

                  {formatearFechaCampania(
                    campaniaDetalle.fecha_fin
                  )}

                </span>

              </div>

              <div className="campania-details-item">

                <span className="campania-details-label">
                  Dosis asignadas
                </span>

                <span className="campania-details-value">

                  {Number(
                    campaniaDetalle.dosis_asignadas ?? 0
                  ).toLocaleString("es-MX")}

                </span>

              </div>

              <div className="campania-details-item">

                <span className="campania-details-label">
                  Dosis objetivo
                </span>

                <span className="campania-details-value">

                  {Number(
                    campaniaDetalle.objetivo_dosis ?? 0
                  ).toLocaleString("es-MX")}

                </span>

              </div>

              <div className="campania-details-item">

                <span className="campania-details-label">
                  Responsable
                </span>

                <span className="campania-details-value">
                  {nombreResponsable(campaniaDetalle)}
                </span>

              </div>

            </div>

            {/* CRONOGRAMA */}

            {Number(campaniaDetalle.id) === 6 && (
              <CronogramaCampania />
            )}

            {/* ACCIONES */}

            <div className="campania-details-actions">

              <button
                type="button"
                className="campania-button-edit"
                onClick={() => {}}
              >

                <span className="material-symbols-rounded">
                  event_note
                </span>

                Programar Actividades

              </button>

            </div>

          </div>

        </div>

      )}

      {/* ================================================
          MODAL DE CREACIÓN Y EDICIÓN
      ================================================= */}

      {modalAbierto && (

        <CampaniaForm
          key={campaniaEditar?.id ?? "nueva"}
          campania={campaniaEditar}
          responsables={responsables}
          guardando={guardando}
          onGuardar={guardarCampania}
          onCerrar={() => {

            if (!guardando) {
              setModalAbierto(false);
              setCampaniaEditar(null);
            }
          }}
        />
      )}
    </main>
  );
}
