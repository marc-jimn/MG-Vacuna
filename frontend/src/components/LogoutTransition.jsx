import { useEffect } from "react";
import "./LogoutTransition.css";

export default function LogoutTransition({ onComplete }) {

  useEffect(() => {
    const temporizador = setTimeout(() => {
      onComplete();
    }, 2200);

    return () => clearTimeout(temporizador);
  }, [onComplete]);

  return (
    <main className="logout-screen">

      <div className="logout-decoration logout-decoration-one" />
      <div className="logout-decoration logout-decoration-two" />
      <div className="logout-decoration logout-decoration-three" />

      <section className="logout-card">

        <div className="logout-logo">
          <img src="/img/logo.png" alt="MG-Vacuna" />
        </div>

        <span className="logout-eyebrow">
          MG-VACUNA · SESIÓN SEGURA
        </span>

        <h2>
          Cerrando sesión
          <span className="logout-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </h2>

        <p>
          Finalizando tu sesión de forma segura.
          Gracias por utilizar MG-Vacuna.
        </p>

        <div className="logout-loader">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="logout-status">
          <span className="material-symbols-rounded">
            verified_user
          </span>
          Protegiendo tu acceso institucional
        </div>

      </section>

      <div className="logout-footer">
        MG-SOFTWARE © 2026 · CHIAPAS
      </div>

    </main>
  );
}