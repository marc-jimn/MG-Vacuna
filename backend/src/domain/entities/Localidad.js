const TIPOS_LOCALIDAD = [
  "localidad",
  "colonia",
  "barrio",
  "ejido",
  "rancheria",
  "otro",
];

export default class Localidad {
  static validar(datos) {
    if (!datos || typeof datos !== "object") {
      throw this.error("Los datos de la localidad son obligatorios.");
    }

    const codigo = String(datos.codigo || "").trim();
    const nombre = String(datos.nombre || "").trim();

    if (!codigo) {
      throw this.error("El código de la localidad es obligatorio.");
    }

    if (codigo.length > 30) {
      throw this.error("El código no puede superar 30 caracteres.");
    }

    if (!nombre) {
      throw this.error("El nombre de la localidad es obligatorio.");
    }

    if (nombre.length > 150) {
      throw this.error("El nombre no puede superar 150 caracteres.");
    }

    const municipio = String(
      datos.municipio || "Tuxtla Gutiérrez"
    ).trim();

    const estado = String(datos.estado || "Chiapas").trim();

    if (!municipio || municipio.length > 120) {
      throw this.error("El municipio no es válido.");
    }

    if (!estado || estado.length > 120) {
      throw this.error("El estado no es válido.");
    }

    const codigoPostal = datos.codigo_postal
      ? String(datos.codigo_postal).trim()
      : null;

    if (codigoPostal && codigoPostal.length > 10) {
      throw this.error("El código postal no es válido.");
    }

    let poblacion = null;

    if (datos.poblacion !== null &&
        datos.poblacion !== undefined &&
        datos.poblacion !== "") {
      poblacion = Number(datos.poblacion);

      if (!Number.isSafeInteger(poblacion) || poblacion < 0) {
        throw this.error("La población debe ser un entero mayor o igual a cero.");
      }
    }

    let tipo = datos.tipo ? String(datos.tipo).trim() : null;

    if (tipo && !TIPOS_LOCALIDAD.includes(tipo)) {
      throw this.error("El tipo de localidad no es válido.");
    }

    const tieneLatitud =
      datos.latitud !== null &&
      datos.latitud !== undefined &&
      datos.latitud !== "";

    const tieneLongitud =
      datos.longitud !== null &&
      datos.longitud !== undefined &&
      datos.longitud !== "";

    if (tieneLatitud !== tieneLongitud) {
      throw this.error("Debes proporcionar latitud y longitud juntas.");
    }

    let latitud = null;
    let longitud = null;

    if (tieneLatitud && tieneLongitud) {
      latitud = Number(datos.latitud);
      longitud = Number(datos.longitud);

      if (
        !Number.isFinite(latitud) ||
        latitud < -90 ||
        latitud > 90
      ) {
        throw this.error("La latitud debe estar entre -90 y 90.");
      }

      if (
        !Number.isFinite(longitud) ||
        longitud < -180 ||
        longitud > 180
      ) {
        throw this.error("La longitud debe estar entre -180 y 180.");
      }
    }

    const colorMarcador = datos.color_marcador || "#2878B8";

    if (!/^#[0-9A-Fa-f]{6}$/.test(colorMarcador)) {
      throw this.error("El color del marcador no es válido.");
    }

    let activa = true;

    if (datos.activa !== undefined) {
      if (typeof datos.activa !== "boolean") {
        throw this.error("El estado de la localidad no es válido.");
      }

      activa = datos.activa;
    }

    return {
      codigo,
      nombre,
      tipo,
      municipio,
      estado,
      codigo_postal: codigoPostal,
      poblacion,
      latitud,
      longitud,
      color_marcador: colorMarcador,
      activa,
    };
  }

  static error(mensaje) {
    const error = new Error(mensaje);
    error.statusCode = 400;
    return error;
  }
}