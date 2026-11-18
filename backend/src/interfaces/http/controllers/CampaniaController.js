export class CampaniaController {

  constructor({
    crearCampania,
    obtenerCampanias,
    obtenerCampaniaPorId,
    actualizarCampania,
    obtenerResponsables: obtenerResponsablesUseCase,
  }) {
    this.crearCampania = crearCampania;
    this.obtenerCampanias = obtenerCampanias;
    this.obtenerCampaniaPorId = obtenerCampaniaPorId;
    this.actualizarCampania = actualizarCampania;
    this.obtenerResponsablesUseCase = obtenerResponsablesUseCase;
  }

  crear = async (req, res, next) => {
    try {
      const resultado = await this.crearCampania.ejecutar(
        req.body
      );

      res.status(201).json({
        mensaje: "Campaña registrada correctamente.",
        datos: resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  obtenerTodos = async (req, res, next) => {
    try {
      const resultado = await this.obtenerCampanias.ejecutar();

      res.status(200).json({
        datos: resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  obtenerPorId = async (req, res, next) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          mensaje: "El ID proporcionado no es válido.",
        });
      }

      const resultado = await this.obtenerCampaniaPorId.ejecutar(
        id
      );

      if (!resultado) {
        return res.status(404).json({
          mensaje: "No se encontró la campaña solicitada.",
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
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          mensaje: "El ID proporcionado no es válido.",
        });
      }

      const resultado = await this.actualizarCampania.ejecutar(
        id,
        req.body
      );

      if (!resultado) {
        return res.status(404).json({
          mensaje: "No se encontró la campaña solicitada.",
        });
      }

      res.status(200).json({
        mensaje: "Campaña actualizada correctamente.",
        datos: resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  obtenerResponsables = async (req, res, next) => {
    try {
      const resultado = await this.obtenerResponsablesUseCase.ejecutar();

      res.status(200).json({
        datos: resultado,
      });
    } catch (error) {
      next(error);
    }
  };
}