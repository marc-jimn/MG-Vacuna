import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { iniciarSesion } from "../../services/authService";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [mostrarRecuperacion, setMostrarRecuperacion] = useState(false);
  const [correoRecuperacion, setCorreoRecuperacion] = useState("");
  const [mostrarMensajeRecuperacion, setMostrarMensajeRecuperacion] = useState(false);

  // =================================
  // INICIAR SESIÓN
  // =================================

  const manejarLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!correo.trim() || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    try {
      setCargando(true);

      const usuario = await iniciarSesion(
        correo.trim(),
        password
      );

      if (usuario.debe_cambiar_password) {
        navigate("/cambiar-password", { replace: true });
        return;
      }

      navigate("/inicio", { replace: true });

    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
        "No fue posible iniciar sesión. Verifica tus datos."
      );
    } finally {
      setCargando(false);
    }
  };

  // =================================
  // SOLICITAR RECUPERACIÓN
  // =================================

  const manejarRecuperacion = (e) => {
    e.preventDefault();

    if (!correoRecuperacion.trim()) return;

    setMostrarMensajeRecuperacion(true);
  };

  // =================================
  // CERRAR VENTANA DE RECUPERACIÓN
  // =================================

  const cerrarMensajeRecuperacion = () => {
    setMostrarMensajeRecuperacion(false);
    setMostrarRecuperacion(false);
    setCorreoRecuperacion("");
    setPassword("");
    setError("");
    setMostrarPassword(false);
  };

  return (
    <main className="login-page">

      {/* =================================
          PANEL VISUAL
      ================================= */}

      <section className="login-visual">

        <div className="visual-image" />
        <div className="visual-overlay" />

        {/* FIGURAS GEOMÉTRICAS */}
        <div className="visual-shape shape-one" />
        <div className="visual-shape shape-two" />
        <div className="visual-shape shape-three" />

        <div className="visual-content">

          {/* MARCA */}
          <div className="visual-brand">
            <img src="/img/logo.png" alt="MG-Vacuna" />
            <span>MG-VACUNA</span>
          </div>

          {/* MENSAJE PRINCIPAL */}
          <div className="visual-message">

            <span className="visual-tag">
              <span className="tag-dot" />
              PLATAFORMA INSTITUCIONAL
            </span>

            <h1>
              Cuidar la salud
              <br />
              es <span>proteger el futuro.</span>
            </h1>

            <p>
              Gestión inteligente de vacunación,
              coordinación de brigadas y seguimiento
              de las acciones de salud en Chiapas.
            </p>

            <div className="visual-decoration">
              <span />
              <span />
              <span />
            </div>

          </div>

          {/* PIE VISUAL */}
          <div className="visual-bottom">
            <div className="visual-line" />
            <span>TUXTLA GUTIÉRREZ · CHIAPAS</span>
            <span className="visual-year">
              MG-SOFTWARE © 2026
            </span>
          </div>

        </div>

      </section>


      {/* =================================
          PANEL DEL FORMULARIO
      ================================= */}

      <section className="login-form-panel">

        <div className="form-decoration decoration-one" />
        <div className="form-decoration decoration-two" />
        <div className="form-decoration decoration-three" />

        <div className="login-form-content">

          {!mostrarRecuperacion ? (

            /* =================================
               INICIO DE SESIÓN
            ================================= */

            <>

              <div className="form-heading">

                <span className="form-eyebrow">
                  BIENVENIDO DE NUEVO
                </span>

                <h2>
                  Inicia sesión
                  <span className="title-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </h2>

                <p>
                  Ingresa tus credenciales para acceder
                  a la plataforma de gestión.
                </p>

              </div>

              <form onSubmit={manejarLogin}>

                {/* CORREO */}
                <div className="modern-field">

                  <label htmlFor="correo">
                    Correo electrónico
                  </label>

                  <div className="input-container">

                    <span className="material-symbols-rounded input-icon">
                      mail
                    </span>

                    <input
                      id="correo"
                      type="email"
                      placeholder="nombre@institucion.gob.mx"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      autoComplete="username"
                      required
                    />

                  </div>

                </div>

                {/* CONTRASEÑA */}
                <div className="modern-field">

                  <label htmlFor="password">
                    Contraseña
                  </label>

                  <div className="input-container">

                    <span className="material-symbols-rounded input-icon">
                      lock
                    </span>

                    <input
                      id="password"
                      type={mostrarPassword ? "text" : "password"}
                      placeholder="Ingresa tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      aria-label={
                        mostrarPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >

                      <span className="material-symbols-rounded">
                        {mostrarPassword
                          ? "visibility_off"
                          : "visibility"}
                      </span>

                    </button>

                  </div>

                  {/* OLVIDASTE TU CONTRASEÑA */}
                  <button
                    type="button"
                    className="forgot-password"
                    onClick={() => {
                      setMostrarRecuperacion(true);
                      setError("");
                      setCorreoRecuperacion(correo);
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>

                </div>

                {/* ERROR */}
                {error && (
                  <div className="modern-error" role="alert">

                    <span className="material-symbols-rounded">
                      error
                    </span>

                    <span>{error}</span>

                  </div>
                )}

                {/* BOTÓN INICIAR SESIÓN */}
                <button
                  type="submit"
                  className="modern-login-button"
                  disabled={cargando}
                >

                  <span>
                    {cargando
                      ? "Iniciando sesión..."
                      : "Iniciar sesión"}
                  </span>

                  {!cargando && (
                    <span className="material-symbols-rounded">
                      arrow_forward
                    </span>
                  )}

                  {cargando && (
                    <span className="login-spinner" />
                  )}

                </button>

              </form>

              {/* SEGURIDAD */}
              <div className="form-security">

                <span className="material-symbols-rounded">
                  verified_user
                </span>

                <span>
                  Acceso seguro para personal autorizado
                </span>

              </div>

              {/* FOOTER */}
              <div className="form-footer">

                <span>MG-Vacuna</span>

                <span>Gestión de Vacunación y Brigadas</span>

              </div>

            </>
            
          ) : (

            /* =================================
               FORMULARIO DE RECUPERACIÓN
            ================================= */

            <div className="recovery-card">

              {/* ENCABEZADO INSTITUCIONAL */}
              <div className="recovery-brand">

                <img
                  src="/img/logo.png"
                  alt="MG-Vacuna"
                />

                <div className="recovery-brand-text">

                  <h3>
                    PLATAFORMA DE GESTIÓN DE
                    VACUNACIÓN Y BRIGADAS - <span>CHIAPAS</span>
                  </h3>

                  <small>MG-Vacuna</small>

                </div>

              </div>

              <div className="recovery-divider" />

              {/* TÍTULO */}
              <div className="recovery-heading">

                <span className="form-eyebrow">
                  RECUPERACIÓN DE ACCESO
                </span>

                <h2>
                  Recuperar contraseña
                </h2>

                <p>
                  No te preocupes, te ayudaremos a recuperar
                  el acceso a tu cuenta institucional.
                </p>

              </div>

              {/* FORMULARIO */}
              <form onSubmit={manejarRecuperacion}>

                <div className="modern-field">

                  <label htmlFor="correoRecuperacion">
                    Correo electrónico
                  </label>

                  <div className="input-container">

                    <span className="material-symbols-rounded input-icon">
                      mail
                    </span>

                    <input
                      id="correoRecuperacion"
                      type="email"
                      placeholder="Ingresa tu correo institucional"
                      value={correoRecuperacion}
                      onChange={(e) =>
                        setCorreoRecuperacion(e.target.value)
                      }
                      autoComplete="email"
                      required
                    />

                  </div>

                </div>

                {/* INSTRUCCIONES */}
                <div className="recovery-instructions">

                  <span className="material-symbols-rounded">
                    info
                  </span>

                  <p>
                    Ingresa el correo electrónico asociado a tu
                    cuenta. Utilizaremos esta información para
                    iniciar el proceso de recuperación de acceso.
                  </p>

                </div>

                {/* SOLICITAR RECUPERACIÓN */}
                <button
                  type="submit"
                  className="modern-login-button"
                >

                  <span>
                    Solicitar recuperación
                  </span>

                  <span className="material-symbols-rounded">
                    arrow_forward
                  </span>

                </button>

              </form>

              {/* VOLVER AL LOGIN */}
              <button
                type="button"
                className="recovery-back"
                onClick={() => {
                  setMostrarRecuperacion(false);
                  setError("");
                }}
              >

                <span className="material-symbols-rounded">
                  arrow_back
                </span>

                Volver al inicio de sesión

              </button>

            </div>

          )}

        </div>

      </section>


      {/* =================================
          VENTANA EMERGENTE TRANSPARENTE
      ================================= */}

      {mostrarMensajeRecuperacion && (

        <div className="recovery-modal-overlay">

          <div
            className="recovery-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recovery-modal-title"
          >

            {/* ICONO INFORMATIVO */}
            <div className="recovery-modal-icon">

              <span className="material-symbols-rounded">
                mark_email_unread
              </span>

            </div>

            {/* TÍTULO */}
            <h3 id="recovery-modal-title">
              Solicitud de recuperación
            </h3>

            {/* MENSAJE */}
            <p>
              Si los datos proporcionados corresponden a una
              cuenta registrada, recibirás las instrucciones
              para recuperar el acceso.
            </p>

            {/* BOTÓN */}
            <button
              type="button"
              className="recovery-modal-button"
              onClick={cerrarMensajeRecuperacion}
            >
              Volver a iniciar sesión
            </button>

          </div>

        </div>

      )}

    </main>
  );
}