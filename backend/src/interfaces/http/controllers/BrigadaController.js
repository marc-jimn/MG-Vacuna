export class BrigadaController {
  constructor({
    crearBrigada,
    obtenerBrigadas,
    obtenerBrigadaPorId,
    actualizarBrigada,
    asignarIntegrantes: casoUsoAsignarIntegrantes,
    asignarLocalidades: casoUsoAsignarLocalidades,
  }) {
    this.crearBrigada = crearBrigada;
    this.obtenerBrigadas = obtenerBrigadas;
    this.obtenerBrigadaPorId = obtenerBrigadaPorId;
    this.actualizarBrigada = actualizarBrigada;

    this.casoUsoAsignarIntegrantes = casoUsoAsignarIntegrantes;
    this.casoUsoAsignarLocalidades = casoUsoAsignarLocalidades;
  }

  validarId(id) {
    const identificador = Number(id);

    if (
      !Number.isSafeInteger(identificador) ||
      identificador <= 0
    ) {
      const error = new Error(
        "El identificador proporcionado no es válido."
      );

      error.statusCode = 400;
      throw error;
    }

    return identificador;
  }

  crear = async (req, res, next) => {
    try {
      const resultado = await this.crearBrigada.ejecutar(
        req.body
      );

      res.status(201).json({
        mensaje: "Brigada registrada correctamente.",
        datos: resultado,
      });

    } catch (error) {
      next(error);
    }
  };

  obtenerTodos = async (req, res, next) => {
    try {
      const filtros = {
        campania_id: null,
        estado: null,
      };

      if (req.query.campania_id !== undefined) {
        const campaniaId = Number(req.query.campania_id);

        if (
          !Number.isSafeInteger(campaniaId) ||
          campaniaId <= 0
        ) {
          return res.status(400).json({
            mensaje: "El identificador de campaña no es válido.",
          });
        }

        filtros.campania_id = campaniaId;
      }

      if (req.query.estado !== undefined) {
        const estadosPermitidos = [
          "disponible",
          "asignada",
          "en_ruta",
          "en_visita",
          "terminada",
          "cancelada",
        ];

        if (!estadosPermitidos.includes(req.query.estado)) {
          return res.status(400).json({
            mensaje: "El estado seleccionado no es válido.",
          });
        }

        filtros.estado = req.query.estado;
      }

      const resultado = await this.obtenerBrigadas.ejecutar(
        filtros
      );

      res.status(200).json({
        datos: resultado,
      });

    } catch (error) {
      next(error);
    }
  };

  obtenerPorId = async (req, res, next) => {
    try {
      const id = this.validarId(req.params.id);

      const resultado = await this.obtenerBrigadaPorId.ejecutar(
        id
      );

      if (!resultado) {
        return res.status(404).json({
          mensaje: "No se encontró la brigada solicitada.",
        });
      }

      res.status(200).json({
        datos: resultado,
      });

    } catch (error) {
      next(error);
    }
  };

  actualizar = async (req, res, next) => {
    try {
      const id = this.validarId(req.params.id);

      if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body)
      ) {
        return res.status(400).json({
          mensaje: "Los datos de actualización no son válidos.",
        });
      }

      const resultado = await this.actualizarBrigada.ejecutar(
        id,
        req.body
      );

      if (!resultado) {
        return res.status(404).json({
          mensaje: "No se encontró la brigada solicitada.",
        });
      }

      res.status(200).json({
        mensaje: "Brigada actualizada correctamente.",
        datos: resultado,
      });

    } catch (error) {
      next(error);
    }
  };

  asignarIntegrantes = async (req, res, next) => {
    try {
      const brigadaId = this.validarId(req.params.id);

      const resultado =
        await this.casoUsoAsignarIntegrantes.ejecutar(
          brigadaId,
          req.body.integrantes
        );

      res.status(200).json({
        mensaje: "Integrantes asignados correctamente.",
        datos: resultado,
      });

    } catch (error) {
      next(error);
    }
  };

  asignarLocalidades = async (req, res, next) => {
    try {
      const brigadaId = this.validarId(req.params.id);

      const resultado =
        await this.casoUsoAsignarLocalidades.ejecutar(
          brigadaId,
          req.body.localidad_ids
        );

      res.status(200).json({
        mensaje: "Localidades asignadas correctamente.",
        datos: resultado,
      });

    } catch (error) {
      next(error);
    }
  };
}