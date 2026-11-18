import { Router } from "express";

import LocalidadRepositoryPostgres from "../../../infrastructure/repositories/LocalidadRepositoryPostgres.js";

import ObtenerLocalidades from "../../../application/use-cases/ObtenerLocalidades.js";
import ObtenerLocalidadPorId from "../../../application/use-cases/ObtenerLocalidadPorId.js";
import CrearLocalidad from "../../../application/use-cases/CrearLocalidad.js";
import ActualizarLocalidad from "../../../application/use-cases/ActualizarLocalidad.js";
import CambiarEstadoLocalidad from "../../../application/use-cases/CambiarEstadoLocalidad.js";
import AsignarCampaniasLocalidades from "../../../application/use-cases/AsignarCampaniasLocalidades.js";

import LocalidadController from "../controllers/LocalidadController.js";

import { obtenerContextoUsuario } from "../middlewares/obtenerContextoUsuario.js";

const router = Router();

const localidadRepository = new LocalidadRepositoryPostgres();

const controller = new LocalidadController({
  obtenerLocalidades: new ObtenerLocalidades(localidadRepository),
  obtenerLocalidadPorId: new ObtenerLocalidadPorId(localidadRepository),
  crearLocalidad: new CrearLocalidad(localidadRepository),
  actualizarLocalidad: new ActualizarLocalidad(localidadRepository),
  cambiarEstadoLocalidad: new CambiarEstadoLocalidad(localidadRepository),

  asignarCampaniasLocalidades: new AsignarCampaniasLocalidades(
    localidadRepository
  ),
});

const bloquearCoordinador = (req, res, next) => {
  if (Number(req.contextoUsuario?.rol_id) === 2) {
    return res.status(403).json({
      mensaje: "El coordinador de campaña solo puede consultar localidades.",
    });
  }

  next();
};

router.use(obtenerContextoUsuario);

// Consultar localidades.
router.get("/", controller.obtenerTodos.bind(controller));

// Consultar localidad individual.
router.get("/:id", controller.obtenerPorId.bind(controller));

// Acciones administrativas: bloqueadas para coordinadores.
router.put(
  "/campanias/asignaciones",
  bloquearCoordinador,
  controller.asignarCampanias.bind(controller)
);

router.post(
  "/",
  bloquearCoordinador,
  controller.crear.bind(controller)
);

router.put(
  "/:id",
  bloquearCoordinador,
  controller.actualizar.bind(controller)
);

router.patch(
  "/:id/estado",
  bloquearCoordinador,
  controller.cambiarEstado.bind(controller)
);

export default router;