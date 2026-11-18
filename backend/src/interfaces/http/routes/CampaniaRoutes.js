import { Router } from "express";

export const crearCampaniaRoutes = (controller) => {
  const router = Router();

  // Registrar campaña
  router.post("/", controller.crear);

  // Obtener coordinadores activos
  router.get("/responsables", controller.obtenerResponsables);

  // Obtener todas las campañas
  router.get("/", controller.obtenerTodos);

  // Obtener campaña por ID
  router.get("/:id", controller.obtenerPorId);

  // Actualizar campaña
  router.put("/:id", controller.actualizar);

  return router;
};