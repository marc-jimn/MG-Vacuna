
import { Router } from "express";
import { obtenerContextoUsuario } from "../middlewares/obtenerContextoUsuario.js";

export const crearBrigadaRoutes = (controller) => {
  const router = Router();

  router.use(obtenerContextoUsuario);

  const bloquearCoordinador = (req, res, next) => {
    if (Number(req.contextoUsuario?.rol_id) === 2) {
      return res.status(403).json({
        mensaje: "El coordinador puede consultar brigadas, pero no modificarlas.",
      });
    }

    next();
  };

  // Consultar brigadas.
  router.get("/", controller.obtenerTodos);

  // Consultar brigada individual.
  router.get("/:id", controller.obtenerPorId);

  // Acciones de modificación.
  router.post("/", bloquearCoordinador, controller.crear);

  router.put(
    "/:id/integrantes",
    bloquearCoordinador,
    controller.asignarIntegrantes
  );

  router.put(
    "/:id/localidades",
    bloquearCoordinador,
    controller.asignarLocalidades
  );

  router.put("/:id", bloquearCoordinador, controller.actualizar);

  return router;
};