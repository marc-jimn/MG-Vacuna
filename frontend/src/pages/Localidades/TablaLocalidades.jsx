function formatearPoblacion(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "Sin dato";
  }

  return Number(valor).toLocaleString("es-MX");
}

function TablaLocalidades({
  localidades = [],
  cargando,
  localidadSeleccionadaId,
  onSeleccionarLocalidad,
  paginaActual,
  totalPaginas,
  onCambiarPagina,
  totalRegistros,
}) {
  return (
    <div className="localidades-table-wrapper">

      <div className="localidades-table-scroll">

        <table className="localidades-table">

          <thead>
            <tr>
              <th>Código</th>
              <th>Localidad</th>
              <th>Tipo</th>
              <th>Código postal</th>
              <th>Población</th>
              <th>Estado</th>
              <th>Ubicación</th>
            </tr>
          </thead>

          <tbody>

            {cargando ? (

              <tr>
                <td colSpan="7" className="localidades-table-message">
                  <span className="material-symbols-rounded">
                    progress_activity
                  </span>
                  Cargando localidades...
                </td>
              </tr>

            ) : localidades.length === 0 ? (

              <tr>
                <td colSpan="7" className="localidades-table-message">
                  <span className="material-symbols-rounded">
                    location_off
                  </span>
                  No se encontraron localidades.
                </td>
              </tr>

            ) : (

              localidades.map((localidad) => {

                const seleccionada =
                  String(localidad.id) ===
                  String(localidadSeleccionadaId);

                const tieneUbicacion =
                  localidad.latitud !== null &&
                  localidad.latitud !== undefined &&
                  localidad.longitud !== null &&
                  localidad.longitud !== undefined;

                return (
                  <tr
                    key={localidad.id}
                    className={
                      seleccionada
                        ? "localidades-row-selected"
                        : ""
                    }
                    onClick={() =>
                      onSeleccionarLocalidad(localidad)
                    }
                    aria-selected={seleccionada}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSeleccionarLocalidad(localidad);
                      }
                    }}
                  >

                    <td>
                      <span className="localidades-code">
                        {localidad.codigo}
                      </span>
                    </td>

                    <td>
                      <div className="localidades-name-cell">

                        <span
                          className="localidades-color-dot"
                          style={{
                            backgroundColor:
                              localidad.color_marcador || "#2878B8",
                          }}
                        />

                        <span className="localidades-name">
                          {localidad.nombre}
                        </span>

                      </div>
                    </td>

                    <td>
                      <span className="localidades-type">
                        {localidad.tipo || "Sin clasificar"}
                      </span>
                    </td>

                    <td>
                      {localidad.codigo_postal || "—"}
                    </td>

                    <td className="localidades-population">
                      {formatearPoblacion(localidad.poblacion)}
                    </td>

                    <td>
                      <span
                        className={
                          localidad.activa
                            ? "localidades-status localidades-status-active"
                            : "localidades-status localidades-status-inactive"
                        }
                      >
                        {localidad.activa ? "Activa" : "Inactiva"}
                      </span>
                    </td>

                    <td>
                      {tieneUbicacion ? (
                        <span className="localidades-location-available">
                          <span className="material-symbols-rounded">
                            location_on
                          </span>
                          Ver en mapa
                        </span>
                      ) : (
                        <span className="localidades-location-missing">
                          Sin coordenadas
                        </span>
                      )}
                    </td>

                  </tr>
                );
              })

            )}

          </tbody>

        </table>

      </div>


      {/* PAGINACIÓN */}
      <div className="localidades-pagination">

        <span className="localidades-pagination-info">
          {totalRegistros === 0
            ? "Sin registros"
            : `Página ${paginaActual} de ${totalPaginas} · ${totalRegistros} localidades`}
        </span>

        <div className="localidades-pagination-buttons">

          <button
            type="button"
            disabled={paginaActual <= 1 || cargando}
            onClick={() => onCambiarPagina(paginaActual - 1)}
            aria-label="Página anterior"
          >
            <span className="material-symbols-rounded">
              chevron_left
            </span>
          </button>

          <button
            type="button"
            disabled={paginaActual >= totalPaginas || cargando}
            onClick={() => onCambiarPagina(paginaActual + 1)}
            aria-label="Página siguiente"
          >
            <span className="material-symbols-rounded">
              chevron_right
            </span>
          </button>

        </div>

      </div>

    </div>
  );
}

export default TablaLocalidades;