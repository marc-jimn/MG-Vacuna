import { Router } from "express";

export const crearRecorridoRoutes = (controller) => {
  const router = Router();

  // Consultar todos los recorridos.
  router.get("/", controller.obtenerTodos);

  // Consultar los recorridos de una visita.
  router.get(
    "/visitas/:visitaId",
    controller.obtenerPorVisita
  );

  // Calcular todos los recorridos de una visita.
  router.post(
    "/visitas/:visitaId/calcular",
    controller.calcularPorVisita
  );

  return router;
};