import { Router } from "express";

export const crearRolRoutes = (controller) => {
  const router = Router();

  router.get("/", controller.obtenerTodos);

  return router;
};