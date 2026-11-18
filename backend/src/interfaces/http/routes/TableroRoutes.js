import { Router } from "express";
import TableroRepositoryPostgres from "../../../infrastructure/repositories/TableroRepositoryPostgres.js";
import ObtenerInicioTablero from "../../../application/use-cases/ObtenerInicioTablero.js";
import ObtenerReportes from "../../../application/use-cases/ObtenerReportes.js";
import TableroController from "../controllers/TableroController.js";

export const crearRutasTablero = (pool) => {
  const router = Router();
  const repository = new TableroRepositoryPostgres(pool);
  const controller = new TableroController(
    new ObtenerInicioTablero(repository),
    new ObtenerReportes(repository)
  );

  router.get("/tablero/inicio", controller.inicio);
  router.get("/reportes", controller.reportes);

  return router;
};
