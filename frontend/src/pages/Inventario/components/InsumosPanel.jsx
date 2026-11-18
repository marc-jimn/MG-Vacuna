import { useMemo, useState } from "react";
import { formatearCantidad, formatearFecha, numero } from "../inventarioUtils";

function ModalInsumo({ modo = "movimiento", insumo, onClose, onSubmit }) {
  const [tipo, setTipo] = useState("entrada");
  const [form, setForm] = useState(() => ({
    codigo: "",
    nombre: "",
    unidad: "Piezas",
    stock_minimo: String(insumo?.stock_minimo ?? 0),
    stock_objetivo_reposicion:
      insumo?.stock_objetivo_reposicion == null
        ? ""
        : String(insumo.stock_objetivo_reposicion),
    cantidad: "",
    fecha_operacion: new Date().toLocaleDateString("en-CA"),
    responsable: "",
    observaciones: "",
  }));

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const cambio = (campo, valor) =>
    setForm((actual) => ({ ...actual, [campo]: valor }));

  const esMovimiento = modo === "movimiento";
  const esConfig = modo === "config";

  const titulo =
    modo === "crear"
      ? "Agregar insumo al catálogo"
      : esConfig
        ? "Configurar nivel de reposición"
        : "Registrar movimiento de insumo";

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setEnviando(true);

    try {
      let body;

      if (modo === "crear") {
        body = {
          codigo: form.codigo,
          nombre: form.nombre,
          unidad: form.unidad,
          stock_minimo: Number(form.stock_minimo),
          stock_objetivo_reposicion:
            form.stock_objetivo_reposicion === ""
              ? null
              : Number(form.stock_objetivo_reposicion),
          observaciones: form.observaciones,
        };
      } else if (esConfig) {
        body = {
          stock_minimo: Number(form.stock_minimo),
          stock_objetivo_reposicion:
            form.stock_objetivo_reposicion === ""
              ? null
              : Number(form.stock_objetivo_reposicion),
        };
      } else {
        body = {
          insumo_id: Number(insumo.insumo_id),
          tipo_movimiento: tipo,
          cantidad: Number(form.cantidad),
          fecha_operacion: form.fecha_operacion,
          responsable: form.responsable,
          observaciones: form.observaciones,
        };
      }

      await onSubmit(modo, body);
      onClose();
    } catch (err) {
      setError(err.message || "No fue posible guardar el registro.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="inv-modal-backdrop"
      role="presentation"
      onMouseDown={(e) =>
        e.target === e.currentTarget && onClose()
      }
    >
      <section
        className="inv-modal inv-modal-narrow"
        role="dialog"
        aria-modal="true"
        aria-labelledby="insumo-modal-title"
      >
        <div className="inv-modal-head supply-modal-head">
          <div className="inv-modal-icon">
            <span className="material-symbols-rounded">
              inventory_2
            </span>
          </div>

          <div>
            <span className="inv-eyebrow">
              {insumo?.codigo || "NUEVO INSUMO"}
            </span>
            <h2 id="insumo-modal-title">{titulo}</h2>
            <p>
              {insumo?.nombre ||
                "Mantén actualizado el inventario general de materiales."}
            </p>
          </div>

          <button
            type="button"
            className="inv-icon-button"
            onClick={onClose}
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <form className="inv-modal-body" onSubmit={submit}>
          {modo === "crear" && (
            <div className="inv-form-grid">
              <div className="inv-field">
                <label>Código</label>
                <input
                  value={form.codigo}
                  onChange={(e) => cambio("codigo", e.target.value)}
                  placeholder="INS-025"
                  required
                />
              </div>

              <div className="inv-field">
                <label>Nombre</label>
                <input
                  value={form.nombre}
                  onChange={(e) => cambio("nombre", e.target.value)}
                  required
                />
              </div>

              <div className="inv-field">
                <label>Unidad</label>
                <select
                  value={form.unidad}
                  onChange={(e) => cambio("unidad", e.target.value)}
                >
                  {[
                    "Piezas",
                    "Cajas",
                    "Paquetes",
                    "Litros",
                    "Rollos",
                    "Frascos",
                    "Kilogramos",
                  ].map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {(esConfig || modo === "crear") && (
            <div className="inv-form-grid">
              <div className="inv-field">
                <label>Stock mínimo</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.stock_minimo}
                  onChange={(e) =>
                    cambio("stock_minimo", e.target.value)
                  }
                  required
                />
              </div>

              <div className="inv-field">
                <label>Objetivo de reposición</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.stock_objetivo_reposicion}
                  onChange={(e) =>
                    cambio("stock_objetivo_reposicion", e.target.value)
                  }
                  placeholder="Opcional"
                />
              </div>
            </div>
          )}
                    {esMovimiento && (
            <>
              <div className="inv-field">
                <label>Tipo de movimiento</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                >
                  <option value="entrada">
                    Entrada · Reabastecimiento
                  </option>
                  <option value="salida">
                    Salida · Consumo o retiro
                  </option>
                  <option value="ajuste_positivo">
                    Ajuste positivo
                  </option>
                  <option value="ajuste_negativo">
                    Ajuste negativo
                  </option>
                </select>
              </div>

              <div className="inv-form-grid">
                <div className="inv-field">
                  <label>Cantidad ({insumo?.unidad})</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.cantidad}
                    onChange={(e) =>
                      cambio("cantidad", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="inv-field">
                  <label>Fecha de operación</label>
                  <input
                    type="date"
                    value={form.fecha_operacion}
                    onChange={(e) =>
                      cambio("fecha_operacion", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="inv-field">
                <label>Responsable</label>
                <input
                  value={form.responsable}
                  onChange={(e) =>
                    cambio("responsable", e.target.value)
                  }
                  placeholder="Nombre de responsable"
                />
              </div>
            </>
          )}

          <div className="inv-field">
            <label>
              Observaciones{" "}
              {esMovimiento &&
                ["ajuste_positivo", "ajuste_negativo"].includes(tipo) && (
                  <em>Obligatorias</em>
                )}
            </label>

            <textarea
              rows="3"
              value={form.observaciones}
              onChange={(e) =>
                cambio("observaciones", e.target.value)
              }
              required={
                esMovimiento &&
                ["ajuste_positivo", "ajuste_negativo"].includes(tipo)
              }
              placeholder="Detalle del movimiento o notas…"
            />
          </div>

          {error && (
            <div className="inv-form-error">
              <span className="material-symbols-rounded">error</span>
              {error}
            </div>
          )}

          <div className="inv-modal-actions">
            <button
              type="button"
              className="inv-button light"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="inv-button supply-primary"
              disabled={enviando}
            >
              {enviando
                ? "Guardando…"
                : modo === "crear"
                  ? "Agregar insumo"
                  : esConfig
                    ? "Guardar configuración"
                    : "Registrar movimiento"}

              <span className="material-symbols-rounded">check</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function InsumosPanel({
  insumos = [],
  movimientos = [],
  onAbrirModal,
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [historialAbierto, setHistorialAbierto] = useState(false);

  const insumosFiltrados = useMemo(
    () =>
      insumos.filter((i) => {
        const texto =
          `${i.codigo} ${i.nombre} ${i.unidad}`.toLowerCase();

        const estado =
          filtro === "todos" ||
          (filtro === "bajo"
            ? i.bajo_stock_minimo
            : !i.bajo_stock_minimo);

        return texto.includes(busqueda.toLowerCase()) && estado;
      }),
    [insumos, busqueda, filtro]
  );

  const total = insumos.reduce(
    (s, i) => s + numero(i.existencia_actual),
    0
  );

  const bajos = insumos.filter((i) => i.bajo_stock_minimo);

  return (
    <div className="supply-panel">
      <section className="supply-overview-grid">
        <article className="supply-overview-card">
          <span className="supply-overview-icon">
            <span className="material-symbols-rounded">
              inventory_2
            </span>
          </span>
          <div>
            <small>Catálogo activo</small>
            <strong>{insumos.length}</strong>
            <span>tipos de insumo</span>
          </div>
        </article>

        <article className="supply-overview-card">
          <span className="supply-overview-icon">
            <span className="material-symbols-rounded">layers</span>
          </span>
          <div>
            <small>Existencias registradas</small>
            <strong>{formatearCantidad(total, 2)}</strong>
            <span>unidades acumuladas*</span>
          </div>
        </article>

        <article
          className={`supply-overview-card ${
            bajos.length ? "warning" : ""
          }`}
        >
          <span className="supply-overview-icon">
            <span className="material-symbols-rounded">
              production_quantity_limits
            </span>
          </span>
          <div>
            <small>Debajo del stock mínimo</small>
            <strong>{bajos.length}</strong>
            <span>requieren reabastecimiento</span>
          </div>
        </article>
      </section>

      <div className="supply-note">
        <span className="material-symbols-rounded">info</span>
        <span>
          *El total es una referencia general: cada material conserva
          su propia unidad de medida. No representa una cantidad homogénea.
        </span>
      </div>

      {bajos.length > 0 && (
        <section className="supply-reorder-banner">
          <div className="supply-reorder-icon">
            <span className="material-symbols-rounded">
              priority_high
            </span>
          </div>

          <div className="supply-reorder-copy">
            <strong>
              {bajos.length} insumos requieren reabastecimiento
            </strong>
            <span>
              {bajos
                .map(
                  (i) =>
                    `${i.nombre}: ${formatearCantidad(
                      i.cantidad_sugerida_reponer,
                      2
                    )} ${i.unidad.toLowerCase()}`
                )
                .join(" · ")}
            </span>
          </div>

          <button type="button" onClick={() => setFiltro("bajo")}>
            Ver pendientes
            <span className="material-symbols-rounded">
              arrow_forward
            </span>
          </button>
        </section>
      )}
            <section className="inv-white-card supply-catalog-card">
            <div className="inv-section-heading supply-heading">
              <div>
                <span className="inv-eyebrow">ALMACÉN GENERAL</span>
                <h2>Catálogo de insumos</h2>
                <p>
                  Existencias generales, sin asignación por campaña,
                  brigada o visita.
                </p>
              </div>

              <button
                type="button"
                className="page-heading-action page-heading-action-primary"
                onClick={() => onAbrirModal("crear")}
              >
                <span className="material-symbols-rounded">add</span>
                Agregar insumo
              </button>
            </div>

        <div className="supply-toolbar">
          <div className="inv-search">
            <span className="material-symbols-rounded">search</span>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar material por nombre o código…"
            />
          </div>

          <div className="supply-filters">
            <button
              className={filtro === "todos" ? "active" : ""}
              onClick={() => setFiltro("todos")}
              type="button"
            >
              Todos <span>{insumos.length}</span>
            </button>

            <button
              className={filtro === "bajo" ? "active" : ""}
              onClick={() => setFiltro("bajo")}
              type="button"
            >
              Stock bajo <span>{bajos.length}</span>
            </button>

            <button
              className={filtro === "normal" ? "active" : ""}
              onClick={() => setFiltro("normal")}
              type="button"
            >
              En nivel <span>{insumos.length - bajos.length}</span>
            </button>
          </div>
        </div>

        <div className="supply-table-wrap">
          <table className="supply-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Existencia actual</th>
                <th>Stock mínimo</th>
                <th>Último reabastecimiento</th>
                <th>Reposición sugerida</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {insumosFiltrados.map((i) => (
                <tr key={i.insumo_id}>
                  <td>
                    <div className="supply-name-cell">
                      <span className="supply-row-icon material-symbols-rounded">
                        inventory_2
                      </span>
                      <div>
                        <strong>{i.nombre}</strong>
                        <small>
                          {i.codigo} · {i.unidad}
                        </small>
                      </div>
                    </div>
                  </td>

                  <td>
                    <strong
                      className={
                        i.bajo_stock_minimo ? "supply-low-number" : ""
                      }
                    >
                      {formatearCantidad(i.existencia_actual, 2)}
                    </strong>
                    <small className="supply-unit">{i.unidad}</small>
                  </td>

                  <td>
                    {formatearCantidad(i.stock_minimo, 2)}
                    <small className="supply-unit">{i.unidad}</small>
                  </td>

                  <td>{formatearFecha(i.ultimo_reabastecimiento)}</td>

                  <td>
                    {numero(i.cantidad_sugerida_reponer) > 0 ? (
                      <strong className="supply-reorder-number">
                        +{formatearCantidad(i.cantidad_sugerida_reponer, 2)}
                      </strong>
                    ) : (
                      <span className="supply-muted">—</span>
                    )}
                  </td>

                  <td>
                    <span
                      className={`supply-status ${
                        i.bajo_stock_minimo ? "low" : "normal"
                      }`}
                    >
                      <span className="material-symbols-rounded">
                        {i.bajo_stock_minimo
                          ? "warning"
                          : "check_circle"}
                      </span>
                      {i.bajo_stock_minimo ? "Stock bajo" : "En nivel"}
                    </span>
                  </td>

                  <td>
                    <div className="supply-row-actions">
                      <button
                        type="button"
                        title="Registrar entrada o salida"
                        onClick={() => onAbrirModal("movimiento", i)}
                      >
                        <span className="material-symbols-rounded">
                          swap_vert
                        </span>
                      </button>

                      <button
                        type="button"
                        title="Configurar stock mínimo"
                        onClick={() => onAbrirModal("config", i)}
                      >
                        <span className="material-symbols-rounded">
                          tune
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {insumosFiltrados.length === 0 && (
            <div className="inv-empty compact">
              <span className="material-symbols-rounded">search_off</span>
              No hay insumos que coincidan con la búsqueda.
            </div>
          )}
        </div>
      </section>

      <section className="inv-white-card supply-history-card">
        <div className="inv-card-heading">
          <div>
            <span className="inv-eyebrow">REGISTRO DE OPERACIONES</span>
            <h3>Movimientos recientes de insumos</h3>
          </div>

          <button
            type="button"
            className="inv-text-button"
            onClick={() => setHistorialAbierto(!historialAbierto)}
          >
            {historialAbierto ? (
              <span className="history-link-text">Mostrar menos</span>
            ) : (
              <span className="history-link-text">Ver todos los cargados</span>
            )}

            <span className="material-symbols-rounded">
              {historialAbierto ? "keyboard_arrow_up" : "keyboard_arrow_down"}
            </span>
          </button>
        </div>

        <div className="supply-movement-list">
          {(historialAbierto
            ? movimientos
            : movimientos.slice(0, 4)
          ).map((m) => (
            <div className="supply-movement-row" key={m.id}>
              <span
                className={`supply-movement-icon ${
                  String(m.tipo_movimiento || "").includes("negativo") ||
                  m.tipo_movimiento === "salida"
                    ? "out"
                    : "in"
                }`}
              >
                <span className="material-symbols-rounded">
                  {String(m.tipo_movimiento || "").includes("negativo") ||
                  m.tipo_movimiento === "salida"
                    ? "south_west"
                    : "north_east"}
                </span>
              </span>

              <div>
                <strong>{m.insumo_nombre}</strong>
                <small>
                  {String(m.tipo_movimiento || "Movimiento").replaceAll(
                    "_",
                    " "
                  )}{" "}
                  · {formatearFecha(m.fecha_operacion)}
                  {m.responsable ? ` · ${m.responsable}` : ""}
                </small>
              </div>

              <b>
                {formatearCantidad(m.cantidad, 2)}{" "}
                <small>{m.unidad}</small>
              </b>
            </div>
          ))}

          {movimientos.length === 0 && (
            <div className="inv-empty compact">
              Aún no hay movimientos en el historial.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export { ModalInsumo };