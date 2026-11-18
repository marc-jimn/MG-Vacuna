import { useCallback, useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/PageHeader/PageHeader";
import {
  obtenerVisitasParaRutas,
  obtenerRecorridosPorVisita,
  calcularRecorridosVisita,
} from "../../services/rutaService";

import MapaRutas from "./components/MapaRutas";
import AcordeonCampanias from "./components/AcordeonCampanias";

import {
  extraerLista,
  extraerRutas,
  agruparCampanias,
  obtenerMensajeError,
} from "./rutasUtils";

import "./RutasRecorridos.css";

export default function RutasRecorridos() {
  const [visitas, setVisitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const [visitaSeleccionadaId, setVisitaSeleccionadaId] = useState(null);
  const [jornadaSeleccionadaId, setJornadaSeleccionadaId] = useState(null);
  const [rutasSeleccionadas, setRutasSeleccionadas] = useState([]);
  const [visitaEnCarga, setVisitaEnCarga] = useState(null);

  const cargarVisitas = useCallback(async (mostrarCarga = true) => {
    try {
      if (mostrarCarga) setCargando(true);
      setError("");
      const respuesta = await obtenerVisitasParaRutas();
      setVisitas(extraerLista(respuesta));
    } catch (errorCarga) {
      console.error("Error al cargar visitas para rutas:", errorCarga);
      setError(obtenerMensajeError(errorCarga, "No fue posible cargar las visitas."));
    } finally {
      if (mostrarCarga) setCargando(false);
    }
  }, []);

  useEffect(() => {
  const inicializar = async () => {
    await cargarVisitas();
  };

  inicializar();
}, [cargarVisitas]);

  useEffect(() => {
    if (!mensaje) return undefined;
    const temporizador = setTimeout(() => setMensaje(""), 4200);
    return () => clearTimeout(temporizador);
  }, [mensaje]);

  const visitasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return visitas.filter((visita) => {
      const coincideEstado =
        filtroEstado === "todos" || visita.estado === filtroEstado;

      const valores = [
        visita.codigo,
        visita.nombre,
        visita.campania_codigo,
        visita.campania_nombre,
        visita.brigada_codigo,
        visita.brigada_nombre,
        visita.localidad,
        ...(visita.jornadas || []).map((jornada) => jornada.punto_vacunacion),
      ];

      const coincideBusqueda =
        !texto || valores.filter(Boolean).some((valor) =>
          String(valor).toLowerCase().includes(texto)
        );

      return coincideEstado && coincideBusqueda;
    });
  }, [visitas, busqueda, filtroEstado]);

  const campanias = useMemo(
    () => agruparCampanias(visitasFiltradas),
    [visitasFiltradas]
  );

  const estadisticas = useMemo(() => {
    const brigadas = new Set(visitas.map((visita) => visita.brigada_id));
    const jornadas = visitas.reduce(
      (total, visita) => total + (visita.jornadas || []).length,
      0
    );

    return {
      campanias: new Set(visitas.map((visita) => visita.campania_id)).size,
      brigadas: brigadas.size,
      visitas: visitas.length,
      jornadas,
    };
  }, [visitas]);

  const dibujarRecorrido = async (visita, jornadaId = null) => {
    try {
      setVisitaEnCarga(visita.id);
      setError("");
      setMensaje("");

      // Primero consultamos los recorridos existentes. Así no recalculamos
      // una ruta que ya fue guardada correctamente.
      let filas = [];

      try {
        const respuestaExistente = await obtenerRecorridosPorVisita(visita.id);
        filas = extraerRutas(respuestaExistente);
      } catch (errorConsulta) {
        // Si la visita aún no tiene recorridos creados, el POST puede prepararlos.
        console.warn("No se pudieron consultar recorridos existentes:", errorConsulta);
      }

      const necesitaCalculo =
        filas.length === 0 ||
        filas.some((ruta) =>
          ruta.jornada_estado !== "cancelada" &&
          (ruta.recorrido_estado !== "calculado" || !ruta.geometria)
        );

      if (necesitaCalculo) {
        const respuestaCalculo = await calcularRecorridosVisita(visita.id);
        const calculados = extraerRutas(respuestaCalculo);
        if (calculados.length > 0) filas = calculados;

        const resumen = respuestaCalculo?.datos?.resumen;
        if (resumen?.errores > 0) {
          setMensaje(
            `Se dibujaron ${resumen.calculados} recorridos; ${resumen.errores} necesitan revisión.`
          );
        } else if (resumen) {
          setMensaje(`¡Listo! Se prepararon ${resumen.calculados} recorridos de ${visita.codigo}.`);
        }
      } else {
        setMensaje(`Se cargaron los recorridos guardados de ${visita.codigo}.`);
      }

      setRutasSeleccionadas(filas);
      setVisitaSeleccionadaId(visita.id);
      setJornadaSeleccionadaId(
        jornadaId || filas[0]?.jornada_id || visita.jornadas?.[0]?.id || null
      );
    } catch (errorRuta) {
      console.error("Error al preparar recorridos:", errorRuta);
      setError(
        obtenerMensajeError(
          errorRuta,
          "No fue posible calcular los recorridos. Revisa la conexión con el servicio de rutas."
        )
      );

      // Si el cálculo devolvió parcialmente o existe algún recorrido guardado,
      // no borramos lo que ya se encontraba visible.
    } finally {
      setVisitaEnCarga(null);
    }
  };

  const seleccionarJornada = (visita, jornada) => {
    if (Number(visita.id) === Number(visitaSeleccionadaId)) {
      setJornadaSeleccionadaId(jornada.id);
      return;
    }

    dibujarRecorrido(visita, jornada.id);
  };

  const limpiarMapa = () => {
    setRutasSeleccionadas([]);
    setVisitaSeleccionadaId(null);
    setJornadaSeleccionadaId(null);
    setMensaje("");
  };

  const actualizarTodo = async () => {
    await cargarVisitas(false);
    if (visitaSeleccionadaId) {
      const visita = visitas.find(
        (item) => Number(item.id) === Number(visitaSeleccionadaId)
      );
      if (visita) await dibujarRecorrido(visita, jornadaSeleccionadaId);
    }
  };

  return (
    <main className="rutas-page">
      <PageHeader
        titulo="Rutas y Recorridos"
        descripcion="Visualiza los puntos de vacunación, sigue el avance de cada visita y consulta sus recorridos desde la Jurisdicción Sanitaria 1."
      />

      {mensaje && (
        <div className="rutas-feedback success">
          <span className="material-symbols-rounded">check_circle</span>
          <span>{mensaje}</span>
          <button type="button" onClick={() => setMensaje("")} aria-label="Cerrar mensaje">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
      )}

      {error && (
        <div className="rutas-feedback error">
          <span className="material-symbols-rounded">error</span>
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Cerrar mensaje">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
      )}

      <section className="rutas-stats">
        <article className="rutas-stat-card">
          <span className="material-symbols-rounded">campaign</span>
          <div><small>Campañas</small><strong>{estadisticas.campanias}</strong></div>
        </article>
        <article className="rutas-stat-card">
          <span className="material-symbols-rounded">groups</span>
          <div><small>Brigadas</small><strong>{estadisticas.brigadas}</strong></div>
        </article>
        <article className="rutas-stat-card">
          <span className="material-symbols-rounded">event_note</span>
          <div><small>Visitas</small><strong>{estadisticas.visitas}</strong></div>
        </article>
        <article className="rutas-stat-card">
          <span className="material-symbols-rounded">location_on</span>
          <div><small>Puntos programados</small><strong>{estadisticas.jornadas}</strong></div>
        </article>
      </section>

      <section className="rutas-origin-strip">
        <span className="rutas-origin-strip-icon material-symbols-rounded">account_balance</span>
        <div>
          <small>PUNTO DE PARTIDA DE LOS RECORRIDOS</small>
          <strong>Jurisdicción Sanitaria 1</strong>
          <span>Av. 10ª Norte Poniente #987 · Tuxtla Gutiérrez, Chiapas</span>
        </div>
        <span className="rutas-origin-coordinate">16.7601, -93.1235</span>
      </section>

      <section className="rutas-layout">
        <div className="rutas-map-column">
          <div className="rutas-section-head">
            <div>
              <span className="rutas-section-kicker">VISUALIZACIÓN GEOGRÁFICA</span>
              <h2>Mapa de recorridos</h2>
            </div>
            <div className="rutas-map-head-actions">
              {visitaSeleccionadaId && (
                <button type="button" onClick={limpiarMapa} className="rutas-map-clear">
                  <span className="material-symbols-rounded">layers_clear</span>
                  Limpiar mapa
                </button>
              )}
              <button type="button" onClick={actualizarTodo} className="rutas-map-refresh" title="Actualizar información">
                <span className="material-symbols-rounded">refresh</span>
              </button>
            </div>
          </div>

          <div className="rutas-map-card">
            <MapaRutas
              rutas={rutasSeleccionadas}
              seleccionadoJornadaId={jornadaSeleccionadaId}
              mostrarOrigen
            />
          </div>

          <div className="rutas-map-caption">
            <span className="material-symbols-rounded">info</span>
            <p>Las líneas muestran el recorrido de ida y regreso por calles. Las etiquetas permanecen ancladas a cada punto de vacunación.</p>
          </div>
        </div>

        <aside className="rutas-sidebar">
          <div className="rutas-sidebar-heading">
            <div>
              <span className="rutas-section-kicker">PLAN OPERATIVO</span>
              <h2>Campañas y visitas</h2>
              <p>Despliega cada campaña para ver sus brigadas y paradas.</p>
            </div>
            <span className="rutas-sidebar-icon material-symbols-rounded">tactic</span>
          </div>

          <div className="rutas-sidebar-filters">
            <label className="rutas-search">
              <span className="material-symbols-rounded">search</span>
              <input
                type="search"
                placeholder="Buscar campaña, brigada, visita o punto..."
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
              />
            </label>

            <select value={filtroEstado} onChange={(evento) => setFiltroEstado(evento.target.value)} aria-label="Filtrar por estado de visita">
              <option value="todos"> Todos</option>
              <option value="planeada">Planeadas</option>
              <option value="activa">En curso</option>
              <option value="completada">Completadas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>

          {cargando ? (
            <div className="rutas-loading">
              <span className="material-symbols-rounded">progress_activity</span>
              <strong>Organizando campañas...</strong>
              <small>Consultando las visitas y sus puntos.</small>
            </div>
          ) : campanias.length === 0 ? (
            <div className="rutas-empty">
              <span className="material-symbols-rounded">travel_explore</span>
              <strong>No encontramos visitas</strong>
              <small>Prueba con otra búsqueda o estado.</small>
              <button type="button" onClick={() => { setBusqueda(""); setFiltroEstado("todos"); }}>Limpiar filtros</button>
            </div>
          ) : (
            <AcordeonCampanias
              campanias={campanias}
              visitaSeleccionadaId={visitaSeleccionadaId}
              jornadaSeleccionadaId={jornadaSeleccionadaId}
              rutasSeleccionadas={rutasSeleccionadas}
              visitaEnCarga={visitaEnCarga}
              onDibujar={dibujarRecorrido}
              onSeleccionarJornada={seleccionarJornada}
            />
          )}

          <div className="rutas-sidebar-footnote">
            <span className="material-symbols-rounded">route</span>
            <p>Un recorrido por cada punto: <strong>Jurisdicción → punto de vacunación → Jurisdicción.</strong></p>
          </div>
        </aside>
      </section>
    </main>
  );
}
