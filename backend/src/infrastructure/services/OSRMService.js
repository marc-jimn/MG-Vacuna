export class OSRMService {
  constructor() {
    this.baseUrl = (
      process.env.OSRM_BASE_URL ||
      "https://router.project-osrm.org"
    ).replace(/\/$/, "");
  }

  async obtenerRutaIdaVuelta(origen, destino) {
    const coordenadas = [
      origen,
      destino,
      origen,
    ];

    for (const punto of coordenadas) {
      const latitud = Number(punto.latitud);
      const longitud = Number(punto.longitud);

      if (
        !Number.isFinite(latitud) ||
        !Number.isFinite(longitud) ||
        latitud < -90 ||
        latitud > 90 ||
        longitud < -180 ||
        longitud > 180
      ) {
        throw new Error("Una de las coordenadas no es válida.");
      }
    }

    const coordenadasURL = coordenadas
      .map(
        (punto) =>
          `${Number(punto.longitud)},${Number(punto.latitud)}`
      )
      .join(";");

    const parametros = new URLSearchParams({
      overview: "full",
      geometries: "geojson",
      steps: "true",
    });

    const url =
      `${this.baseUrl}/route/v1/driving/` +
      `${coordenadasURL}?${parametros.toString()}`;

    const respuesta = await fetch(url, {
      signal: AbortSignal.timeout(20000),
    });

    if (!respuesta.ok) {
      throw new Error(
        `El servicio de rutas respondió con HTTP ${respuesta.status}.`
      );
    }

    const resultado = await respuesta.json();

    if (
      resultado.code !== "Ok" ||
      !resultado.routes?.length
    ) {
      throw new Error(
        resultado.message ||
        "No se pudo encontrar un recorrido por calles para este punto."
      );
    }

    const ruta = resultado.routes[0];

    if (
      !ruta.geometry ||
      ruta.geometry.type !== "LineString" ||
      !Array.isArray(ruta.geometry.coordinates)
    ) {
      throw new Error(
        "El servicio no devolvió una geometría válida."
      );
    }

    const instrucciones = {
      proveedor: "OSRM",

      tramos: ruta.legs.map((tramo, indice) => ({
        tipo: indice === 0 ? "ida" : "regreso",

        distancia_m: tramo.distance,
        duracion_seg: tramo.duration,

        pasos: (tramo.steps || []).map((paso) => ({
          calle: paso.name || "Sin nombre de calle",
          distancia_m: paso.distance,
          duracion_seg: paso.duration,
          modo: paso.mode,
          maniobra: paso.maneuver?.type || null,
          modificador: paso.maneuver?.modifier || null,
        })),
      })),
    };

    return {
      geometria: ruta.geometry,
      distancia_m: ruta.distance,
      duracion_seg: Math.round(ruta.duration),
      instrucciones,
    };
  }
}