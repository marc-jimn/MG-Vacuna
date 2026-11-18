import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { estaAutenticado } from "../../services/authService";

const TIEMPO_INACTIVIDAD = 2 * 60 * 60 * 1000; // 2 horas

function SessionTimeout() {
  const navigate = useNavigate();
  const location = useLocation();

  const ultimaActividad = useRef(null);
  const temporizador = useRef(null);
  const sesionCerrada = useRef(false);

  useEffect(() => {
    // No controlar usuarios sin sesión o en proceso de salida.
    if (
      !estaAutenticado() ||
      location.pathname === "/salir"
    ) {
      return;
    }

    // Inicializar el contador dentro del efecto.
    ultimaActividad.current = Date.now();
    sesionCerrada.current = false;

    const cerrarPorInactividad = () => {
      if (sesionCerrada.current) return;

      sesionCerrada.current = true;

      clearTimeout(temporizador.current);

      navigate("/salir", { replace: true });
    };

    // Programar cierre automático.
    const programarTemporizador = () => {
      clearTimeout(temporizador.current);

      const transcurrido =
        Date.now() - ultimaActividad.current;

      const restante =
        TIEMPO_INACTIVIDAD - transcurrido;

      if (restante <= 0) {
        cerrarPorInactividad();
        return;
      }

      temporizador.current = setTimeout(
        cerrarPorInactividad,
        restante
      );
    };

    // Registrar actividad del usuario.
    const registrarActividad = () => {
      if (sesionCerrada.current) return;

      const ahora = Date.now();

      // No permitir reactivar una sesión vencida.
      if (
        ahora - ultimaActividad.current >=
        TIEMPO_INACTIVIDAD
      ) {
        cerrarPorInactividad();
        return;
      }

      ultimaActividad.current = ahora;

      programarTemporizador();
    };

    // Controlar movimiento del mouse sin
    // ejecutar el contador constantemente.
    let ultimoMovimientoMouse = 0;

    const manejarMovimientoMouse = () => {
      const ahora = Date.now();

      if (ahora - ultimoMovimientoMouse < 1000) {
        return;
      }

      ultimoMovimientoMouse = ahora;

      registrarActividad();
    };

    // Detectar cuando el usuario vuelve a la pestaña.
    const verificarPestana = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      if (
        Date.now() - ultimaActividad.current >=
        TIEMPO_INACTIVIDAD
      ) {
        cerrarPorInactividad();
      }
    };

    const eventos = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "pointerdown",
    ];

    eventos.forEach((evento) => {
      document.addEventListener(
        evento,
        registrarActividad,
        { passive: true }
      );
    });

    document.addEventListener(
      "mousemove",
      manejarMovimientoMouse,
      { passive: true }
    );

    document.addEventListener(
      "visibilitychange",
      verificarPestana
    );

    // Iniciar las dos horas.
    programarTemporizador();

    return () => {
      clearTimeout(temporizador.current);

      eventos.forEach((evento) => {
        document.removeEventListener(
          evento,
          registrarActividad
        );
      });

      document.removeEventListener(
        "mousemove",
        manejarMovimientoMouse
      );

      document.removeEventListener(
        "visibilitychange",
        verificarPestana
      );
    };

  }, [navigate, location.pathname]);

  return null;
}

export default SessionTimeout;