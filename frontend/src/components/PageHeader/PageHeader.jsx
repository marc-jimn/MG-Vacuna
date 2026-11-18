import "./PageHeader.css";

function PageHeader({
  titulo,
  descripcion,
  accion,
  onAccion,
  acciones = [],
}) {
  const accionesVisibles =
    acciones.length > 0
      ? acciones
      : accion
        ? [
            {
              id: "accion-principal",
              label: accion,
              icono: "add",
              onClick: onAccion,
              variante: "primary",
            },
          ]
        : [];

  return (
    <section className="page-heading">
      <div className="page-heading-content">
        <div className="page-heading-text">
          <nav className="page-breadcrumb" aria-label="Ruta de navegación">
            <a href="/" className="breadcrumb-home">
              <span className="material-symbols-rounded">
                home
              </span>
              <span>Inicio</span>
            </a>

            <span className="breadcrumb-separator">
              /
            </span>

            <span className="breadcrumb-current">
              {titulo}
            </span>
          </nav>

          <h1>{titulo}</h1>

          <p>{descripcion}</p>
        </div>


        {accionesVisibles.length > 0 && (
          <div className="page-heading-actions">

            {accionesVisibles.map((item, indice) => (
              <button
                key={item.id || `${item.label}-${indice}`}
                type="button"
                className={`page-heading-action page-heading-action-${item.variante || "primary"}`}
                onClick={item.onClick}
                disabled={item.disabled || !item.onClick}
              >
                <span className="material-symbols-rounded">
                  {item.icono || "add"}
                </span>

                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default PageHeader;