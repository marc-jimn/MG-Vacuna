import { useEffect, useRef } from "react";

import L from "leaflet";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "./MapaLocalidades.css";

// =========================================
// ESTADOS DE LAS CAMPAÑAS
// =========================================

const ESTADOS_CAMPANIA = {
  planeada: {
    texto: "Planeada",
    clase: "planeada",
  },
  activa: {
    texto: "Activa",
    clase: "activa",
  },
  finalizada: {
    texto: "Finalizada",
    clase: "finalizada",
  },
  cancelada: {
    texto: "Cancelada",
    clase: "cancelada",
  },
};

function obtenerEstadoCampania(estado) {
  const clave = String(estado || "").toLowerCase();

  return (
    ESTADOS_CAMPANIA[clave] || {
      texto: estado || "Sin estado",
      clase: "desconocida",
    }
  );
}

function formatearCategoria(categoria) {
  const categorias = {
    humana: "Salud Humana",
    veterinaria: "Salud Veterinaria",
  };

  return (
    categorias[String(categoria || "").toLowerCase()] ||
    "Sin categoría"
  );
}

// =========================================
// CREAR MARCADOR PERSONALIZADO
// =========================================

const crearIconoLocalidad = (color) => {
  const colorSeguro =
    /^#[0-9A-Fa-f]{6}$/.test(String(color))
      ? color
      : "#2878B8";

  return L.divIcon({
    className: "localidad-marker-wrapper",

    html: `
      <div
        class="localidad-marker"
        style="--localidad-color: ${colorSeguro}"
      >
        <svg
          viewBox="0 0 36 46"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M18 1 C8.6 1 1 8.6 1 18 C1 29 18 45 18 45 C18 45 35 29 35 18 C35 8.6 27.4 1 18 1 Z"
            fill="var(--localidad-color)"
            stroke="#ffffff"
            stroke-width="1.5"
          />

          <circle
            cx="18"
            cy="17.5"
            r="6"
            fill="#ffffff"
          />

          <circle
            cx="18"
            cy="17.5"
            r="2.5"
            fill="var(--localidad-color)"
          />
        </svg>
      </div>
    `,

    iconSize: [38, 46],
    iconAnchor: [19, 45],
    popupAnchor: [0, -42],
  });
};

// =========================================
// CONTROLAR CENTRADO Y SELECCIÓN DEL MAPA
// =========================================

function ControladorMapa({
  localidades,
  localidadSeleccionadaId,
  referenciasMarcadores,
}) {
  const mapa = useMap();

  const ajusteInicialRealizado = useRef(false);

  // =========================================
  // AJUSTAR MAPA INICIALMENTE
  // =========================================

  useEffect(() => {
    const ubicaciones = localidades
      .filter(
        (localidad) =>
          localidad.latitud !== null &&
          localidad.latitud !== undefined &&
          localidad.longitud !== null &&
          localidad.longitud !== undefined &&
          Number.isFinite(Number(localidad.latitud)) &&
          Number.isFinite(Number(localidad.longitud))
      )
      .map((localidad) => [
        Number(localidad.latitud),
        Number(localidad.longitud),
      ]);

    if (
      ubicaciones.length === 0 ||
      ajusteInicialRealizado.current
    ) {
      return;
    }

    const limites = L.latLngBounds(ubicaciones);

    mapa.fitBounds(limites, {
      padding: [45, 45],
      maxZoom: 13,
    });

    ajusteInicialRealizado.current = true;

  }, [localidades, mapa]);

  // =========================================
  // CENTRAR MAPA AL SELECCIONAR LOCALIDAD
  // =========================================

  useEffect(() => {
    if (localidadSeleccionadaId === null) return;

    const localidad = localidades.find(
      (item) =>
        String(item.id) === String(localidadSeleccionadaId)
    );

    if (!localidad) return;

    const latitud = Number(localidad.latitud);
    const longitud = Number(localidad.longitud);

    if (
      !Number.isFinite(latitud) ||
      !Number.isFinite(longitud)
    ) {
      return;
    }

    const zoom = Math.max(mapa.getZoom(), 14);

    // Desplazamiento vertical para dejar
    // más espacio a la ventana emergente.

    const desplazamientoVertical = Math.min(
      120,
      mapa.getSize().y * 0.25
    );

    const punto = mapa.project(
      [latitud, longitud],
      zoom
    );

    const nuevoCentro = mapa.unproject(
      L.point(
        punto.x,
        punto.y - desplazamientoVertical
      ),
      zoom
    );

    // Animar el movimiento del mapa.

    mapa.flyTo(
      nuevoCentro,
      zoom,
      {
        animate: true,
        duration: 0.7,
      }
    );

    // Abrir la ventana emergente del marcador.

    const marcador =
      referenciasMarcadores.current[String(localidad.id)];

    if (marcador) {
      marcador.openPopup();
    }

  }, [
    localidadSeleccionadaId,
    localidades,
    mapa,
    referenciasMarcadores,
  ]);

  return null;
}

