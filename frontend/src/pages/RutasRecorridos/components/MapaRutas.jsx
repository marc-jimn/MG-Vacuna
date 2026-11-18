import { Fragment, useEffect, useMemo } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

import {
  ORIGEN,
  colorDeRuta,
  formatearRango,
  formatearDistancia,
  formatearDuracion,
  ESTADOS_JORNADA,
} from "../rutasUtils";

import "leaflet/dist/leaflet.css";

function crearIconoOrigen() {
  return L.divIcon({
    className: "rutas-leaflet-origin",
    html: `
      <div class="rutas-origin-pin">
        <span class="material-symbols-rounded">account_balance</span>
      </div>
    `,
    iconSize: [42, 46],
    iconAnchor: [21, 43],
  });
}

function crearIconoDestino(estado) {
  const completada = estado === "completada";
  const cancelada = estado === "cancelada";
  return L.divIcon({
    className: "rutas-leaflet-destination",
    html: `
      <div class="rutas-destination-pin ${completada ? "done" : ""} ${cancelada ? "cancelled" : ""}">
        <span class="material-symbols-rounded">location_on</span>
        ${completada ? '<i class="rutas-pin-check">✓</i>' : ""}
        ${cancelada ? '<i class="rutas-pin-check">×</i>' : ""}
      </div>
    `,
    iconSize: [40, 46],
    iconAnchor: [20, 43],
  });
}

function AjustarVista({ rutas, mostrarOrigen }) {
  const mapa = useMap();

  useEffect(() => {
    const puntos = [];

    if (mostrarOrigen) puntos.push([ORIGEN.latitud, ORIGEN.longitud]);

    rutas.forEach((ruta) => {
      const coords = ruta.geometria?.coordinates || [];
      if (coords.length > 0) {
        puntos.push([coords[0][1], coords[0][0]]);
        puntos.push([coords[coords.length - 1][1], coords[coords.length - 1][0]]);
      }
      if (ruta.punto_latitud != null && ruta.punto_longitud != null && Number.isFinite(Number(ruta.punto_latitud)) && Number.isFinite(Number(ruta.punto_longitud))) {
        puntos.push([Number(ruta.punto_latitud), Number(ruta.punto_longitud)]);
      }
    });

    if (puntos.length > 1) {
      mapa.fitBounds(L.latLngBounds(puntos), {
        padding: [75, 75],
        maxZoom: 14,
        animate: true,
      });
    } else if (puntos.length === 1) {
      mapa.setView(puntos[0], 13, { animate: true });
    }
  }, [mapa, rutas, mostrarOrigen]);

  return null;
}

function NotaMapa({ ruta, indice }) {
  const estado = ruta.jornada_estado || "programada";
  const etiquetaEstado = ESTADOS_JORNADA[estado] || estado;
  const desplazamientos = [
    [-8, -34],
    [70, -44],
    [-72, -82],
    [78, -92],
  ];
  const offset = desplazamientos[indice % desplazamientos.length];

  return (
    <Tooltip
      permanent
      direction="top"
      offset={offset}
      opacity={1}
      className={`rutas-map-note ${estado}`}
    >
      <div className="rutas-map-note-content">
        <strong>{ruta.punto_nombre}</strong>
        <span>{formatearRango(ruta.fecha_inicio, ruta.fecha_fin)}</span>
        <small className={`rutas-map-note-status ${estado}`}>
          {estado === "completada" && <span className="material-symbols-rounded">check_circle</span>}
          {etiquetaEstado}
        </small>
      </div>
    </Tooltip>
  );
}

function ContenidoMapa({ rutas, seleccionadoJornadaId, mostrarOrigen }) {
  const origenIcono = useMemo(() => crearIconoOrigen(), []);

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {mostrarOrigen && (
        <Marker position={[ORIGEN.latitud, ORIGEN.longitud]} icon={origenIcono} zIndexOffset={1200}>
          <Tooltip permanent direction="top" offset={[0, -34]} className="rutas-origin-note">
            <div className="rutas-origin-note-content">
              <strong>{ORIGEN.nombre}</strong>
              <span>Punto de partida</span>
            </div>
          </Tooltip>
        </Marker>
      )}

      {rutas.map((ruta, indice) => {
        const color = colorDeRuta(indice);
        const coords = ruta.geometria?.coordinates || [];
        const posiciones = coords.map(([longitud, latitud]) => [latitud, longitud]);
        const tienePunto = ruta.punto_latitud != null && ruta.punto_longitud != null;
        const latitud = tienePunto ? Number(ruta.punto_latitud) : null;
        const longitud = tienePunto ? Number(ruta.punto_longitud) : null;
        const seleccionado = Number(ruta.jornada_id) === Number(seleccionadoJornadaId);
        const icono = crearIconoDestino(ruta.jornada_estado);

        return (
          <Fragment key={ruta.recorrido_id || ruta.jornada_id}>
            {posiciones.length > 1 && (
              <Polyline
                positions={posiciones}
                pathOptions={{
                  color,
                  weight: seleccionado ? 6 : 4,
                  opacity: seleccionado ? 0.98 : 0.78,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            )}

            {tienePunto && (
              <Marker position={[latitud, longitud]} icon={icono} zIndexOffset={seleccionado ? 1100 : 700}>
                <NotaMapa ruta={ruta} indice={indice} />
                <Tooltip direction="bottom" offset={[0, 12]}>
                  <div className="rutas-map-popup">
                    <strong>{ruta.punto_nombre}</strong>
                    <span>{ruta.sector}</span>
                    <span>{formatearDistancia(ruta.distancia_m)} · {formatearDuracion(ruta.duracion_seg)}</span>
                  </div>
                </Tooltip>
              </Marker>
            )}
          </Fragment>
        );
      })}

      <AjustarVista rutas={rutas} mostrarOrigen={mostrarOrigen} />
    </>
  );
}

export default function MapaRutas({ rutas = [], seleccionadoJornadaId = null, mostrarOrigen = true }) {
  return (
    <div className="rutas-map-shell">
      <MapContainer
        center={[ORIGEN.latitud, ORIGEN.longitud]}
        zoom={12}
        scrollWheelZoom
        className="rutas-map"
      >
        <ContenidoMapa
          rutas={rutas}
          seleccionadoJornadaId={seleccionadoJornadaId}
          mostrarOrigen={mostrarOrigen}
        />
      </MapContainer>

      {rutas.length === 0 && (
        <div className="rutas-map-empty-hint">
          <span className="material-symbols-rounded">route</span>
          <div>
            <strong>Tu siguiente recorrido empieza aquí</strong>
            <span>Selecciona una visita y pulsa «Dibujar recorrido».</span>
          </div>
        </div>
      )}

      {rutas.length > 0 && (
        <div className="rutas-map-legend">
          <span><i className="origin" /> Origen</span>
          <span><i className="done" /> Punto completado</span>
          <span><i className="pending" /> Punto pendiente</span>
        </div>
      )}
    </div>
  );
}
