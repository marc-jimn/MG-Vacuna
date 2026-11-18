import { Router } from "express";
import { uploadFotoVehiculo } from "../middlewares/uploadFotoVehiculo.js";

export const crearVehiculoRoutes = (controller) => {
  const router = Router();

  router.post("/", controller.crear);

  router.get("/", controller.obtenerTodos);

  router.get("/:id", controller.obtenerPorId);

  router.put("/:id", controller.actualizar);

  router.post(
    "/:id/foto",
    uploadFotoVehiculo.single("foto"),
    controller.subirFoto
  );

  return router;
};