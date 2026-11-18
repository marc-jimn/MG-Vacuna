import {useEffect, useState, useTransition} from "react";

import PageHeader from "../../components/PageHeader/PageHeader";
import { obtenerReportes } from "../../services/tableroService";

import TendenciaMensual from "./components/TendenciaMensual";
import DesempenoCampanias from "./components/DesempenoCampanias";
import DistribucionTerritorial from "./components/DistribucionTerritorial";
import DesempenoBrigadas from "./components/DesempenoBrigadas";
import ControlInventario from "./components/ControlInventario";

import {
  cantidad,
  fechaISO,
  numero,
  porcentaje
} from "./reportesUtils";

import "./Reportes.css";

const hoy = new Date();

const filtrosIniciales = {
  desde: `${hoy.getFullYear()}-01-01`,
  hasta: fechaISO(hoy),
  campania_id: ""
};


// EXPORTAR REPORTES A CSV
const exportarCSV = (datos) => {
  const filas = [
    ["CAMPAÑAS"],

    [
      "Código",
      "Campaña",
      "Categoría",
      "Jornadas",
      "Visitas",
      "Dosis asignadas",
      "Objetivo",
      "Aplicadas",
      "Cumplimiento %"
    ],

    ...datos.campanias.map((x) => [
      x.campania_codigo,
      x.campania_nombre,
      x.campania_categoria,
      x.jornadas,
      x.visitas,
      x.dosis_asignadas,
      x.objetivo_vacunacion,
      x.dosis_aplicadas,
      x.cumplimiento_objetivo
    ]),

    [],

    ["LOCALIDADES"],

    [
      "Código",
      "Localidad",
      "Jornadas",
      "Visitas",
      "Dosis asignadas",
      "Objetivo",
      "Aplicadas",
      "Cumplimiento %"
    ],

    ...datos.localidades.map((x) => [
      x.localidad_codigo,
      x.localidad_nombre,
      x.jornadas,
      x.visitas,
      x.dosis_asignadas,
      x.objetivo_vacunacion,
      x.dosis_aplicadas,
      x.cumplimiento_objetivo
    ]),

    [],

    ["BRIGADAS"],

    [
      "Código",
      "Brigada",
      "Campaña",
      "Jornadas",
      "Visitas",
      "Dosis asignadas",
      "Objetivo",
      "Aplicadas",
      "Cumplimiento %"
    ],

    ...datos.brigadas.map((x) => [
      x.brigada_codigo,
      x.brigada_nombre,
      x.campania_codigo,
      x.jornadas,
      x.visitas,
      x.dosis_asignadas,
      x.objetivo_vacunacion,
      x.dosis_aplicadas,
      x.cumplimiento_objetivo
    ])
  ];

  const csv =
    "\uFEFF" +
    filas
      .map((fila) =>
        fila
          .map((valor) =>
            `"${String(valor ?? "").replaceAll('"', '""')}"`
          )
          .join(",")
      )
      .join("\r\n");

  const url = URL.createObjectURL(
    new Blob([csv], {
      type: "text/csv;charset=utf-8"
    })
  );

  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `mg-vacuna-reportes-${datos.filtros.desde}-${datos.filtros.hasta}.csv`;
  document.body.appendChild(enlace);

  enlace.click();
  enlace.remove();

  URL.revokeObjectURL(url);
};

export default function Reportes() {
  const [, startTransition] = useTransition();
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosIniciales);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // CONSULTAR REPORTES
useEffect(() => {
  let activo = true;

  obtenerReportes(filtrosAplicados)
    .then((respuesta) => {
      if (activo) {
        startTransition(() => {
          setDatos(respuesta);
          setError("");
        });
      }
    })
    .catch((err) => {
      console.error(
        "No fue posible generar los reportes:",
        err
      );

      if (activo) {
        setError(
          err.response?.data?.mensaje ||
          "No fue posible consultar los reportes. Verifica que el backend esté activo."
        );
      }
    })
    .finally(() => {
      if (activo) {
        setCargando(false);
      }
    });

  return () => {
    activo = false;
  };

}, [filtrosAplicados]);

  // RESUMEN DE RESULTADOS
  const resumen = datos?.resumen || {};

  // CAMBIAR FILTROS
  const cambiarFiltro = (campo, valor) => {

    setFiltros((actual) => ({
      ...actual,
      [campo]: valor
    }));

  };

  // APLICAR FILTROS
