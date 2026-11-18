import { useEffect } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

// Componentes
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AppErrorBoundary from "./components/AppErrorBoundary";
import LogoutTransition from "./components/LogoutTransition";
import SessionTimeout from "./components/SessionTimeout/SessionTimeout";

// Servicios 
import { cerrarSesion } from "./services/authService";

// Páginas
import Login from "./pages/Login/Login";
import Inicio from "./pages/Inicio/Inicio";
import Personal from "./pages/Personal/Personal";
import Campanias from "./pages/Campanias/Campanias";
import Localidades from "./pages/Localidades/Localidades";
import Transporte from "./pages/Transporte/Transporte";
import Brigadas from "./pages/Brigadas/Brigadas";
import Visitas from "./pages/Visitas/Visitas";
import RutasRecorridos from "./pages/RutasRecorridos/RutasRecorridos";
import Inventario from "./pages/Inventario/Inventario";
import Reportes from "./pages/Reportes/Reportes";
import Notificaciones from "./pages/Notificaciones/Notificaciones";
import Perfil from "./pages/Perfil/Perfil";

/* =========================================
   Título dinámico
========================================= */

function TituloDinamico() {
  const location = useLocation();

  useEffect(() => {
    const rutas = {
      "/": "Iniciar sesión",
      "/inicio": "Dashboard",
      "/login": "Iniciar sesión",
      "/salir": "Cerrando sesión",
      "/cambiar-password": "Cambiar contraseña",
      "/personal": "Personal",
      "/campanas": "Campañas",
      "/localidades": "Localidades",
      "/brigadas": "Brigadas",
      "/transporte": "Transporte",
      "/rutas": "Rutas",
      "/visitas": "Visitas",
      "/inventario": "Inventario",
      "/notificaciones": "Notificaciones",
      "/reportes": "Reportes",
      "/perfil": "Mi perfil",
    };

    const modulo = rutas[location.pathname] || "MG-Vacuna";

    document.title =
      modulo === "MG-Vacuna"
        ? "MG-Vacuna"
        : `MG-Vacuna | ${modulo}`;

  }, [location.pathname]);

  return null;
}

/* =========================================
   Módulos pendientes
========================================= */

function ModuloPendiente({ nombre }) {
  return (
    <section className="pending-module">

      <div className="pending-module-icon">
        <span className="material-symbols-rounded">
          construction
        </span>
      </div>

      <h1>{nombre}</h1>

      <p>
        Este módulo formará parte de MG-Vacuna.
        Estamos preparando sus herramientas y funcionalidades.
      </p>

    </section>
  );
}

/* =========================================
   Pantalla de cierre de sesión
========================================= */

function PantallaCerrarSesion() {
  const navigate = useNavigate();

  useEffect(() => {
    cerrarSesion();
  }, []);

  return (
    <LogoutTransition
      onComplete={() => {
        navigate("/login", { replace: true });
      }}
    />
  );
}

/* =========================================
   Aplicación principal
========================================= */

function App() {
  return (
    <>

      {/* Control automático por inactividad */}
      <SessionTimeout />

      {/* Título del navegador */}
      <TituloDinamico />

      <Routes>

        {/* =================================
            Página principal
        ================================= */}

        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* =================================
            Acceso público
        ================================= */}
        
        <Route path="/login" element={<Login />}/>

        {/* =================================
            Cambio de contraseña
        ================================= */}

        <Route path="/cambiar-password" element={<ModuloPendiente nombre="Cambiar contraseña" />}/>

        {/* =================================
            Cierre de sesión
        ================================= */}

        <Route path="/salir" element={<PantallaCerrarSesion />}/>

        {/* =================================
            Módulos protegidos
        ================================= */}

        <Route element={<ProtectedRoute />}>

          <Route element={<MainLayout />}>

            {/* Inicio */}

            <Route path="/inicio" element={<Inicio />}/>

            {/* Campañas */}

            <Route path="/campanas" element={<Campanias />}/>

            {/* Localidades */}

            <Route path="/localidades" element={<Localidades />}/>

            {/* Brigadas */}

            <Route path="/brigadas" element={<Brigadas />}/>

            {/* Personal */}

            <Route path="/personal" element={<Personal />}/>

            {/* Transporte */}

            <Route path="/transporte" element={<Transporte />}/>

            {/* Visitas */}

            <Route path="/visitas" element={<Visitas />}/>

            {/* Rutas */}

            <Route path="/rutas" element={<RutasRecorridos />}/>

            {/* Inventario */}

            <Route path="/inventario" element={<Inventario />}/>

            {/* Notificaciones */}

            <Route path="/notificaciones" element={<Notificaciones />}/>

            {/* Reportes */}

            <Route path="/reportes" element={<Reportes />}/>

            {/* Perfil */}

            <Route path="/perfil"
              element={<Perfil />}/>

          </Route>

        </Route>

        {/* =================================
            Ruta no encontrada
        ================================= */}

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>

    </>
  );
}

// Root

export default function Root() {
  return (
    <BrowserRouter>

      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>

    </BrowserRouter>
  );
}