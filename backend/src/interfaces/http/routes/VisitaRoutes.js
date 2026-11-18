import { Router } from "express";

export const crearVisitaRoutes = (controller) => {
  const router = Router();

  const metodosNecesarios = [
    "obtenerCatalogos",
    "crearPuntoVacunacion",
    "crear",
    "obtenerTodos",
    "agregarJornadas",
    "actualizarJornada",
    "eliminarJornada",
    "cancelar",
    "obtenerPorId",
    "actualizar",
  ];

  for (const metodo of metodosNecesarios) {
    if (typeof controller[metodo] !== "function") {
      throw new Error(
        `El método ${metodo} no existe o no es una función en VisitaController.`
      );
    }
  }

  router.get("/catalogos", controller.obtenerCatalogos);
  router.post("/puntos", controller.crearPuntoVacunacion);
  router.post("/", controller.crear);
  router.get("/", controller.obtenerTodos);
  router.post("/:id/jornadas", controller.agregarJornadas);
  router.put("/:id/jornadas/:jornadaId", controller.actualizarJornada);
  router.delete("/:id/jornadas/:jornadaId", controller.eliminarJornada);
  router.patch("/:id/cancelar", controller.cancelar);
  router.get("/:id", controller.obtenerPorId);
  router.put("/:id", controller.actualizar);

  return router;
};