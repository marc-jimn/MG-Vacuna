import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader/PageHeader";
import {
  obtenerNotificaciones,
  marcarNotificacionLeida,
  resolverNotificacion,
  obtenerInsumos,
  registrarMovimientoInsumo,
  extraerDatosRespuesta,
  obtenerMensajeErrorInventario,
} from "../../services/inventarioService";
import { ModalInsumo } from "../Inventario/components/InsumosPanel";
import { fechaRelativa } from "../Inventario/inventarioUtils";
import "./Notificaciones.css";

const comoArray = (valor) => (Array.isArray(valor) ? valor : []);

const iconoNotificacion = (item = {}) => {
  if (item.severidad === "danger") return "report";
  if (item.severidad === "warning") return "warning";
  if (item.severidad === "success") return "task_alt";
  if (String(item.tipo || "").includes("recepcion")) return "move_to_inbox";
  if (String(item.tipo || "").includes("stock")) return "inventory_2";
  return "notifications_active";
};

const etiquetaCategoria = (categoria) =>
  ({
    biologicos: "Biológicos",
    insumos: "Insumos",
    campanias: "Campañas",
    brigadas: "Brigadas",
    visitas: "Visitas",
    general: "General",
  })[categoria] || categoria || "General";

const etiquetaSeveridad = (severidad) =>
  ({
    danger: "Atención inmediata",
    warning: "Requiere atención",
    success: "Correcto",
    info: "Informativa",
  })[severidad] || "Notificación";

// Identifica las notificaciones de stock que requieren un movimiento.
const esNotificacionStockInsumo = (item = {}) => {
  const texto = `${item.tipo || ""} ${item.titulo || ""} ${item.mensaje || ""}`
    .toLowerCase();

  return (
    item.categoria === "insumos" &&
    (
      item.severidad === "danger" ||
      texto.includes("stock mínimo") ||
      texto.includes("stock minimo") ||
      texto.includes("stock bajo")
    )
  );
};

// Identifica devoluciones incompletas de dosis.
const esDevolucionIncompleta = (item = {}) => {
  const texto = `${item.tipo || ""} ${item.titulo || ""} ${item.mensaje || ""}`
    .toLowerCase();

  return (
    item.categoria === "biologicos" &&
    (
      texto.includes("devolución incompleta") ||
      texto.includes("devolucion incompleta") ||
      texto.includes("sin justificar")
    )
  );
};

// Las informativas solamente se marcan como leídas.
const esInformativa = (item = {}) =>
  item.severidad === "info";

