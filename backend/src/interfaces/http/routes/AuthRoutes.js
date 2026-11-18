import { Router } from "express";

export const crearAuthRoutes = (
  controller,
  autenticarUsuario
) => {

  const router = Router();

  // Inicio de sesión público.
  router.post("/login", controller.login);

  // Perfil del usuario autenticado.
  router.get("/perfil", autenticarUsuario, controller.perfil);

  router.put("/cambiar-password", autenticarUsuario, controller.cambiar);

  return router;
};