// =========================================
// LISTA DE CAMPAÑAS DEL POPUP
// =========================================

function ListaCampanias({ campanias = [] }) {
  if (!Array.isArray(campanias) || campanias.length === 0) {
    return (
      <div className="localidad-popup-empty">
        <span className="material-symbols-rounded">
          event_busy
        </span>

        <span>
          Esta localidad aún no tiene campañas asignadas.
        </span>
      </div>
    );
  }

  return (
    <div className="localidad-popup-campaigns">
      {campanias.map((campania) => {
        const estado = obtenerEstadoCampania(
          campania.estado
        );

        return (
          <div
            className="localidad-popup-campaign"
            key={campania.id}
          >
            <div className="localidad-popup-campaign-info">
              <strong>
                {campania.nombre}
              </strong>

              {campania.codigo && (
                <span className="localidad-popup-campaign-code">
                  {campania.codigo}
                </span>
              )}
            </div>

            <div className="localidad-popup-campaign-footer">
              <span className="localidad-popup-category">
                {formatearCategoria(campania.categoria)}
              </span>

              <span
                className={`localidad-popup-status localidad-popup-status-${estado.clase}`}
              >
                {estado.texto}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =========================================
// COMPONENTE PRINCIPAL DEL MAPA
// =========================================

function MapaLocalidades({
  localidades = [],
  localidadSeleccionadaId,
  onSeleccionarLocalidad,
}) {
  const referenciasMarcadores = useRef({});

  const localidadesConUbicacion = localidades.filter(
    (localidad) =>
      localidad.latitud !== null &&
      localidad.latitud !== undefined &&
      localidad.longitud !== null &&
      localidad.longitud !== undefined &&
      Number.isFinite(Number(localidad.latitud)) &&
      Number.isFinite(Number(localidad.longitud))
  );

  return (
    <div className="localidades-map-container">

      <MapContainer
        className="localidades-map"
        center={[16.75, -93.12]}
        zoom={12}
        scrollWheelZoom={true}
        zoomControl={false}
      >

        {/* MAPA BASE */}

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ZoomControl position="bottomright" />

        {/* CONTROLADOR DEL MAPA */}

        <ControladorMapa
          localidades={localidadesConUbicacion}
          localidadSeleccionadaId={localidadSeleccionadaId}
          referenciasMarcadores={referenciasMarcadores}
        />

        {/* MARCADORES DE LOCALIDADES */}

        {localidadesConUbicacion.map((localidad) => {
          const id = String(localidad.id);

          const esSeleccionada =
            id === String(localidadSeleccionadaId);

          return (
            <Marker
              key={id}
              position={[
                Number(localidad.latitud),
                Number(localidad.longitud),
              ]}
              icon={crearIconoLocalidad(
                localidad.color_marcador
              )}
              ref={(referencia) => {
                if (referencia) {
                  referenciasMarcadores.current[id] =
                    referencia;
                } else {
                  delete referenciasMarcadores.current[id];
                }
              }}
              zIndexOffset={esSeleccionada ? 1000 : 0}
              eventHandlers={{
                click: () => {
                  onSeleccionarLocalidad(localidad);
                },
              }}
            >
              <Popup>
                <div className="localidad-popup">

                  <div
                    className="localidad-popup-indicator"
                    style={{
                      backgroundColor:
                        localidad.color_marcador || "#2878B8",
                    }}
                  />

                  <div className="localidad-popup-content">

                    <span className="localidad-popup-code">
                      {localidad.codigo}
                    </span>

                    <strong className="localidad-popup-name">
                      {localidad.nombre}
                    </strong>

                    <span className="localidad-popup-municipio">
                      {localidad.municipio}, {localidad.estado}
                    </span>

                    <div className="localidad-popup-divider" />

                    <div className="localidad-popup-campaigns-heading">
                      <span className="material-symbols-rounded">
                        campaign
                      </span>

                      <strong>
                        Campañas vinculadas
                      </strong>
                    </div>

                    <ListaCampanias
                      campanias={localidad.campanias || []}
                    />

                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

      </MapContainer>

    </div>
  );
}

export default MapaLocalidades;