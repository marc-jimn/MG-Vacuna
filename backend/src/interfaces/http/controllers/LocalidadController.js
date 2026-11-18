export default class LocalidadController {
  constructor({
  obtenerLocalidades,
  obtenerLocalidadPorId,
  crearLocalidad,
  actualizarLocalidad,
  cambiarEstadoLocalidad,
  asignarCampaniasLocalidades,
}) {
  this.obtenerLocalidades = obtenerLocalidades;
  this.obtenerLocalidadPorId = obtenerLocalidadPorId;
  this.crearLocalidad = crearLocalidad;
  this.actualizarLocalidad = actualizarLocalidad;
  this.cambiarEstadoLocalidad = cambiarEstadoLocalidad;
  this.asignarCampaniasLocalidades = asignarCampaniasLocalidades;
}

  responderError(res, error) {
    const status =
      error.statusCode ||
      (error.code === "23505" ? 409 : 500);

    const mensaje =
      error.code === "23505"
        ? "El código de localidad ya se encuentra registrado."
        : error.statusCode
          ? error.message
          : "Ocurrió un error al procesar la solicitud de localidades.";

    if (status >= 500) {
      console.error("Error en LocalidadController:", error);
    }

    return res.status(status).json({
      mensaje,
    });
  }

  async obtenerTodos(req, res) {
    try {
      const localidades = await this.obtenerLocalidades.ejecutar();

      return res.status(200).json({
        mensaje: "Localidades obtenidas correctamente.",
        datos: localidades,
      });
    } catch (error) {
      return this.responderError(res, error);
    }
  }

  async obtenerPorId(req, res) {
    try {
      const localidad = await this.obtenerLocalidadPorId.ejecutar(
        req.params.id
      );

      return res.status(200).json({
        mensaje: "Localidad obtenida correctamente.",
        datos: localidad,
      });
    } catch (error) {
      return this.responderError(res, error);
    }
  }

  async crear(req, res) {
    try {
      const localidad = await this.crearLocalidad.ejecutar(req.body);

      return res.status(201).json({
        mensaje: "Localidad registrada correctamente.",
        datos: localidad,
      });
    } catch (error) {
      return this.responderError(res, error);
    }
  }

  async actualizar(req, res) {
    try {
      const localidad = await this.actualizarLocalidad.ejecutar(
        req.params.id,
        req.body
      );

      return res.status(200).json({
        mensaje: "Localidad actualizada correctamente.",
        datos: localidad,
      });
    } catch (error) {
      return this.responderError(res, error);
    }
  }

  async cambiarEstado(req, res) {
    try {
      const localidad = await this.cambiarEstadoLocalidad.ejecutar(
        req.params.id,
        req.body.activa
      );

      return res.status(200).json({
        mensaje: localidad.activa
          ? "Localidad activada correctamente."
          : "Localidad desactivada correctamente.",
        datos: localidad,
      });
    } catch (error) {
      return this.responderError(res, error);
    }
  }

  async asignarCampanias(req, res) {
    try {
      const resultado = await this.asignarCampaniasLocalidades.ejecutar(
        req.body
      );

      return res.status(200).json({
        mensaje: "Las localidades de la campaña se actualizaron correctamente.",
        datos: resultado,
      });

    } catch (error) {
      return this.responderError(res, error);
    }
  }
}