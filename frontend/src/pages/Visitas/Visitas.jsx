import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import PageHeader from "../../components/PageHeader/PageHeader";
import CalendarioVisitas from "./components/CalendarioVisitas";
import VisitaDetalle from "./components/VisitaDetalle";
import {
  NuevaVisitaModal,
  EditarVisitaModal,
  JornadaModal,
} from "./components/VisitaModal";

import {
  obtenerVisitas,
  obtenerCatalogosVisita,
  crearVisita,
  actualizarVisita,
  agregarJornadas,
  actualizarJornada,
  eliminarJornada,
  cancelarVisita,
  crearPuntoVacunacion,
} from "../../services/visitaService";

import {
  fechaISO,
  fechaLocal,
  obtenerHoy,
  obtenerLista,
  obtenerDatos,
  obtenerMensajeError,
  formatoNumero,
} from "./visitaUtils";

import "./Visitas.css";

export default function Visitas() {
  const [visitas, setVisitas] = useState([]);
  const [catalogos, setCatalogos] = useState({
    brigadas_localidades: [],
    puntos_vacunacion: [],
  });

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [errorCatalogos, setErrorCatalogos] = useState("");

  const [hoy, setHoy] = useState(() => obtenerHoy());
  const [mesActual, setMesActual] = useState(() => {
    const actual = obtenerHoy();
    return new Date(actual.getFullYear(), actual.getMonth(), 1);
  });
  const [fechaSeleccionada, setFechaSeleccionada] = useState(fechaISO(obtenerHoy()));
  const [seleccion, setSeleccion] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroCampania, setFiltroCampania] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const [mostrarNuevaVisita, setMostrarNuevaVisita] = useState(false);
  const [visitaEditar, setVisitaEditar] = useState(null);
  const [jornadaModal, setJornadaModal] = useState(null);
  const solicitudEnCurso = useRef(false);
  const calendarioRef = useRef(null);
  const [alturaCalendario, setAlturaCalendario] = useState(0);

  // ---------------------------------------------------
  // CARGA INDEPENDIENTE DE VISITAS Y CATÁLOGOS
  // ---------------------------------------------------

  const cargarDatos = useCallback(async ({ silencioso = false } = {}) => {
    if (solicitudEnCurso.current) return;
    solicitudEnCurso.current = true;

    if (!silencioso) setCargando(true);
    setError("");
    setErrorCatalogos("");

    try {
      const [resultadoVisitas, resultadoCatalogos] = await Promise.allSettled([
        obtenerVisitas(),
        obtenerCatalogosVisita(),
      ]);

      let visitasNuevas = visitas;

      if (resultadoVisitas.status === "fulfilled") {
        visitasNuevas = obtenerLista(resultadoVisitas.value);
        setVisitas(visitasNuevas);
      } else {
        const mensajeError = obtenerMensajeError(
          resultadoVisitas.reason,
          "No fue posible cargar las visitas."
        );
        setError(mensajeError);
      }

      if (resultadoCatalogos.status === "fulfilled") {
        const datosCatalogos = obtenerDatos(resultadoCatalogos.value);
        setCatalogos({
          brigadas_localidades: Array.isArray(datosCatalogos?.brigadas_localidades)
            ? datosCatalogos.brigadas_localidades
            : [],
          puntos_vacunacion: Array.isArray(datosCatalogos?.puntos_vacunacion)
            ? datosCatalogos.puntos_vacunacion
            : [],
        });
      } else {
        setErrorCatalogos(
          obtenerMensajeError(
            resultadoCatalogos.reason,
            "No fue posible cargar las brigadas y puntos disponibles."
          )
        );
      }

      if (resultadoVisitas.status === "fulfilled") {
        setSeleccion((actual) => {
          if (actual) {
            const visitaExiste = visitasNuevas.find(
              (item) => Number(item.id) === Number(actual.visitaId)
            );
            const jornadaExiste = visitaExiste?.jornadas?.some(
              (item) => Number(item.id) === Number(actual.jornadaId)
            );
            if (visitaExiste && jornadaExiste) return actual;
          }

          const agenda = visitasNuevas.flatMap((visita) =>
            (visita.jornadas || []).map((jornada) => ({
              visitaId: visita.id,
              jornadaId: jornada.id,
              inicio: String(jornada.fecha_inicio).slice(0, 10),
            }))
          );

          const proxima = agenda
            .filter((item) => item.inicio >= fechaISO(obtenerHoy()))
            .sort((a, b) => a.inicio.localeCompare(b.inicio))[0];

          const primera = proxima || agenda.sort(
            (a, b) => a.inicio.localeCompare(b.inicio)
          )[0];

          return primera
            ? { visitaId: primera.visitaId, jornadaId: primera.jornadaId }
            : null;
        });
      }
    } finally {
      solicitudEnCurso.current = false;
      if (!silencioso) setCargando(false);
    }
  }, []);

  useEffect(() => {
  const iniciarCarga = async () => {
    await cargarDatos();
  };

  iniciarCarga();
}, [cargarDatos]);

  // El backend ejecuta su propia sincronización cada minuto.
  // El frontend vuelve a consultar para reflejar esos cambios.
  useEffect(() => {
    const intervalo = setInterval(() => {
      setHoy(obtenerHoy());
      cargarDatos({ silencioso: true });
    }, 60_000);

    return () => clearInterval(intervalo);
  }, [cargarDatos]);

  useEffect(() => {
    if (!mensaje) return undefined;
    const temporizador = setTimeout(() => setMensaje(""), 3500);
    return () => clearTimeout(temporizador);
  }, [mensaje]);

  useEffect(() => {
  const elemento = calendarioRef.current;
  if (!elemento) return;

  const actualizarAltura = () => {
    const altura = elemento.getBoundingClientRect().height;
    setAlturaCalendario((actual) =>
      Math.abs(actual - altura) > 1 ? altura : actual
    );
  };

  actualizarAltura();

  const observer = new ResizeObserver(actualizarAltura);
  observer.observe(elemento);

    return () => observer.disconnect();
  }, []);

  // ---------------------------------------------------
  // FILTROS Y EVENTOS
  // ---------------------------------------------------

  const visitasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es-MX");

    return visitas.filter((visita) => {
      const coincideCampania = filtroCampania === "todos" ||
        String(visita.campania_id) === filtroCampania;
      const coincideEstado = filtroEstado === "todos" || visita.estado === filtroEstado;
      const contenido = [
        visita.nombre,
        ...(visita.jornadas || []).map((jornada) => jornada.punto_vacunacion),
      ].filter(Boolean);

      const coincideBusqueda = !texto || contenido.some((campo) =>
        String(campo).toLocaleLowerCase("es-MX").startsWith(texto)
      );

      return coincideCampania && coincideEstado && coincideBusqueda;
    });
  }, [visitas, busqueda, filtroCampania, filtroEstado]);

  const eventos = useMemo(() => visitasFiltradas.flatMap((visita) =>
    (visita.jornadas || []).map((jornada) => ({
      visita,
      jornada,
      inicio: String(jornada.fecha_inicio).slice(0, 10),
      fin: String(jornada.fecha_fin).slice(0, 10),
    }))
  ), [visitasFiltradas]);

  const visitaSeleccionada = visitas.find(
    (visita) => Number(visita.id) === Number(seleccion?.visitaId)
  ) || null;

  const estadisticas = useMemo(() => ({
    total: visitas.length,
    planeadas: visitas.filter((v) => v.estado === "planeada").length,
    activas: visitas.filter((v) => v.estado === "activa").length,
    completadas: visitas.filter((v) => v.estado === "completada").length,
    dosis: visitas.reduce((suma, v) => suma + Number(v.dosis_asignadas || 0), 0),
  }), [visitas]);

  const campanias = useMemo(() => {
    const mapa = new Map();
    visitas.forEach((visita) => {
      if (!mapa.has(String(visita.campania_id))) {
        mapa.set(String(visita.campania_id), {
          id: visita.campania_id,
          codigo: visita.campania_codigo,
          nombre: visita.campania_nombre,
        });
      }
    });
    return [...mapa.values()].sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), "es", { numeric: true }));
  }, [visitas]);

  // ---------------------------------------------------
  // CALENDARIO
  // ---------------------------------------------------

  const cambiarMes = (cantidad) => {
    setMesActual((actual) => new Date(actual.getFullYear(), actual.getMonth() + cantidad, 1));
  };

  const irAHoy = () => {
    const actual = obtenerHoy();
    setMesActual(new Date(actual.getFullYear(), actual.getMonth(), 1));
    setFechaSeleccionada(fechaISO(actual));
    const eventoHoy = eventos.find((evento) => evento.inicio <= fechaISO(actual) && evento.fin >= fechaISO(actual));
    if (eventoHoy) setSeleccion({ visitaId: eventoHoy.visita.id, jornadaId: eventoHoy.jornada.id });
  };

  const seleccionarFecha = (fecha) => {
    setFechaSeleccionada(fecha);
    const evento = eventos.find((item) => item.inicio <= fecha && item.fin >= fecha);
    if (evento) {
      setSeleccion({ visitaId: evento.visita.id, jornadaId: evento.jornada.id });
    }
  };

  const seleccionarEvento = (visita, jornada) => {
    setFechaSeleccionada(fechaISO(fechaLocal(jornada.fecha_inicio)));
    setSeleccion({ visitaId: visita.id, jornadaId: jornada.id });
  };

  // ---------------------------------------------------
  // OPERACIONES
  // ---------------------------------------------------

  const guardarNuevaVisita = async (datos) => {
    try {
      setGuardando(true);
      const respuesta = await crearVisita(datos);
      const nueva = obtenerDatos(respuesta);
      await cargarDatos({ silencioso: true });
      if (nueva?.id) {
        setSeleccion({ visitaId: nueva.id, jornadaId: nueva.jornadas?.[0]?.id || null });
        const inicio = nueva.jornadas?.[0]?.fecha_inicio;
        if (inicio) {
          const fecha = fechaLocal(inicio);
          setMesActual(new Date(fecha.getFullYear(), fecha.getMonth(), 1));
          setFechaSeleccionada(fechaISO(fecha));
        }
      }
      setMostrarNuevaVisita(false);
      setMensaje("La visita se registró correctamente.");
    } catch (err) {
      setError(obtenerMensajeError(err, "No fue posible registrar la visita."));
      throw err;
    } finally {
      setGuardando(false);
    }
  };

  const guardarDatosVisita = async (datos) => {
    if (!visitaEditar) return;
    try {
      setGuardando(true);
      await actualizarVisita(visitaEditar.id, datos);
      await cargarDatos({ silencioso: true });
      setVisitaEditar(null);
      setMensaje("La visita se actualizó correctamente.");
    } catch (err) {
      setError(obtenerMensajeError(err, "No fue posible actualizar la visita."));
      throw err;
    } finally {
      setGuardando(false);
    }
  };

  const guardarJornada = async (datos) => {
    if (!jornadaModal) return;
    try {
      setGuardando(true);
      const { visita, jornada } = jornadaModal;
      if (jornada) {
        await actualizarJornada(visita.id, jornada.id, datos);
        setMensaje("La jornada se actualizó correctamente.");
      } else {
        await agregarJornadas(visita.id, [datos]);
        setMensaje("La jornada se agregó correctamente.");
      }
      await cargarDatos({ silencioso: true });
      setJornadaModal(null);
    } catch (err) {
      setError(obtenerMensajeError(err, "No fue posible guardar la jornada."));
      throw err;
    } finally {
      setGuardando(false);
    }
  };

  const guardarPunto = async (datos) => {
    const respuesta = await crearPuntoVacunacion(datos);
    const punto = obtenerDatos(respuesta);
    if (punto?.id) {
      setCatalogos((actual) => ({
        ...actual,
        puntos_vacunacion: [
          ...actual.puntos_vacunacion.filter((item) => Number(item.id) !== Number(punto.id)),
          punto,
        ],
      }));
    }
    return respuesta;
  };

  const manejarEliminarJornada = async (visita, jornada) => {
    const confirmar = window.confirm(`¿Deseas eliminar la jornada de "${jornada.punto_vacunacion}"?`);
    if (!confirmar) return;
    try {
      setProcesando(true);
      await eliminarJornada(visita.id, jornada.id);
      await cargarDatos({ silencioso: true });
      setMensaje("La jornada se eliminó correctamente.");
    } catch (err) {
      setError(obtenerMensajeError(err, "No fue posible eliminar la jornada."));
    } finally {
      setProcesando(false);
    }
  };

  const manejarCancelarVisita = async (visita) => {
    const confirmar = window.confirm(`¿Deseas cancelar ${visita.codigo} — ${visita.nombre}?\n\nEsta acción también cancelará sus jornadas.`);
    if (!confirmar) return;
    try {
      setProcesando(true);
      await cancelarVisita(visita.id);
      await cargarDatos({ silencioso: true });
      setMensaje("La visita se canceló correctamente.");
    } catch (err) {
      setError(obtenerMensajeError(err, "No fue posible cancelar la visita."));
    } finally {
      setProcesando(false);
    }
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroCampania("todos");
    setFiltroEstado("todos");
  };

  // ---------------------------------------------------
  // VISTA
  // ---------------------------------------------------

  return (
    <main className="visitas-page">
      <PageHeader
        titulo="Visitas"
        descripcion="Organiza la programación de vacunación por brigada, localidad y punto de atención."
        accion="Nueva visita"
        onAccion={() => setMostrarNuevaVisita(true)}
      />

      {mensaje && <div className="vis-feedback success"><span className="material-symbols-rounded">check_circle</span>{mensaje}<button type="button" onClick={() => setMensaje("")} aria-label="Cerrar"><span className="material-symbols-rounded">close</span></button></div>}
      {error && <div className="vis-feedback error"><span className="material-symbols-rounded">error</span>{error}<button type="button" onClick={() => setError("")} aria-label="Cerrar"><span className="material-symbols-rounded">close</span></button></div>}
      {errorCatalogos && <div className="vis-feedback warning"><span className="material-symbols-rounded">warning</span>El calendario está disponible, pero no se pudieron cargar los catálogos para crear visitas: {errorCatalogos}<button type="button" onClick={() => cargarDatos()} aria-label="Reintentar"><span className="material-symbols-rounded">refresh</span></button></div>}

      <section className="vis-stats">
        <article className="vis-stat-card"><div className="vis-stat-icon total"><span className="material-symbols-rounded">event_note</span></div><div><small>Visitas registradas</small><strong>{formatoNumero(estadisticas.total)}</strong></div></article>
        <article className="vis-stat-card"><div className="vis-stat-icon planned"><span className="material-symbols-rounded">event_upcoming</span></div><div><small>Planeadas</small><strong>{formatoNumero(estadisticas.planeadas)}</strong></div></article>
        <article className="vis-stat-card"><div className="vis-stat-icon active"><span className="material-symbols-rounded">vaccines</span></div><div><small>En curso</small><strong>{formatoNumero(estadisticas.activas)}</strong></div></article>
        <article className="vis-stat-card"><div className="vis-stat-icon completed"><span className="material-symbols-rounded">task_alt</span></div><div><small>Completadas</small><strong>{formatoNumero(estadisticas.completadas)}</strong></div></article>
      </section>

      <section className="vis-filters">
        <div className="vis-filters-title"><div><span className="material-symbols-rounded">tune</span><strong>Explorar agenda</strong></div><span>{visitasFiltradas.length} de {visitas.length} visitas</span></div>
        <div className="vis-filters-grid">
          <label className="vis-filter-field search"><span>Buscar</span><div className="vis-search-input"><span className="material-symbols-rounded">search</span><input type="search" placeholder="Visita, brigada, localidad o punto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div></label>
          <label className="vis-filter-field"><span>Campaña</span><select value={filtroCampania} onChange={(e) => setFiltroCampania(e.target.value)}><option value="todos">Todas las campañas</option>{campanias.map((campania) => <option key={campania.id} value={String(campania.id)}>{campania.codigo} · {campania.nombre}</option>)}</select></label>
          <label className="vis-filter-field"><span>Estado de visita</span><select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}><option value="todos">Todos los estados</option><option value="planeada">Planeada</option><option value="activa">En curso</option><option value="completada">Completada</option><option value="cancelada">Cancelada</option></select></label>
          <button type="button" className="vis-clear-filters" onClick={limpiarFiltros}><span className="material-symbols-rounded">filter_alt_off</span>Limpiar</button>
        </div>
      </section>

      {cargando ? (
        <div className="vis-loading"><span className="material-symbols-rounded">progress_activity</span><strong>Preparando calendario...</strong><small>Conectando con visitas y catálogos.</small></div>
      ) : (
        <section className="vis-workspace">

          {/* CALENDARIO */}
          <div
            className="vis-calendar-measure"
            ref={calendarioRef}
          >
            <CalendarioVisitas
              mesActual={mesActual}
              eventos={eventos}
              fechaSeleccionada={fechaSeleccionada}
              hoy={hoy}
              seleccion={seleccion}
              onCambiarMes={cambiarMes}
              onIrHoy={irAHoy}
              onSeleccionarFecha={seleccionarFecha}
              onSeleccionarEvento={seleccionarEvento}
            />
          </div>

          {/* FICHA DE PROGRAMACIÓN */}
          <VisitaDetalle
            visita={visitaSeleccionada}
            jornadaSeleccionadaId={seleccion?.jornadaId}
            procesando={procesando}
            alturaCalendario={alturaCalendario}
            onAgregarJornada={(visita) => setJornadaModal({ visita, jornada: null })}
            onEditarVisita={setVisitaEditar}
            onEditarJornada={(visita, jornada) => setJornadaModal({ visita, jornada })}
            onEliminarJornada={manejarEliminarJornada}
            onCancelar={manejarCancelarVisita}
          />

        </section>
      )}

      {mostrarNuevaVisita && <NuevaVisitaModal visitas={visitas} catalogos={catalogos} guardando={guardando} onGuardar={guardarNuevaVisita} onCrearPunto={guardarPunto} onCerrar={() => { if (!guardando) setMostrarNuevaVisita(false); }} />}
      {visitaEditar && <EditarVisitaModal visita={visitaEditar} guardando={guardando} onGuardar={guardarDatosVisita} onCerrar={() => { if (!guardando) setVisitaEditar(null); }} />}
      {jornadaModal && <JornadaModal visita={jornadaModal.visita} jornada={jornadaModal.jornada} puntos={catalogos.puntos_vacunacion} guardando={guardando} onGuardar={guardarJornada} onCrearPunto={guardarPunto} onCerrar={() => { if (!guardando) setJornadaModal(null); }} />}
    </main>
  );
}
