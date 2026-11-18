import { useEffect, useState } from "react";
import api from "../../services/api";
import { obtenerUsuario } from "../../services/authService";
import "./Perfil.css";

// =====================================================
// OBTENER FOTOGRAFÍA
// =====================================================

const obtenerFoto = (foto) => {
  if (!foto) return null;

  if (foto.startsWith("http://") || foto.startsWith("https://")) {
    return foto;
  }

  if (foto.startsWith("/uploads/")) {
    return `http://localhost:3000${foto}`;
  }

  if (foto.startsWith("/")) {
    return `http://localhost:3000${foto}`;
  }

  return `http://localhost:3000/uploads/personal/${foto}`;
};

// =====================================================
// FORMATEAR FECHA
// =====================================================

const fecha = (valor) => {
  if (!valor) return "No disponible";

  const resultado = new Date(valor);

  if (Number.isNaN(resultado.getTime())) {
    return "No disponible";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(resultado);
};

// =====================================================
// FORMATEAR FECHA Y HORA
// =====================================================

const fechaHora = (valor) => {
  if (!valor) return "Sin registro";

  const resultado = new Date(valor);

  if (Number.isNaN(resultado.getTime())) {
    return "Sin registro";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(resultado);
};

// =====================================================
// COMPONENTE PERFIL
// =====================================================

function Perfil() {

  // =====================================================
  // ESTADOS DEL PERFIL
  // =====================================================

  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [fotoError, setFotoError] = useState(false);

  // =====================================================
  // ESTADOS DE TELEGRAM
  // =====================================================

  const [codigoTelegram, setCodigoTelegram] = useState("");
  const [cargandoTelegram, setCargandoTelegram] = useState(false);
  const [errorTelegram, setErrorTelegram] = useState("");
  const [mensajeTelegram, setMensajeTelegram] = useState("");

  // =====================================================
  // CARGAR PERFIL DEL USUARIO
  // =====================================================

  useEffect(() => {
    let activo = true;

    const cargarPerfil = async () => {
      try {
        setCargando(true);
        setError(false);

        const respuesta = await api.get("/auth/perfil");

        if (activo) {
          setUsuario(respuesta.data.datos);
        }

      } catch (err) {
        console.error("Error al cargar el perfil:", err);

        if (activo) {
          setError(true);
          setUsuario(obtenerUsuario());
        }

      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargarPerfil();

    return () => {
      activo = false;
    };
  }, []);

  // =====================================================
  // GENERAR CÓDIGO DE VINCULACIÓN TELEGRAM
  // =====================================================

  const generarCodigoTelegram = async () => {
    try {
      setCargandoTelegram(true);
      setErrorTelegram("");
      setMensajeTelegram("");
      setCodigoTelegram("");

      const respuesta = await api.post("/telegram/codigo");

      const codigo = respuesta.data?.datos?.codigo;

      if (!codigo) {
        throw new Error(
          "No se recibió un código de vinculación."
        );
      }

      setCodigoTelegram(codigo);

      setMensajeTelegram(
        "Código generado correctamente. Tiene una vigencia de 10 minutos."
      );

    } catch (error) {
      console.error(
        "Error generando código de Telegram:",
        error
      );

      setErrorTelegram(
        error.response?.data?.mensaje ||
        error.response?.data?.error ||
        error.message ||
        "No fue posible generar el código."
      );

    } finally {
      setCargandoTelegram(false);
    }
  };

  // =====================================================
  // COPIAR CÓDIGO DE TELEGRAM
  // =====================================================

  const copiarCodigoTelegram = async () => {
    try {
      await navigator.clipboard.writeText(codigoTelegram);

      setMensajeTelegram(
        "¡Código copiado! Ahora envíalo al bot de Telegram."
      );

      setErrorTelegram("");

    } catch {
      setErrorTelegram(
        "No se pudo copiar automáticamente. Selecciona el código y cópialo manualmente."
      );
    }
  };

  // =====================================================
  // ESTADO DE CARGA
  // =====================================================

  if (cargando) {
    return (
      <main className="perfil-page perfil-centered">
        <div className="perfil-loading">
          <div className="perfil-spinner" />

          <h3>Preparando tu perfil</h3>

          <p>
            Estamos consultando tu información institucional...
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // PERFIL NO DISPONIBLE
  // =====================================================

  if (!usuario) {
    return (
      <main className="perfil-page perfil-centered">
        <div className="perfil-loading">

          <span className="material-symbols-rounded">
            person_off
          </span>

          <h3>No se pudo cargar tu perfil</h3>

          <p>Intenta nuevamente más tarde.</p>

          <button
            className="perfil-button"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>

        </div>
      </main>
    );
  }

  // =====================================================
  // DATOS DEL USUARIO
  // =====================================================

  const nombreCompleto = [
    usuario.nombres,
    usuario.apellido_paterno,
    usuario.apellido_materno,
  ].filter(Boolean).join(" ");

  const foto = obtenerFoto(usuario.foto);

  const iniciales = [
    usuario.nombres?.trim()?.charAt(0),
    usuario.apellido_paterno?.trim()?.charAt(0),
  ].filter(Boolean).join("").toUpperCase() || "MG";

  const estadoActivo =
    usuario.estado_usuario === "activo" &&
    usuario.estado_personal === "activo";

  const permisos = Array.isArray(usuario.permisos)
    ? usuario.permisos
    : [];

  // =====================================================
  // RENDERIZADO
  // =====================================================

  return (
    <main className="perfil-page">

      {/* ENCABEZADO */}

      <div className="perfil-page-heading">

        <div>
          <span className="perfil-eyebrow">
            MG-VACUNA / CUENTA INSTITUCIONAL
          </span>

          <h1>Mi perfil</h1>

          <p>
            Consulta tu información personal y los datos
            de tu cuenta dentro de la plataforma.
          </p>
        </div>

        <div className="perfil-heading-icon">
          <span className="material-symbols-rounded">
            account_circle
          </span>
        </div>

      </div>

      {/* AVISO DE ERROR */}

      {error && (
        <div className="perfil-warning">

          <span className="material-symbols-rounded">
            info
          </span>

          No fue posible actualizar tu información desde el servidor.
          Se muestran los últimos datos disponibles de tu sesión.

        </div>
      )}
            {/* =====================================================
          TARJETA PRINCIPAL
      ===================================================== */}

      <section className="perfil-hero">

        <div className="perfil-hero-decoration perfil-decoration-one" />
        <div className="perfil-hero-decoration perfil-decoration-two" />

        <div className="perfil-hero-content">

          {/* FOTOGRAFÍA */}

          <div className="perfil-avatar-container">

            {foto && !fotoError ? (
              <img
                src={foto}
                alt={`Fotografía de ${nombreCompleto}`}
                className="perfil-avatar"
                onError={() => setFotoError(true)}
              />
            ) : (
              <div className="perfil-avatar perfil-avatar-fallback">
                {iniciales}
              </div>
            )}

            <span
              className={`perfil-avatar-status ${
                estadoActivo ? "active" : "inactive"
              }`}
            />

          </div>

          {/* DATOS PRINCIPALES */}

          <div className="perfil-hero-info">

            <span className="perfil-hero-label">
              PERFIL INSTITUCIONAL
            </span>

            <h2>
              {nombreCompleto || "Usuario MG-Vacuna"}
            </h2>

            <p>
              {usuario.rol_nombre || "Personal del sistema"}
            </p>

            <div className="perfil-hero-tags">

              <span>
                <span className="material-symbols-rounded">
                  badge
                </span>

                {usuario.numero_empleado || "Sin código"}
              </span>

              <span className={
                estadoActivo ? "tag-active" : "tag-inactive"
              }>
                <i />
                {estadoActivo ? "Cuenta activa" : "Cuenta inactiva"}
              </span>

            </div>

          </div>

        </div>

        {/* PIE DE TARJETA */}

        <div className="perfil-hero-footer">

          <span>
            <span className="material-symbols-rounded">
              verified_user
            </span>

            Información de tu cuenta autenticada
          </span>

          <span>
            MG-VACUNA · CHIAPAS
          </span>

        </div>

      </section>

      {/* =====================================================
          RESUMEN
      ===================================================== */}

      <section className="perfil-summary">

        <article className="perfil-summary-card">

          <div className="perfil-summary-icon blue">
            <span className="material-symbols-rounded">
              person
            </span>
          </div>

          <div>
            <small>Identificación</small>

            <strong>
              {usuario.numero_empleado || "No disponible"}
            </strong>
          </div>

        </article>

        <article className="perfil-summary-card">

          <div className="perfil-summary-icon purple">
            <span className="material-symbols-rounded">
              shield_person
            </span>
          </div>

          <div>
            <small>Rol institucional</small>

            <strong>
              {usuario.rol_nombre || "No asignado"}
            </strong>
          </div>

        </article>

        <article className="perfil-summary-card">

          <div className="perfil-summary-icon green">
            <span className="material-symbols-rounded">
              security
            </span>
          </div>

          <div>
            <small>Estado de cuenta</small>

            <strong>
              {estadoActivo ? "Activa" : "Inactiva"}
            </strong>
          </div>

        </article>

      </section>

      {/* =====================================================
          INFORMACIÓN PERSONAL
      ===================================================== */}

      <section className="perfil-section">

        <div className="perfil-section-heading">

          <div className="perfil-section-icon">
            <span className="material-symbols-rounded">
              badge
            </span>
          </div>

          <div>
            <h3>Información personal</h3>

            <p>
              Datos de identificación del personal.
            </p>
          </div>

        </div>

        <div className="perfil-fields-grid">

          {/* NOMBRES */}

          <div className="perfil-field">
            <label>Nombres</label>

            <div>
              <span className="material-symbols-rounded">
                person
              </span>

              <strong>
                {usuario.nombres || "No disponible"}
              </strong>
            </div>
          </div>

          {/* APELLIDO PATERNO */}

          <div className="perfil-field">
            <label>Apellido paterno</label>

            <div>
              <span className="material-symbols-rounded">
                person
              </span>

              <strong>
                {usuario.apellido_paterno || "No disponible"}
              </strong>
            </div>
          </div>

          {/* APELLIDO MATERNO */}

          <div className="perfil-field">
            <label>Apellido materno</label>

            <div>
              <span className="material-symbols-rounded">
                person
              </span>

              <strong>
                {usuario.apellido_materno || "No disponible"}
              </strong>
            </div>
          </div>

          {/* NÚMERO DE EMPLEADO */}

          <div className="perfil-field">
            <label>Número de empleado</label>

            <div>
              <span className="material-symbols-rounded">
                badge
              </span>

              <strong>
                {usuario.numero_empleado || "No disponible"}
              </strong>
            </div>
          </div>

          {/* FECHA DE NACIMIENTO */}

          <div className="perfil-field">
            <label>Fecha de nacimiento</label>

            <div>
              <span className="material-symbols-rounded">
                cake
              </span>

              <strong>
                {fecha(usuario.fecha_nacimiento)}
              </strong>
            </div>
          </div>

          {/* TELÉFONO */}

          <div className="perfil-field">
            <label>Teléfono</label>

            <div>
              <span className="material-symbols-rounded">
                call
              </span>

              <strong>
                {usuario.telefono || "No registrado"}
              </strong>
            </div>
          </div>

        </div>

      </section>
            {/* =====================================================
          INFORMACIÓN DE LA CUENTA
      ===================================================== */}

      <section className="perfil-section">

        <div className="perfil-section-heading">

          <div className="perfil-section-icon purple-icon">
            <span className="material-symbols-rounded">
              manage_accounts
            </span>
          </div>

          <div>
            <h3>Información de la cuenta</h3>

            <p>
              Datos de acceso a MG-Vacuna.
            </p>
          </div>

        </div>

        <div className="perfil-fields-grid">

          {/* NOMBRE DE USUARIO */}

          <div className="perfil-field">
            <label>Nombre de usuario</label>

            <div>
              <span className="material-symbols-rounded">
                account_circle
              </span>

              <strong>
                {usuario.username || "No disponible"}
              </strong>
            </div>
          </div>

          {/* CORREO ELECTRÓNICO */}

          <div className="perfil-field">
            <label>Correo electrónico</label>

            <div>
              <span className="material-symbols-rounded">
                mail
              </span>

              <strong>
                {usuario.correo || "No disponible"}
              </strong>
            </div>
          </div>

          {/* ROL */}

          <div className="perfil-field">
            <label>Rol asignado</label>

            <div>
              <span className="material-symbols-rounded">
                admin_panel_settings
              </span>

              <strong>
                {usuario.rol_nombre || "No asignado"}
              </strong>
            </div>
          </div>

          {/* ÚLTIMO ACCESO */}

          <div className="perfil-field">
            <label>Último acceso</label>

            <div>
              <span className="material-symbols-rounded">
                schedule
              </span>

              <strong>
                {fechaHora(usuario.ultimo_acceso)}
              </strong>
            </div>
          </div>

        </div>

      </section>

      {/* =====================================================
          PERMISOS DE ACCESO
      ===================================================== */}

      <section className="perfil-section">

        <div className="perfil-section-heading">

          <div className="perfil-section-icon green-icon">
            <span className="material-symbols-rounded">
              verified_user
            </span>
          </div>

          <div>
            <h3>Permisos de acceso</h3>

            <p>
              Privilegios asociados a tu rol institucional.
            </p>
          </div>

        </div>

        {permisos.length > 0 ? (

          <div className="perfil-permissions">

            {permisos.map((permiso, index) => (

              <span key={`${permiso}-${index}`}>

                <span className="material-symbols-rounded">
                  check_circle
                </span>

                {permiso.replaceAll("_", " ")}

              </span>

            ))}

          </div>

        ) : (

          <div className="perfil-no-permissions">
            No hay permisos disponibles para mostrar.
          </div>

        )}

      </section>
            {/* =====================================================
          SEGURIDAD Y VINCULACIÓN DE TELEGRAM
      ===================================================== */}

      <section className="perfil-security">

        {/* INFORMACIÓN DE SEGURIDAD */}

        <div className="perfil-security-info">

          <div className="perfil-security-icon">
            <span className="material-symbols-rounded">
              shield_lock
            </span>
          </div>

          <div>

            <h3>Seguridad de tu cuenta</h3>

            <p>
              Tu cuenta está protegida mediante autenticación
              institucional. Vincula tu cuenta de Telegram para
              utilizar el asistente de MG-Vacuna.
            </p>

          </div>

        </div>

        {/* BOTÓN PARA VINCULAR TELEGRAM */}

        <button
          type="button"
          className="perfil-telegram-button"
          onClick={generarCodigoTelegram}
          disabled={cargandoTelegram}
        >

          <span className="material-symbols-rounded">
            {cargandoTelegram ? "hourglass_top" : "send"}
          </span>

          {cargandoTelegram
            ? "Generando código..."
            : "Vincular Telegram"}

        </button>

        {/* MENSAJE DE ÉXITO */}

        {mensajeTelegram && (

          <div className="perfil-telegram-success">

            <span className="material-symbols-rounded">
              check_circle
            </span>

            {mensajeTelegram}

          </div>

        )}

        {/* MENSAJE DE ERROR */}

        {errorTelegram && (

          <div className="perfil-telegram-error">

            <span className="material-symbols-rounded">
              error
            </span>

            {errorTelegram}

          </div>

        )}

        {/* CÓDIGO DE VINCULACIÓN */}

        {codigoTelegram && (

          <div className="perfil-telegram-code">

            <div className="perfil-telegram-code-heading">

              <span className="material-symbols-rounded">
                key
              </span>

              <strong>
                Tu código de vinculación
              </strong>

            </div>

            {/* MOSTRAR CÓDIGO */}

            <div className="perfil-telegram-code-value">
              {codigoTelegram}
            </div>

            {/* COPIAR CÓDIGO */}

            <button
              type="button"
              className="perfil-telegram-copy"
              onClick={copiarCodigoTelegram}
            >

              <span className="material-symbols-rounded">
                content_copy
              </span>

              Copiar código

            </button>

            {/* INSTRUCCIONES */}

            <p>
              Abre el bot de MG-Vacuna en Telegram y envía:
            </p>

            <code>
              /vincular {codigoTelegram}
            </code>

            <p className="perfil-telegram-expiration">
              Este código vence en 10 minutos y solo puede
              utilizarse una vez.
            </p>

          </div>

        )}

      </section>

      {/* =====================================================
          PIE DE PÁGINA
      ===================================================== */}

      <footer className="perfil-footer">

        <span>MG-VACUNA</span>

        <span>
          Plataforma de Gestión de Vacunación y Brigadas · Chiapas
        </span>

      </footer>

    </main>
  );
}

export default Perfil;