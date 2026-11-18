import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader/PageHeader";
import BiologicosPanel, { ModalMovimientos } from "./components/BiologicosPanel";
import InsumosPanel, { ModalInsumo } from "./components/InsumosPanel";
import {
  obtenerResumenInventario,
  obtenerBiologicos,
  obtenerDetalleCampaniaBiologica,
  obtenerMovimientosBiologicos,
  registrarRecepcionBiologica,
  confirmarRecepcionProgramada,
  registrarMovimientoBiologico,
  obtenerInsumos,
  obtenerMovimientosInsumos,
  registrarMovimientoInsumo,
  crearInsumo,
  actualizarInsumo,
  extraerDatosRespuesta,
  obtenerMensajeErrorInventario,
} from "../../services/inventarioService";
import { formatearCantidad, numero } from "./inventarioUtils";
import "./Inventario.css";

const comoArray = (valor) => (Array.isArray(valor) ? valor : []);

export default function Inventario() {
  const [pestana, setPestana] = useState("biologicos");
  const [resumen, setResumen] = useState(null);
  const [campanias, setCampanias] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [movimientosBio, setMovimientosBio] = useState([]);
  const [movimientosInsumo, setMovimientosInsumo] = useState([]);
  const [campaniaSeleccionadaId, setCampaniaSeleccionadaId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [modalBio, setModalBio] = useState(null);
  const [modalInsumo, setModalInsumo] = useState(null);
  const [actualizando, setActualizando] = useState(false);

  const seleccionada = useMemo(
    () =>
      campanias.find(
        (item) => Number(item.campania_id) === Number(campaniaSeleccionadaId)
      ) || null,
    [campanias, campaniaSeleccionadaId]
  );

  // Carga base estable: no depende de la campaña seleccionada.
  const cargarBase = useCallback(async (mostrarCarga = true) => {
  const resultados = await Promise.allSettled([
    obtenerResumenInventario(),
    obtenerBiologicos(),
    obtenerInsumos(),
  ]);

  if (mostrarCarga) setCargando(true);
  setError("");

    const [rResumen, rBiologicos, rInsumos] = resultados;
    const dResumen = rResumen.status === "fulfilled"
      ? extraerDatosRespuesta(rResumen.value) || {}
      : {};
    const dBio = rBiologicos.status === "fulfilled"
      ? extraerDatosRespuesta(rBiologicos.value) || {}
      : {};
    const dInsumos = rInsumos.status === "fulfilled"
      ? extraerDatosRespuesta(rInsumos.value)
      : [];

    const relacionesCampaniaBiologico = comoArray(
      dBio.campanias || dResumen.biologicos || []
    );
    const listaLotes = comoArray(dBio.lotes);

    // El catálogo campanias_biologicos contiene relaciones de todo el sistema.
    // Inventario debe mostrar solo relaciones administradas en este módulo:
    // las que tienen una reserva mínima o al menos un lote registrado.
    const listaCampanias = relacionesCampaniaBiologico.filter((item) => {
      const tieneReserva = numero(item.stock_minimo) > 0;
      const tieneLote = listaLotes.some(
        (lote) =>
          Number(lote.campania_id) === Number(item.campania_id) &&
          Number(lote.biologico_id) === Number(item.biologico_id)
      );
      const tieneRecepcion =
        numero(item.dosis_recibidas) > 0 ||
        numero(item.dosis_programadas_recibir) > 0;
      return tieneReserva || tieneLote || tieneRecepcion;
    });

    const listaInsumos = Array.isArray(dInsumos)
      ? dInsumos
      : comoArray(dInsumos?.insumos || dResumen.insumos);

    setResumen(dResumen);
    setCampanias(listaCampanias);
    setLotes(listaLotes);
    setInsumos(listaInsumos);

    setCampaniaSeleccionadaId((actual) => {
      const existe = listaCampanias.some(
        (item) => Number(item.campania_id) === Number(actual)
      );
      return existe ? actual : listaCampanias[0]?.campania_id ?? null;
    });

    const fallos = resultados.filter((item) => item.status === "rejected");
    if (fallos.length > 0) {
      console.error("No se pudieron cargar todos los bloques del inventario:", fallos);
      setError(
        "Algunos datos del inventario no pudieron consultarse. Verifica que el backend esté activo y revisa la consola."
      );
    }

    if (mostrarCarga) setCargando(false);
    return { listaCampanias, listaLotes, listaInsumos, dResumen };
  }, []);

  // Carga de detalle y kardex; recibe el código como argumento para mantener
  // estable la función y evitar ciclos de useEffect.
  const cargarDetalle = useCallback(async (id, codigo, mostrarCarga = true) => {
    if (!id) return;

    if (mostrarCarga) setCargandoDetalle(true);
    const resultados = await Promise.allSettled([
      obtenerDetalleCampaniaBiologica(id),
      obtenerMovimientosBiologicos({ campania: codigo || id, limit: 120 }),
    ]);

    const [rDetalle, rMovimientos] = resultados;
    if (rDetalle.status === "fulfilled") {
      setDetalle(extraerDatosRespuesta(rDetalle.value) || null);
    } else {
      console.error("Error al cargar el detalle de campaña:", rDetalle.reason);
      setDetalle(null);
      setError(
        obtenerMensajeErrorInventario(
          rDetalle.reason,
          "No fue posible consultar el detalle de la campaña."
        )
      );
    }

    if (rMovimientos.status === "fulfilled") {
      const datos = extraerDatosRespuesta(rMovimientos.value);
      setMovimientosBio(
        Array.isArray(datos) ? datos : comoArray(datos?.movimientos)
      );
    } else {
      console.warn("No se pudo consultar el historial de biológicos:", rMovimientos.reason);
      setMovimientosBio([]);
    }

    if (mostrarCarga) setCargandoDetalle(false);
  }, []);

  const cargarMovimientosInsumo = useCallback(async () => {
    try {
      const respuesta = await obtenerMovimientosInsumos({ limit: 120 });
      const datos = extraerDatosRespuesta(respuesta);
      setMovimientosInsumo(
        Array.isArray(datos) ? datos : comoArray(datos?.movimientos)
      );
    } catch (err) {
      console.warn("No se pudieron consultar los movimientos de insumos:", err);
      setMovimientosInsumo([]);
    }
  }, []);

  // Efectos independientes, cada uno con dependencias estables y explícitas.
useEffect(() => {
  const iniciarCarga = async () => {
    await cargarBase(true);
  };

  iniciarCarga();
}, [cargarBase]);

const codigoCampaniaSeleccionada =
  seleccionada?.campania_codigo || null;

useEffect(() => {
  if (!campaniaSeleccionadaId) return;

  const iniciarCargaDetalle = async () => {
    await cargarDetalle(
      campaniaSeleccionadaId,
      codigoCampaniaSeleccionada,
      true
    );
  };

  iniciarCargaDetalle();
}, [
  campaniaSeleccionadaId,
  codigoCampaniaSeleccionada,
  cargarDetalle,
]);

useEffect(() => {
  const iniciarCargaMovimientos = async () => {
    await cargarMovimientosInsumo();
  };

  iniciarCargaMovimientos();
}, [cargarMovimientosInsumo]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const actualizarTodo = async () => {
    setActualizando(true);
    try {
      await cargarBase(false);
      await cargarMovimientosInsumo();
      if (campaniaSeleccionadaId) {
        await cargarDetalle(
          campaniaSeleccionadaId,
          codigoCampaniaSeleccionada,
          false
        );
      }
      window.dispatchEvent(new Event("mgv:notifications-updated"));
    } catch (err) {
      setError(obtenerMensajeErrorInventario(err));
    } finally {
      setActualizando(false);
    }
  };

  const seleccionarCampania = (campania) => {
    setCampaniaSeleccionadaId(campania?.campania_id ?? null);
    setDetalle(null);
    setMovimientosBio([]);
  };

  const ejecutarMovimientoBio = async (tipo, id, body) => {
    if (tipo === "confirmar") {
      await confirmarRecepcionProgramada(id, body);
    } else if (tipo === "recepcion") {
      await registrarRecepcionBiologica(body);
    } else {
      await registrarMovimientoBiologico(body);
    }

    setToast(
      tipo === "confirmar"
        ? "La recepción programada se confirmó correctamente."
        : tipo === "recepcion"
          ? "La recepción de biológico quedó registrada."
          : "El movimiento de dosis se registró correctamente."
    );

    await cargarBase(false);
    await cargarDetalle(
      campaniaSeleccionadaId,
      codigoCampaniaSeleccionada,
      false
    );
    window.dispatchEvent(new Event("mgv:notifications-updated"));
    return true;
  };

  const ejecutarMovimientoInsumo = async (modo, body) => {
    if (modo === "crear") {
      await crearInsumo(body);
    } else if (modo === "config") {
      await actualizarInsumo(modalInsumo.insumo.insumo_id, body);
    } else {
      await registrarMovimientoInsumo(body);
    }

    setToast(
      modo === "crear"
        ? "El insumo se agregó al catálogo."
        : modo === "config"
          ? "Los niveles de reposición se actualizaron."
          : "El movimiento de insumo quedó registrado."
    );

    await cargarBase(false);
    await cargarMovimientosInsumo();
    window.dispatchEvent(new Event("mgv:notifications-updated"));
    return true;
  };

  const estadisticas = useMemo(() => {
    const asignadas = campanias.reduce((s, c) => s + numero(c.dosis_asignadas), 0);
    const recibidas = campanias.reduce((s, c) => s + numero(c.dosis_recibidas), 0);
    const reserva = campanias.reduce((s, c) => s + numero(c.stock_minimo), 0);
    const alertas =
      numero(resumen?.alertas?.jornadas_con_diferencia) +
      numero(resumen?.alertas?.insumos_bajo_minimo) +
      numero(resumen?.alertas?.biologicos_bajo_minimo);
    return { asignadas, recibidas, reserva, alertas };
  }, [campanias, resumen]);

  return (
    <main className="inventario-page">
      <PageHeader
        titulo="Inventario"
        descripcion="Controla las existencias, la distribución de biológicos y los insumos operativos de MG-Vacuna."
      />

      {toast && (
        <div className="inv-toast">
          <span className="material-symbols-rounded">check_circle</span>
          {toast}
          <button type="button" onClick={() => setToast("")} aria-label="Cerrar aviso">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
      )}

      {error && (
        <div className="inv-feedback error">
          <span className="material-symbols-rounded">error</span>
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Cerrar error">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
      )}

      <section className="inv-welcome-strip">
        <div className="inv-welcome-copy">
          <span className="inv-eyebrow">GESTIÓN Y TRAZABILIDAD</span>
          <h2>Todo bajo control, dosis por dosis.</h2>
          <p>
            Consulta las existencias, documenta cada movimiento y detecta diferencias
            antes de que se conviertan en un problema.
          </p>
        </div>
        <div className="inv-welcome-art" aria-hidden="true">
          <div className="inv-art-circle large" />
          <div className="inv-art-circle small" />
          <span className="material-symbols-rounded">inventory_2</span>
          <i className="material-symbols-rounded">vaccines</i>
        </div>
        <button
          type="button"
          className="inv-refresh-button"
          onClick={actualizarTodo}
          disabled={actualizando}
          title="Actualizar inventario"
          aria-label="Actualizar inventario"
        >
          <span className={`material-symbols-rounded ${actualizando ? "inv-spin" : ""}`}>
            refresh
          </span>
        </button>
      </section>

      <section className="inv-overview-stats">
        <article className="inv-overview-card blue">
          <span className="inv-overview-icon"><span className="material-symbols-rounded">vaccines</span></span>
          <div><small>Dosis asignadas</small><strong>{formatearCantidad(estadisticas.asignadas)}</strong><span>en campañas</span></div>
        </article>
        <article className="inv-overview-card teal">
          <span className="inv-overview-icon"><span className="material-symbols-rounded">move_to_inbox</span></span>
          <div><small>Dosis recibidas</small><strong>{formatearCantidad(estadisticas.recibidas)}</strong><span>recepción física confirmada</span></div>
        </article>
        <article className="inv-overview-card amber">
          <span className="inv-overview-icon"><span className="material-symbols-rounded">shield</span></span>
          <div><small>Reserva mínima</small><strong>{formatearCantidad(estadisticas.reserva)}</strong><span>dosis protegidas para ajustes</span></div>
        </article>
        <article className={`inv-overview-card ${estadisticas.alertas ? "rose" : "green"}`}>
          <span className="inv-overview-icon"><span className="material-symbols-rounded">notifications_active</span></span>
          <div><small>Alertas para revisar</small><strong>{formatearCantidad(estadisticas.alertas)}</strong><span>conciliación y existencias</span></div>
        </article>
      </section>

      <section className="inv-workspace">
        <div className="inv-workspace-heading">
          <div><span className="inv-eyebrow">CENTRO DE ABASTECIMIENTO</span><h2>Administración de existencias</h2></div>
          <div className="inv-tabs" role="tablist" aria-label="Tipo de inventario">
            <button
              type="button"
              role="tab"
              aria-selected={pestana === "biologicos"}
              className={pestana === "biologicos" ? "active" : ""}
              onClick={() => setPestana("biologicos")}
            >
              <span className="material-symbols-rounded">vaccines</span>Biológicos
              <span className="inv-tab-count">{campanias.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={pestana === "insumos"}
              className={pestana === "insumos" ? "active supply" : "supply"}
              onClick={() => setPestana("insumos")}
            >
              <span className="material-symbols-rounded">inventory_2</span>Insumos
              <span className="inv-tab-count">{insumos.length}</span>
            </button>
          </div>
        </div>

        {cargando ? (
          <div className="inv-page-loading">
            <span className="inv-spinner" />
            <strong>Preparando el inventario</strong>
            <span>Estamos consultando existencias, lotes y movimientos…</span>
          </div>
        ) : pestana === "biologicos" ? (
          <BiologicosPanel
            campanias={campanias}
            lotes={lotes}
            seleccionada={seleccionada}
            detalle={detalle}
            movimientos={movimientosBio}
            onSeleccionar={seleccionarCampania}
            onAbrirModal={(modo, recepcionProgramada = null) =>
              setModalBio({ modo, recepcionProgramada })
            }
            cargandoDetalle={cargandoDetalle}
          />
        ) : (
          <InsumosPanel
            insumos={insumos}
            movimientos={movimientosInsumo}
            onAbrirModal={(modo, insumo = null) => setModalInsumo({ modo, insumo })}
          />
        )}
      </section>

      <div className="inv-footer-note">
        <span className="material-symbols-rounded">verified_user</span>
        <span>
          Los movimientos quedan registrados en el historial. Las existencias y alertas
          se actualizan desde el backend para conservar la trazabilidad.
        </span>
      </div>

      {modalBio && seleccionada && (
        <ModalMovimientos
          modoInicial={modalBio.modo}
          recepcionProgramada={modalBio.recepcionProgramada}
          campaign={seleccionada}
          detail={detalle}
          lotes={lotes}
          onClose={() => setModalBio(null)}
          onSubmit={ejecutarMovimientoBio}
        />
      )}

      {modalInsumo && (
        <ModalInsumo
          key={`${modalInsumo.modo}-${modalInsumo.insumo?.insumo_id || "nuevo"}`}
          modo={modalInsumo.modo}
          insumo={modalInsumo.insumo}
          onClose={() => setModalInsumo(null)}
          onSubmit={ejecutarMovimientoInsumo}
        />
      )}
    </main>
  );
}