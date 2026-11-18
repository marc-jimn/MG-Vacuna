import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerInicioTablero } from "../../services/tableroService";
import AgendaOperativa from "./components/AgendaOperativa";
import PanelAtencion from "./components/PanelAtencion";
import ActividadReciente from "./components/ActividadReciente";
import { cantidad, fechaLargaActual } from "./inicioUtils";
import "./Inicio.css";

const accesos = [
  { nombre: "Campañas", descripcion: "Planeación y seguimiento", icono: "campaign", ruta: "/campanas" },
  { nombre: "Visitas", descripcion: "Jornadas y puntos de vacunación", icono: "event_note", ruta: "/visitas" },
  { nombre: "Brigadas", descripcion: "Equipos en territorio", icono: "groups", ruta: "/brigadas" },
  { nombre: "Rutas", descripcion: "Recorridos de las jornadas", icono: "route", ruta: "/rutas" },
  { nombre: "Inventario", descripcion: "Biológicos e insumos", icono: "inventory_2", ruta: "/inventario" },
  { nombre: "Reportes", descripcion: "Indicadores y resultados", icono: "analytics", ruta: "/reportes" },
];

export default function Inicio() {
  const navigate = useNavigate();
  const [datos, setDatos] = useState({ resumen: {}, agendaHoy: [], proximasJornadas: [], alertas: [], actividadReciente: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerInicioTablero()
      .then((respuesta) => {
        if (!activo) return;
        setDatos({
          resumen: respuesta?.resumen || {},
          agendaHoy: Array.isArray(respuesta?.agendaHoy) ? respuesta.agendaHoy : [],
          proximasJornadas: Array.isArray(respuesta?.proximasJornadas) ? respuesta.proximasJornadas : [],
          alertas: Array.isArray(respuesta?.alertas) ? respuesta.alertas : [],
          actividadReciente: Array.isArray(respuesta?.actividadReciente) ? respuesta.actividadReciente : [],
        });
        setError("");
      })
      .catch((err) => {
        console.error("No fue posible cargar el tablero:", err);
        if (activo) setError(err.response?.data?.mensaje || "No fue posible consultar el tablero. Verifica que el backend esté activo.");
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);

  const metricas = [
    { titulo: "Jornadas de hoy", valor: datos.resumen.jornadas_hoy, detalle: "Puntos con actividad en la fecha", icono: "today", tone: "blue", ruta: "/visitas" },
    { titulo: "Brigadas en campo", valor: datos.resumen.brigadas_en_campo, detalle: "En ruta o realizando visitas", icono: "groups", tone: "slate", ruta: "/brigadas" },
    { titulo: "Próximas jornadas", valor: datos.resumen.proximas_jornadas, detalle: "Programadas para los siguientes 7 días", icono: "event_upcoming", tone: "sky", ruta: "/visitas" },
    { titulo: "Avisos pendientes", valor: datos.resumen.avisos_pendientes, detalle: "Notificaciones sin resolver", icono: "notifications_active", tone: Number(datos.resumen.avisos_pendientes) > 0 ? "rose" : "slate", ruta: "/notificaciones" },
  ];

  return (
    <main className="inicio-page">
      <section className="welcome-panel">
        <div className="welcome-content">
          <span className="welcome-eyebrow">SISTEMA DE GESTIÓN ESTATAL</span>
          <h1>¡Bienvenido a MG-Vacuna!</h1>
          <p>Administra, organiza y supervisa las actividades de vacunación y brigadas de salud del estado de Chiapas desde un solo lugar.</p>
        </div>
        <div className="welcome-decoration"><span className="material-symbols-rounded">health_and_safety</span></div>
      </section>

      {error && <div className="inicio-error"><span className="material-symbols-rounded">warning</span><span>{error}</span><button type="button" onClick={() => window.location.reload()}>Reintentar</button></div>}

      <section className="inicio-operational-head">
        <div><span className="inicio-eyebrow">PANEL OPERATIVO</span><h2>Así marcha la operación</h2><p>Una vista rápida de las actividades que requieren coordinación.</p></div>
        <div className="inicio-current-date"><span className="material-symbols-rounded">calendar_month</span><span>{fechaLargaActual()}</span></div>
      </section>

      <section className="inicio-metrics-grid">
        {metricas.map((item) => (
          <button type="button" className={`inicio-metric-card ${item.tone}`} key={item.titulo} onClick={() => navigate(item.ruta)}>
            <span className="inicio-metric-icon material-symbols-rounded">{item.icono}</span>
            <span className="inicio-metric-copy"><small>{item.titulo}</small><strong>{cargando ? "—" : cantidad(item.valor)}</strong><em>{item.detalle}</em></span>
            <span className="material-symbols-rounded inicio-metric-arrow">arrow_outward</span>
          </button>
        ))}
      </section>

      <section className="inicio-main-grid">
        <AgendaOperativa jornadas={datos.agendaHoy} proximas={datos.proximasJornadas} cargando={cargando} />
        <PanelAtencion alertas={datos.alertas} cargando={cargando} />
      </section>

      <section className="inicio-secondary-grid">
        <ActividadReciente movimientos={datos.actividadReciente} cargando={cargando} />
        <section className="inicio-card inicio-shortcuts-card">
          <div className="inicio-card-heading"><div><span className="inicio-eyebrow">NAVEGACIÓN DIRECTA</span><h2>Accesos de trabajo</h2><p>Continúa rápidamente con las tareas de cada módulo.</p></div><span className="inicio-heading-icon material-symbols-rounded">apps</span></div>
          <div className="inicio-shortcuts-grid">
            {accesos.map((item) => <button type="button" className="inicio-shortcut" key={item.ruta} onClick={() => navigate(item.ruta)}><span className="inicio-shortcut-icon material-symbols-rounded">{item.icono}</span><span><strong>{item.nombre}</strong><small>{item.descripcion}</small></span><span className="material-symbols-rounded">chevron_right</span></button>)}
          </div>
        </section>
      </section>

      <footer className="inicio-footer">MG-Vacuna · Plataforma de Gestión de Vacunación y Brigadas · Chiapas</footer>
    </main>
  );
}