import api from "./api";

export const iniciarSesion = async (correo, password) => {
  const respuesta = await api.post("/auth/login", {
    correo,
    password,
  });

  const { token, usuario } = respuesta.data.datos;

  localStorage.setItem("token", token);
  localStorage.setItem("usuario", JSON.stringify(usuario));

  return usuario;
};

export const cerrarSesion = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
};

export const obtenerUsuario = () => {
  const usuario = localStorage.getItem("usuario");

  return usuario ? JSON.parse(usuario) : null;
};

export const estaAutenticado = () => {
  return Boolean(localStorage.getItem("token"));
};