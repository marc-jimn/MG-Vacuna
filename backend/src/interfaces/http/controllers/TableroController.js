export default class TableroController {
  constructor(obtenerInicioTablero, obtenerReportes) {
    this.obtenerInicioTablero = obtenerInicioTablero;
    this.obtenerReportes = obtenerReportes;

    this.inicio = this.inicio.bind(this);
    this.reportes = this.reportes.bind(this);
  }

  async inicio(req, res) {
    try {
      const datos = await this.obtenerInicioTablero.ejecutar();
      return res.status(200).json({ ok: true, mensaje: "Tablero operativo consultado correctamente.", datos });
    } catch (error) {
      console.error("[Tablero] Error al consultar inicio:", error);
      return res.status(500).json({ ok: false, mensaje: "No fue posible consultar el tablero operativo." });
    }
  }

  async reportes(req, res) {
    try {
      const datos = await this.obtenerReportes.ejecutar({
        desde: req.query.desde,
        hasta: req.query.hasta,
        campania_id: req.query.campania_id,
      });
      return res.status(200).json({ ok: true, mensaje: "Reportes consultados correctamente.", datos });
    } catch (error) {
      console.error("[Tablero] Error al consultar reportes:", error);
      const status = error.message?.includes("fecha") ? 400 : 500;
      return res.status(status).json({ ok: false, mensaje: error.message || "No fue posible generar los reportes." });
    }
  }
}
