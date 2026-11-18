import { Navigate, Outlet } from "react-router-dom";
import {
  estaAutenticado,
  obtenerUsuario,
} from "../services/authService";

export default function ProtectedRoute() {
  if (!estaAutenticado()) {
    return <Navigate to="/login" replace />;
  }

  const usuario = obtenerUsuario();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.debe_cambiar_password) {
    return <Navigate to="/cambiar-password" replace />;
  }

  return <Outlet />;
}