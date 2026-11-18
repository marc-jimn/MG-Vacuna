export class RecorridoController {
  constructor({
    obtenerRecorridos,
    obtenerRecorridosPorVisita,
    calcularRecorridosVisita,
  }) {
    this.obtenerRecorridos = obtenerRecorridos;
    this.obtenerRecorridosPorVisita = obtenerRecorridosPorVisita;
    this.calcularRecorridosVisita = calcularRecorridosVisita;
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
      const resultado = await this.obtenerRecorridos.ejecutar();

      res.status(200).json({
        datos: resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  obtenerPorVisita = async (req, res, next) => {
    try {
      const visitaId = this.validarId(req.params.visitaId);

      const resultado =
        await this.obtenerRecorridosPorVisita.ejecutar(visitaId);

      res.status(200).json({
        datos: resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  calcularPorVisita = async (req, res, next) => {
    try {
      const visitaId = this.validarId(req.params.visitaId);

      const resultado =
        await this.calcularRecorridosVisita.ejecutar(visitaId);

      res.status(200).json({
        mensaje: "Proceso de cálculo de recorridos finalizado.",
        datos: resultado,
      });
    } catch (error) {
      next(error);
    }
  };
}