export default function Notificaciones() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [pendientes, setPendientes] = useState(0);
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("activas");
  const [cargando, setCargando] = useState(true);
  const [actualizandoId, setActualizandoId] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [recarga, setRecarga] = useState(0);

  // Estado del formulario de reporte.
  const [reporteAbierto, setReporteAbierto] = useState(false);
  const [notificacionReporte, setNotificacionReporte] = useState(null);
  const [mensajeReporte, setMensajeReporte] = useState("");
  const [enviandoReporte, setEnviandoReporte] = useState(false);

  // Estado del formulario de movimiento de insumos.
  const [modalMovimientoAbierto, setModalMovimientoAbierto] = useState(false);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);
  const [notificacionMovimiento, setNotificacionMovimiento] = useState(null);

  // Carga de notificaciones.
  useEffect(() => {
    let vigente = true;

    const cargar = async () => {
      setCargando(true);
      setError("");

      try {
        const params =
          filtroEstado === "pendientes"
            ? { solo_pendientes: true, limit: 250 }
            : { limit: 250 };

        const respuesta = await obtenerNotificaciones(params);
        const datos = extraerDatosRespuesta(respuesta) || {};

        if (!vigente) return;

        setItems(
          comoArray(
            Array.isArray(datos) ? datos : datos.notificaciones
          )
        );

        setPendientes(Number(datos.pendientes || 0));
      } catch (err) {
        if (vigente) {
          setError(
            obtenerMensajeErrorInventario(
              err,
              "No fue posible cargar las notificaciones. Verifica que el backend esté activo."
            )
          );
          setItems([]);
        }
      } finally {
        if (vigente) setCargando(false);
      }
    };

    cargar();

    return () => {
      vigente = false;
    };
  }, [filtroEstado, recarga]);

  // Filtros de categoría y estado.
  const filtradas = useMemo(() => {
    return items.filter((item) => {
      const coincideCategoria =
        filtroCategoria === "todas" ||
        item.categoria === filtroCategoria;

      const coincideEstado =
        filtroEstado === "historico"
          ? Boolean(item.resuelta_at)
          : filtroEstado === "leidas"
            ? Boolean(item.leida_at) && !item.resuelta_at
            : filtroEstado === "activas"
              ? !item.resuelta_at
              : filtroEstado === "pendientes"
                ? !item.leida_at && !item.resuelta_at
                : true;

      return coincideCategoria && coincideEstado;
    });
  }, [items, filtroCategoria, filtroEstado]);
  
  // Marcar una notificación como leída.
  const marcarLeida = async (item) => {
    if (!item?.id || item.leida_at) return true;

    try {
      setActualizandoId(item.id);

      await marcarNotificacionLeida(item.id);

      setItems((actuales) =>
        actuales.map((x) =>
          String(x.id) === String(item.id)
            ? { ...x, leida_at: new Date().toISOString() }
            : x
        )
      );

      setPendientes((n) => Math.max(n - 1, 0));

      window.dispatchEvent(
        new Event("mgv:notifications-updated")
      );

      return true;
    } catch (err) {
      setError(obtenerMensajeErrorInventario(err));
      return false;
    } finally {
      setActualizandoId(null);
    }
  };

  // Resolver notificaciones normales.
  const resolver = async (item) => {
    if (!item?.id || esInformativa(item)) return;

    // Las devoluciones incompletas abren el formulario de reporte.
    if (esDevolucionIncompleta(item)) {
      setNotificacionReporte(item);
      setMensajeReporte("");
      setReporteAbierto(true);
      return;
    }

    // Las alertas de stock abren el formulario de movimiento.
    if (esNotificacionStockInsumo(item)) {
      await abrirFormularioMovimiento(item);
      return;
    }

    try {
      setActualizandoId(item.id);

      await resolverNotificacion(item.id);

      const ahora = new Date().toISOString();

      setItems((actuales) =>
        actuales.map((x) =>
          String(x.id) === String(item.id)
            ? {
                ...x,
                leida_at: x.leida_at || ahora,
                resuelta_at: ahora,
              }
            : x
        )
      );

      if (!item.leida_at) {
        setPendientes((n) => Math.max(n - 1, 0));
      }

      setMensaje("La notificación se marcó como resuelta.");

      window.dispatchEvent(
        new Event("mgv:notifications-updated")
      );
    } catch (err) {
      setError(obtenerMensajeErrorInventario(err));
    } finally {
      setActualizandoId(null);
    }
  };

  // Buscar el insumo relacionado con la notificación.
  const abrirFormularioMovimiento = async (item) => {
    try {
      setActualizandoId(item.id);
      setError("");

      const respuesta = await obtenerInsumos();
      const datos = extraerDatosRespuesta(respuesta);

      const lista = Array.isArray(datos)
        ? datos
        : comoArray(datos?.insumos);

      const insumo = lista.find((x) => {
        if (item.insumo_id) {
          return Number(x.insumo_id) === Number(item.insumo_id);
        }

        return (
          String(x.nombre || "").trim().toLowerCase() ===
          String(item.insumo_nombre || "").trim().toLowerCase()
        );
      });

      if (!insumo) {
        setError(
          "No se encontró el insumo relacionado con esta notificación. Verifica el registro en el inventario."
        );
        return;
      }

      setInsumoSeleccionado(insumo);
      setNotificacionMovimiento(item);
      setModalMovimientoAbierto(true);
    } catch (err) {
      setError(
        obtenerMensajeErrorInventario(
          err,
          "No fue posible consultar el insumo."
        )
      );
    } finally {
      setActualizandoId(null);
    }
  };

  // Registrar el movimiento y comprobar el stock actualizado.
  const ejecutarMovimientoNotificacion = async (modo, body) => {
    if (modo !== "movimiento" || !insumoSeleccionado) {
      throw new Error("No se encontró el insumo que se desea actualizar.");
    }

    await registrarMovimientoInsumo(body);

    // Consultar nuevamente el inventario después del movimiento.
    const respuesta = await obtenerInsumos();
    const datos = extraerDatosRespuesta(respuesta);

    const lista = Array.isArray(datos)
      ? datos
      : comoArray(datos?.insumos);

    const insumoActualizado = lista.find(
      (x) =>
        Number(x.insumo_id) === Number(insumoSeleccionado.insumo_id)
    );

    if (!insumoActualizado) {
      throw new Error(
        "El movimiento se registró, pero no fue posible verificar la existencia actualizada."
      );
    }

    const existencia = Number(insumoActualizado.existencia_actual || 0);
    const minimo = Number(insumoActualizado.stock_minimo || 0);

    // Solamente se resuelve cuando la existencia supera el mínimo.
    if (existencia > minimo) {
      const item = notificacionMovimiento;
      const ahora = new Date().toISOString();

      await resolverNotificacion(item.id);

      setItems((actuales) =>
        actuales.map((x) =>
          String(x.id) === String(item.id)
            ? {
                ...x,
                severidad: "success",
                leida_at: x.leida_at || ahora,
                resuelta_at: ahora,
                titulo: "Stock de insumo restablecido",
                mensaje: `La existencia de ${insumoActualizado.nombre} se encuentra por encima del stock mínimo. Existencia actual: ${existencia}.`,
              }
            : x
        )
      );

      if (!item.leida_at) {
        setPendientes((n) => Math.max(n - 1, 0));
      }

      setMensaje(
        "¡Correcto! El stock superó el mínimo establecido y la notificación fue resuelta."
      );
    } else {
      setMensaje(
        `El movimiento se registró, pero el stock todavía no supera el mínimo. Existencia: ${existencia}. Mínimo: ${minimo}. La alerta permanece activa.`
      );
    }

    setModalMovimientoAbierto(false);
    setInsumoSeleccionado(null);
    setNotificacionMovimiento(null);

    window.dispatchEvent(
      new Event("mgv:notifications-updated")
    );

    return true;
  };

  // Abrir directamente el módulo de inventario.
  const verReferencia = async (item) => {
    if (esNotificacionStockInsumo(item)) {
      const correcto = await marcarLeida(item);

      if (!correcto) return;

      navigate("/inventario", {
        state: {
          abrirModalInsumo: true,
          modoModalInsumo: "movimiento",
          insumoId: item.insumo_id || null,
          insumoNombre: item.insumo_nombre || null,
        },
      });

      return;
    }

    const correcto = await marcarLeida(item);

    if (correcto) {
      navigate("/inventario");
    }
  };

  // Formulario de reporte de devolución incompleta.
  const enviarReporte = async (event) => {
    event.preventDefault();

    if (!mensajeReporte.trim() || !notificacionReporte) return;

    try {
      setEnviandoReporte(true);
      setError("");

      const item = notificacionReporte;

      await resolverNotificacion(item.id);

      const ahora = new Date().toISOString();

      setItems((actuales) =>
        actuales.map((x) =>
          String(x.id) === String(item.id)
            ? {
                ...x,
                severidad: "success",
                leida_at: x.leida_at || ahora,
                resuelta_at: ahora,
                titulo: "Situación notificada",
                mensaje: `Reporte preparado para Centro de Soluciones: ${mensajeReporte.trim()}`,
              }
            : x
        )
      );

      if (!item.leida_at) {
        setPendientes((n) => Math.max(n - 1, 0));
      }

      setReporteAbierto(false);
      setNotificacionReporte(null);
      setMensajeReporte("");

      setMensaje(
        "La situación fue marcada como notificada y la alerta pasó a estado correcto."
      );

      window.dispatchEvent(
        new Event("mgv:notifications-updated")
      );
    } catch (err) {
      setError(obtenerMensajeErrorInventario(err));
    } finally {
      setEnviandoReporte(false);
    }
  };

  const cerrarReporte = () => {
    setReporteAbierto(false);
    setNotificacionReporte(null);
    setMensajeReporte("");
  };

  const cerrarModalMovimiento = () => {
    setModalMovimientoAbierto(false);
    setInsumoSeleccionado(null);
    setNotificacionMovimiento(null);
  };

  const contadores = useMemo(
    () => ({
      danger: items.filter(
        (x) => x.severidad === "danger" && !x.resuelta_at
      ).length,

      warning: items.filter(
        (x) => x.severidad === "warning" && !x.resuelta_at
      ).length,

      success: items.filter(
        (x) => x.severidad === "success"
      ).length,
    }),
    [items]
  );
  
  return (
    <main className="notifications-page">
      <PageHeader
        titulo="Centro de notificaciones"
        descripcion="Avisos de inventario, conciliaciones y movimientos importantes de MG-Vacuna."
      />

      {error && (
        <div className="notif-feedback error">
          <span className="material-symbols-rounded">error</span>
          {error}
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Cerrar error"
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
      )}

      {mensaje && (
        <div className="notif-feedback success">
          <span className="material-symbols-rounded">check_circle</span>
          {mensaje}
          <button
            type="button"
            onClick={() => setMensaje("")}
            aria-label="Cerrar mensaje"
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
      )}

      <section className="notif-overview">
        <div className="notif-overview-copy">
          <span className="notif-eyebrow">
            SEGUIMIENTO DEL SISTEMA
          </span>

          <h2>Las señales importantes, en un solo lugar.</h2>

          <p>
            Consulta los avisos recientes y da seguimiento
            a las incidencias que requieren atención.
          </p>
        </div>

        <div className="notif-overview-stats">
          <div className="notif-stat red">
            <span className="material-symbols-rounded">report</span>
            <div>
              <strong>{contadores.danger}</strong>
              <small>Críticas</small>
            </div>
          </div>

          <div className="notif-stat amber">
            <span className="material-symbols-rounded">warning</span>
            <div>
              <strong>{contadores.warning}</strong>
              <small>Preventivas</small>
            </div>
          </div>

          <div className="notif-stat green">
            <span className="material-symbols-rounded">task_alt</span>
            <div>
              <strong>{contadores.success}</strong>
              <small>Correctas</small>
            </div>
          </div>
        </div>
      </section>

      <section className="notif-workspace">
        <div className="notif-toolbar">
          <div className="notif-toolbar-title">
            <span className="notif-eyebrow">BANDEJA DE AVISOS</span>
            <h2>
              Todas las notificaciones{" "}
              <span>{filtradas.length}</span>
            </h2>
          </div>

          <button
            type="button"
            className="notif-refresh"
            onClick={() => setRecarga((actual) => actual + 1)}
            disabled={cargando}
          >
            <span
              className={`material-symbols-rounded ${
                cargando ? "notif-spin" : ""
              }`}
            >
              refresh
            </span>
            Actualizar
          </button>
        </div>

        <div className="notif-filters">
          <div
            className="notif-filter-group"
            role="group"
            aria-label="Filtrar por estado"
          >
            {[
              ["activas", "Activas"],
              ["pendientes", "Sin leer"],
              ["leidas", "Leídas"],
              ["historico", "Resueltas"],
            ].map(([valor, etiqueta]) => (
              <button
                type="button"
                key={valor}
                className={filtroEstado === valor ? "active" : ""}
                onClick={() => setFiltroEstado(valor)}
              >
                {etiqueta}
                {valor === "pendientes" && (
                  <span>{pendientes}</span>
                )}
              </button>
            ))}
          </div>

          <div className="notif-category-select">
            <span className="material-symbols-rounded">filter_list</span>

            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="todas">Todas las categorías</option>
              <option value="biologicos">Biológicos</option>
              <option value="insumos">Insumos</option>
              <option value="campanias">Campañas</option>
              <option value="brigadas">Brigadas</option>
              <option value="visitas">Visitas</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>

        {cargando ? (
          <div className="notif-loading">
            <span className="notif-spinner" />
            <strong>Consultando avisos…</strong>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="notif-empty">
            <span className="material-symbols-rounded">
              notifications_none
            </span>
            <strong>No hay notificaciones en esta sección</strong>
            <span>
              Cuando se registre un movimiento o se detecte
              alguna situación, aparecerá aquí.
            </span>
          </div>
        ) : (
          <div className="notif-list">
            {filtradas.map((item) => (
              <article
                key={item.id}
                className={`notif-card severity-${
                  item.severidad || "info"
                } ${!item.leida_at ? "unread" : ""} ${
                  item.resuelta_at ? "resolved" : ""
                }`}
              >
                <div className="notif-card-icon">
                  <span className="material-symbols-rounded">
                    {iconoNotificacion(item)}
                  </span>
                </div>

                <div className="notif-card-main">
                  <div className="notif-card-meta">
                    <span
                      className={`notif-severity-pill ${
                        item.severidad || "info"
                      }`}
                    >
                      {etiquetaSeveridad(item.severidad)}
                    </span>

                    <span className="notif-category-pill">
                      {etiquetaCategoria(item.categoria)}
                    </span>

                    {!item.leida_at && (
                      <span className="notif-unread-dot">Nueva</span>
                    )}

                    {item.resuelta_at && (
                      <span className="notif-resolved-pill">
                        Resuelta
                      </span>
                    )}
                  </div>

                  <h3>{item.titulo || "Notificación"}</h3>

                  <p>
                    {item.mensaje ||
                      "Hay una actualización en el sistema."}
                  </p>

                  <div className="notif-card-foot">
                    <span>
                      <span className="material-symbols-rounded">
                        schedule
                      </span>
                      {fechaRelativa(item.fecha_creacion)}
                    </span>

                    {item.campania_codigo && (
                      <span>
                        <span className="material-symbols-rounded">
                          campaign
                        </span>
                        {item.campania_codigo}
                      </span>
                    )}

                    {item.visita_codigo && (
                      <span>
                        <span className="material-symbols-rounded">
                          event_note
                        </span>
                        {item.visita_codigo}
                      </span>
                    )}

                    {item.insumo_nombre && (
                      <span>
                        <span className="material-symbols-rounded">
                          inventory_2
                        </span>
                        {item.insumo_nombre}
                      </span>
                    )}
                  </div>
                </div>

                <div className="notif-card-actions">
                  {!item.leida_at && (
                    <button
                      type="button"
                      className="notif-action secondary"
                      onClick={() => marcarLeida(item)}
                      disabled={actualizandoId === item.id}
                    >
                      Marcar leída
                    </button>
                  )}

                  {/* Alertas de stock: ahora se resuelven mediante movimiento. */}
                  {!item.resuelta_at &&
                    esNotificacionStockInsumo(item) && (
                      <button
                        type="button"
                        className="notif-action resolve"
                        onClick={() => resolver(item)}
                        disabled={actualizandoId === item.id}
                      >
                        <span className="material-symbols-rounded">
                          swap_vert
                        </span>
                        Resolver
                      </button>
                    )}

                  {/* Devoluciones incompletas. */}
                  {!item.resuelta_at &&
                    esDevolucionIncompleta(item) && (
                      <button
                        type="button"
                        className="notif-action resolve"
                        onClick={() => resolver(item)}
                      >
                        Notificar situación
                      </button>
                    )}

                  {/* Resolver notificaciones normales. */}
                  {!item.resuelta_at &&
                    !esInformativa(item) &&
                    !esNotificacionStockInsumo(item) &&
                    !esDevolucionIncompleta(item) &&
                    item.severidad !== "success" && (
                      <button
                        type="button"
                        className="notif-action resolve"
                        onClick={() => resolver(item)}
                        disabled={actualizandoId === item.id}
                      >
                        <span className="material-symbols-rounded">
                          done
                        </span>
                        Resolver
                      </button>
                    )}

                  {/* Acceso habitual para otras notificaciones. */}
                  {!esInformativa(item) &&
                    !esNotificacionStockInsumo(item) && (
                      <button
                        type="button"
                        className="notif-action view"
                        onClick={() => verReferencia(item)}
                        disabled={actualizandoId === item.id}
                      >
                        Ver módulo
                        <span className="material-symbols-rounded">
                          arrow_outward
                        </span>
                      </button>
                    )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="notif-footer-note">
        <span className="material-symbols-rounded">history</span>
        Las notificaciones resueltas permanecen en el historial.
        Los avisos automáticos se actualizan cuando la situación
        que los originó cambia.
      </div>

      {/* MODAL DE REPORTE DE DEVOLUCIÓN INCOMPLETA */}
      {reporteAbierto && notificacionReporte && (
        <div
          className="notif-report-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              cerrarReporte();
            }
          }}
        >
          <section
            className="notif-report-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notif-report-title"
          >
            <div className="notif-report-header">
              <div className="notif-report-icon">
                <span className="material-symbols-rounded">
                  campaign
                </span>
              </div>

              <button
                type="button"
                className="notif-report-close"
                onClick={cerrarReporte}
                aria-label="Cerrar formulario"
              >
                <span className="material-symbols-rounded">close</span>
              </button>

              <span className="notif-eyebrow">
                CENTRO DE SOLUCIONES
              </span>

              <h2 id="notif-report-title">
                Notificar situación
              </h2>

              <p>
                Ayúdanos a documentar lo ocurrido con esta
                devolución para darle seguimiento.
              </p>
            </div>

            <form
              className="notif-report-body"
              onSubmit={enviarReporte}
            >
              <div className="notif-report-context">
                <span className="material-symbols-rounded">
                  warning
                </span>

                <div>
                  <strong>
                    {notificacionReporte.titulo ||
                      "Devolución incompleta"}
                  </strong>

                  <p>
                    {notificacionReporte.mensaje ||
                      "Se detectaron dosis pendientes de justificar."}
                  </p>
                </div>
              </div>

              <div className="notif-report-field">
                <label htmlFor="mensaje-reporte">
                  Mensaje o descripción de la situación
                </label>

                <textarea
                  id="mensaje-reporte"
                  rows="5"
                  value={mensajeReporte}
                  onChange={(e) =>
                    setMensajeReporte(e.target.value)
                  }
                  placeholder="Describe qué ocurrió, si existe alguna aclaración o qué acciones se están tomando para solucionar la situación..."
                  required
                  maxLength={1000}
                />

                <small>
                  {mensajeReporte.length}/1000 caracteres
                </small>
              </div>

              <div className="notif-report-notice">
                <span className="material-symbols-rounded">info</span>
                <p>
                  Registra la aclaración correspondiente a esta situación,
                  incluyendo los acuerdos o explicaciones previamente
                  establecidos con el coordinador de campaña. La información
                  proporcionada permitirá documentar lo sucedido y justificar
                  las dosis pendientes de devolución. Al enviar la aclaración,
                  la notificación se marcará como atendida.
                </p>
              </div>

              <div className="notif-report-actions">
                <button
                  type="button"
                  className="notif-report-cancel"
                  onClick={cerrarReporte}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="notif-report-submit"
                  disabled={
                    enviandoReporte || !mensajeReporte.trim()
                  }
                >
                  <span className="material-symbols-rounded">
                    send
                  </span>

                  {enviandoReporte
                    ? "Preparando reporte..."
                    : "Enviar a Centro de Soluciones"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* MODAL DE MOVIMIENTO DE INSUMO */}
      {modalMovimientoAbierto && insumoSeleccionado && (
        <ModalInsumo
          key={`notificacion-${insumoSeleccionado.insumo_id}`}
          modo="movimiento"
          insumo={insumoSeleccionado}
          onClose={cerrarModalMovimiento}
          onSubmit={ejecutarMovimientoNotificacion}
        />
      )}
    </main>
  );
}