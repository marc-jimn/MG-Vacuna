export class RolController {
  constructor(obtenerRoles) {
    this.obtenerRoles = obtenerRoles;
  }

  obtenerTodos = async (req, res, next) => {
    try {
      const roles = await this.obtenerRoles.ejecutar();

      res.status(200).json({
        total: roles.length,
        datos: roles,
      });
    } catch (error) {
      next(error);
    }
  };
}