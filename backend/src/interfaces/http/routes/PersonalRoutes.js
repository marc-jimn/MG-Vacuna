import { Router } from "express";
import { uploadFoto } from "../middlewares/uploadFoto.js";
import { obtenerContextoUsuario } from "../middlewares/obtenerContextoUsuario.js";

export const crearPersonalRoutes = (
  controller,
  verificarPermiso
) => {

  const router = Router();

  router.use(obtenerContextoUsuario);

  const bloquearCoordinador = (req, res, next) => {
    if (Number(req.contextoUsuario?.rol_id) === 2) {
      return res.status(403).json({
        mensaje: "El coordinador de campaña no puede modificar el personal.",
      });
    }

    next();
  };

  // Consultar todo el personal.
  router.get(
    "/",
    verificarPermiso("personal.ver"),
    controller.obtenerTodos
  );

  // Consultar un registro.
  router.get(
    "/:id",
    verificarPermiso("personal.ver"),
    controller.obtenerPorId
  );

  router.post(
    "/",
    bloquearCoordinador,
    verificarPermiso("personal.crear"),
    controller.crear
  );

  router.put(
    "/:id",
    bloquearCoordinador,
    verificarPermiso("personal.editar"),
    controller.actualizar
  );

  router.post(
    "/:id/foto",
    bloquearCoordinador,
    verificarPermiso("personal.editar"),
    uploadFoto.single("foto"),
    controller.subirFoto
  );

  return router;
};