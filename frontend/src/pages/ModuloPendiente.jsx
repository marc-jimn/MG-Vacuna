import { useLocation } from "react-router-dom";

const nombres = {
  campanas: "Campañas",
  localidades: "Localidades",
  brigadas: "Brigadas",
  transporte: "Transporte",
  rutas: "Rutas",
  visitas: "Visitas",
  inventario: "Inventario",
  reportes: "Reportes",
  perfil: "Perfil",
};

export default function ModuloPendiente() {
  const location = useLocation();
  const modulo = location.pathname.replace("/", "");

  return (
    <section>
      <span className="page-eyebrow">MG-VACUNA / MÓDULOS</span>
      <h1 style={{ color: "#1A2335", marginTop: 10 }}>
        {nombres[modulo] || "Módulo"}
      </h1>

      <p style={{ color: "#8490A3", marginTop: 8 }}>
        Este apartado estará disponible en una siguiente etapa.
      </p>
    </section>
  );
}