const aplicarFiltros = (event) => {
  event.preventDefault();
  setCargando(true);
  setError("");
  setFiltrosAplicados({
    ...filtros
  });
};

  // RESTABLECER FILTROS
  const limpiarFiltros = () => {
    setCargando(true);
    setError("");

    setFiltros({
      ...filtrosIniciales
    });

    setFiltrosAplicados({
      ...filtrosIniciales
    });
  };

  return (
    <main className="reportes-page">
      <PageHeader
        titulo="Reportes"
        descripcion="Analiza el desempeño de las campañas, la cobertura territorial y los resultados de las jornadas de vacunación."
      />
            {/* BANNER DE INTRODUCCIÓN */}

      <section className="rep-intro-banner">

        <div className="rep-intro-copy">

          <span className="rep-eyebrow">
            ANÁLISIS Y EVALUACIÓN
          </span>

          <h2>
            Resultados para orientar las decisiones.
          </h2>

          <p>
            Consulta el avance de las campañas, compara
            brigadas y revisa la distribución de las dosis
            dentro del periodo seleccionado.
          </p>

        </div>

        <div className="rep-intro-art">

          <span className="material-symbols-rounded">
            analytics
          </span>

          <i className="material-symbols-rounded">
            query_stats
          </i>
        </div>

        <div className="rep-intro-period">
          <span className="material-symbols-rounded">
            calendar_month
          </span>

          {datos?.filtros?.desde || filtrosAplicados.desde}

          {" — "}

          {datos?.filtros?.hasta || filtrosAplicados.hasta}

        </div>

      </section>


      {/* MENSAJE DE ERROR */}

      {error && (

        <div className="rep-feedback error">

          <span className="material-symbols-rounded">
            error
          </span>

          {error}

          <button
            type="button"
            onClick={() =>
              setFiltrosAplicados({
                ...filtrosAplicados
              })
            }
          >
            Reintentar
          </button>

        </div>
      )}
            {/* PANEL DE FILTROS */}

      <form
        className="rep-filter-panel"
        onSubmit={aplicarFiltros}
      >

        <div className="rep-filter-heading">

          <div>

            <span className="rep-eyebrow">
              PARÁMETROS DEL INFORME
            </span>

            <strong>
              Personaliza el análisis
            </strong>

          </div>

          <span className="material-symbols-rounded">
            tune
          </span>

        </div>


        <div className="rep-filter-fields">

          {/* FECHA DESDE */}

          <label>

            <span>Desde</span>

            <input
              type="date"
              value={filtros.desde}
              max={filtros.hasta}
              onChange={(e) =>
                cambiarFiltro("desde", e.target.value)
              }
              required
            />

          </label>


          {/* FECHA HASTA */}

          <label>

            <span>Hasta</span>

            <input
              type="date"
              value={filtros.hasta}
              min={filtros.desde}
              onChange={(e) =>
                cambiarFiltro("hasta", e.target.value)
              }
              required
            />

          </label>


          {/* FILTRO POR CAMPAÑA */}

          <label className="rep-campaign-filter">

            <span>Campaña</span>

            <select
              value={filtros.campania_id}
              onChange={(e) =>
                cambiarFiltro("campania_id", e.target.value)
              }
            >

              <option value="">
                Todas las campañas
              </option>

              {(datos?.catalogoCampanias || []).map(
                (campania) => (

                  <option
                    value={campania.id}
                    key={campania.id}
                  >
                    {campania.codigo} · {campania.nombre}
                  </option>

                )
              )}

            </select>

          </label>


          {/* BOTONES */}

          <div className="rep-filter-actions">

            <button
              className="rep-button primary"
              type="submit"
              disabled={cargando}
            >

              <span className="material-symbols-rounded">
                filter_alt
              </span>

              Aplicar filtros

            </button>


            <button
              className="rep-button light"
              type="button"
              onClick={limpiarFiltros}
            >
              Restablecer
            </button>

          </div>

        </div>

      </form>
            {/* ENCABEZADO DE INDICADORES */}

      <div className="rep-section-head">

        <div>

          <span className="rep-eyebrow">
            INDICADORES DEL PERIODO
          </span>

          <h2>
            Resumen de resultados
          </h2>

          <p>
            Cifras calculadas a partir de las jornadas y
            movimientos incluidos en el filtro.
          </p>

        </div>


        <button
          className="rep-export-button"
          type="button"
          disabled={!datos || cargando}
          onClick={() => exportarCSV(datos)}
        >

          <span className="material-symbols-rounded">
            download
          </span>

          Exportar CSV

        </button>

      </div>


      {/* TARJETAS DE INDICADORES */}

      <section className="rep-kpi-grid">

        {/* JORNADAS */}

        <article className="rep-kpi-card">

          <span className="rep-kpi-icon blue material-symbols-rounded">
            event_available
          </span>

          <div>

            <small>
              Jornadas en el periodo
            </small>

            <strong>
              {cargando ? "—" : cantidad(resumen.jornadas)}
            </strong>

            <em>
              {cantidad(resumen.jornadas_completadas)} completadas
            </em>

          </div>

        </article>


        {/* DOSIS APLICADAS */}

        <article className="rep-kpi-card">

          <span className="rep-kpi-icon slate material-symbols-rounded">
            vaccines
          </span>

          <div>

            <small>
              Dosis aplicadas
            </small>

            <strong>
              {cargando ? "—" : cantidad(resumen.dosis_aplicadas)}
            </strong>

            <em>
              De {cantidad(resumen.objetivo_vacunacion)} dosis objetivo
            </em>

          </div>

        </article>


        {/* CUMPLIMIENTO */}

        <article className="rep-kpi-card">

          <span className="rep-kpi-icon sky material-symbols-rounded">
            track_changes
          </span>

          <div>

            <small>
              Cumplimiento del objetivo
            </small>

            <strong>
              {cargando ? "—" : porcentaje(resumen.cumplimiento_objetivo)}
            </strong>

            <em>
              Aplicaciones respecto al objetivo
            </em>

          </div>

        </article>


        {/* LOCALIDADES */}

        <article className="rep-kpi-card">

          <span className="rep-kpi-icon rose material-symbols-rounded">
            location_on
          </span>

          <div>

            <small>
              Localidades atendidas
            </small>

            <strong>
              {cargando ? "—" : cantidad(resumen.localidades)}
            </strong>

            <em>
              {cantidad(resumen.brigadas)} brigadas ·
              {" "}
              {cantidad(resumen.visitas)} visitas
            </em>

          </div>

        </article>

      </section>
            {/* CONTENIDO DE REPORTES */}

      {cargando ? (

        <div className="rep-loading">

          <span className="rep-spinner" />

          <strong>
            Preparando los reportes
          </strong>

          <small>
            Organizando resultados por campaña,
            territorio y brigada…
          </small>

        </div>

      ) : datos && (

        <>

          {/* TENDENCIA MENSUAL Y BALANCE DE DOSIS */}

          <section className="rep-analytics-grid">

            <TendenciaMensual
              datos={datos.tendencia || []}
            />


            {/* BALANCE DE DOSIS */}

            <div className="rep-side-summary rep-card">

              <span className="rep-eyebrow">
                CONTROL DE RESULTADOS
              </span>

              <h2>
                Balance de dosis
              </h2>


              <div className="rep-balance-row">

                <span>Asignadas</span>

                <strong>
                  {cantidad(resumen.dosis_asignadas)}
                </strong>

              </div>


              <div className="rep-balance-row">

                <span>Aplicadas</span>

                <strong>
                  {cantidad(resumen.dosis_aplicadas)}
                </strong>

              </div>


              <div className="rep-balance-row">

                <span>Devueltas</span>

                <strong>
                  {cantidad(resumen.dosis_devueltas)}
                </strong>

              </div>


              <div className="rep-balance-row">

                <span>Merma registrada</span>

                <strong>
                  {cantidad(resumen.dosis_merma)}
                </strong>

              </div>


              {/* DOSIS SIN JUSTIFICAR */}

              <div
                className={`rep-balance-alert ${
                  numero(resumen.dosis_sin_justificar) > 0
                    ? "danger"
                    : "ok"
                }`}
              >

                <span className="material-symbols-rounded">

                  {numero(resumen.dosis_sin_justificar) > 0
                    ? "report"
                    : "verified"}

                </span>

                <div>

                  <small>
                    Dosis sin justificar
                  </small>

                  <strong>
                    {cantidad(resumen.dosis_sin_justificar)}
                  </strong>

                </div>

              </div>


              {/* DISTANCIA RECORRIDA */}

              <small className="rep-distance-note">

                Recorridos calculados:

                {" "}

                {(
                  numero(resumen.distancia_recorrida_m) / 1000
                ).toLocaleString("es-MX", {
                  maximumFractionDigits: 1
                })}

                {" km"}

              </small>

            </div>

          </section>
                    {/* DESEMPEÑO DE CAMPAÑAS */}

          <DesempenoCampanias
            datos={datos.campanias || []}
          />


          {/* DISTRIBUCIÓN TERRITORIAL Y BRIGADAS */}

          <section className="rep-lower-grid">

            <DistribucionTerritorial
              datos={datos.localidades || []}
            />

            <DesempenoBrigadas
              datos={datos.brigadas || []}
            />

          </section>


          {/* CONTROL DE INVENTARIO */}

          <ControlInventario
            biologicos={datos.inventarioBiologicos || []}
            insumos={datos.insumosBajoMinimo || []}
          />


          {/* NOTA INFORMATIVA */}

          <div className="rep-report-foot">

            <span className="material-symbols-rounded">
              info
            </span>

            <span>
              El avance se calcula con las dosis aplicadas
              registradas. Las asignaciones y objetivos
              provienen de las jornadas; las devoluciones,
              mermas y diferencias se obtienen de los
              movimientos de inventario. Una jornada puede
              abarcar varios días y se incluye cuando su
              periodo se cruza con las fechas elegidas.
            </span>

          </div>

        </>

      )}


      {/* PIE DE PÁGINA */}

      <footer className="rep-footer">

        MG-Vacuna · Reportes de gestión y vacunación · Chiapas

      </footer>

    </main>
  );
}