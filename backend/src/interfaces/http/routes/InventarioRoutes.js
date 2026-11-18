import { Router } from "express";
import InventarioRepositoryPostgres from "../../../infrastructure/repositories/InventarioRepositoryPostgres.js";
import InventarioController from "../controllers/InventarioController.js";

export const crearRutasInventario = (pool) => {
  const router = Router();
  const repository = new InventarioRepositoryPostgres(pool);
  const controller = new InventarioController(repository);

  router.get("/resumen", controller.resumen);

  // Biológicos
  router.get("/biologicos", controller.biologicos);
  router.get("/biologicos/movimientos", controller.movimientosBiologicos);
  router.get("/biologicos/campanias/:campaniaId", controller.detalleCampania);
  router.post("/biologicos/recepciones", controller.registrarRecepcion);
  router.post("/biologicos/recepciones/:id/confirmar", controller.confirmarRecepcionProgramada);
  router.patch("/biologicos/lotes/:id", controller.actualizarLoteBiologico);
  router.post("/biologicos/movimientos", controller.registrarMovimientoBiologico);

  // Insumos
  router.get("/insumos", controller.insumos);
  router.get("/insumos/movimientos", controller.movimientosInsumos);
  router.post("/insumos", controller.crearInsumo);
  router.patch("/insumos/:id", controller.actualizarInsumo);
  router.post("/insumos/movimientos", controller.registrarMovimientoInsumo);

  // Campana del header
  router.get("/notificaciones", controller.notificaciones);
  router.patch("/notificaciones/:id/leer", controller.marcarNotificacionLeida);
  router.patch("/notificaciones/:id/resolver", controller.resolverNotificacion);

  return router;
};
