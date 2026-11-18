export class VisitaController {
  constructor({
    obtenerVisitas,
    obtenerVisitaPorId,
    crearVisita,
    actualizarVisita,
    agregarJornadas,
    actualizarJornada,
    eliminarJornada,
    cancelarVisita,
    obtenerCatalogos,
    crearPuntoVacunacion,
  }) {
    // Casos de uso
    this.casoObtenerVisitas = obtenerVisitas;
    this.casoObtenerVisitaPorId = obtenerVisitaPorId;
    this.casoCrearVisita = crearVisita;
    this.casoActualizarVisita = actualizarVisita;
    this.casoAgregarJornadas = agregarJornadas;
    this.casoActualizarJornada = actualizarJornada;
    this.casoEliminarJornada = eliminarJornada;
    this.casoCancelarVisita = cancelarVisita;
    this.casoObtenerCatalogos = obtenerCatalogos;
    this.casoCrearPuntoVacunacion = crearPuntoVacunacion;
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

  obtenerTodos = async (req, res, next) => {
    try {
      const filtros = {
        campania_id: null,
        estado: null,
        desde: null,
        hasta: null,
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
          "planeada",
          "activa",
          "completada",
          "cancelada",
        ];

        if (!estadosPermitidos.includes(req.query.estado)) {
          return res.status(400).json({
            mensaje: "El estado de la visita no es válido.",
          });
        }

        filtros.estado = req.query.estado;
      }

      if (req.query.desde !== undefined) {
        filtros.desde = req.query.desde;
      }

      if (req.query.hasta !== undefined) {
        filtros.hasta = req.query.hasta;
      }

      const resultado =
        await this.casoObtenerVisitas.ejecutar(filtros);

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

      const resultado =
        await this.casoObtenerVisitaPorId.ejecutar(id);

      if (!resultado) {
        return res.status(404).json({
          mensaje: "No se encontró la visita solicitada.",
        });
      }

      res.status(200).json({
        datos: resultado,
      });

    } catch (error) {
      next(error);
    }
  };

  crear = async (req, res, next) => {
    try {
      const resultado =
        await this.casoCrearVisita.ejecutar(req.body);

      res.status(201).json({
        mensaje: "Visita registrada correctamente.",
        datos: resultado,
      });

    } catch (error) {
      next(error);
    }
  };

  actualizar = async (req, res, next) => {
    try {
      const id = this.validarId(req.params.id);

      const resultado =
        await this.casoActualizarVisita.ejecutar(
          id,
          req.body
        );

      if (!resultado) {
        return res.status(404).json({
          mensaje: "No se encontró la visita solicitada.",
        });
      }

      res.status(200).json({
        mensaje: "Visita actualizada correctamente.",
        datos: resultado,
      });

    } catch (error) {
      next(error);
    }
  };

  agregarJornadas = async (req, res, next) => {
    try {
      const visitaId = this.validarId(req.params.id);

      const resultado =
        await this.casoAgregarJornadas.ejecutar(
          visitaId,
          req.body.jornadas
        );

      res.status(201).json({
        mensaje: "Jornadas agregadas correctamente.",
        datos: resultado,
      });

    } catch (error) {
      next(error);
    }
  };

  actualizarJornada = async (req, res, next) => {
    try {
      const visitaId = this.validarId(req.params.id);
      const jornadaId = this.validarId(req.params.jornadaId);

      const resultado =
        await this.casoActualizarJornada.ejecutar(
          visitaId,
          jornadaId,
          req.body
        );

      res.status(200).json({
        mensaje: "Jornada actualizada correctamente.",
        datos: resultado,
      });

    } catch (error) {
      next(error);
    }
  };

  eliminarJornada = async (req, res, next) => {
    try {
      const visitaId = this.validarId(req.params.id);
      const jornadaId = this.validarId(req.params.jornadaId);

      const resultado =
        await this.casoEliminarJornada.ejecutar(
          visitaId,
          jornadaId
        );

      res.status(200).json({
        mensaje: "Jornada eliminada correctamente.",
        datos: resultado,
      });

    } catch (error) {
      next(error);
    }
  };

  cancelar = async (req, res, next) => {
    try {
      const id = this.validarId(req.params.id);

      const resultado =
        await this.casoCancelarVisita.ejecutar(id);

      res.status(200).json({
        mensaje: "Visita cancelada correctamente.",
        datos: resultado,
      });

    } catch (error) {
      next(error);
    }
  };

  obtenerCatalogos = async (req, res, next) => {
    try {
      const resultado =
        await this.casoObtenerCatalogos.ejecutar();

      res.status(200).json({
        datos: resultado,
      });

    } catch (error) {
      next(error);
    }
  };

  crearPuntoVacunacion = async (req, res, next) => {
    try {
      const resultado =
        await this.casoCrearPuntoVacunacion.ejecutar(
          req.body
        );

      res.status(201).json({
        mensaje: "Punto de vacunación registrado correctamente.",
        datos: resultado,
      });

    } catch (error) {
      next(error);
    }
  };
}