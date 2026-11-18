export class BrigadaRepository {

  async crear(datos) {
    throw new Error("Método crear no implementado.");
  }

  async obtenerTodos(filtros) {
    throw new Error("Método obtenerTodos no implementado.");
  }

  async obtenerPorId(id) {
    throw new Error("Método obtenerPorId no implementado.");
  }

  async actualizar(id, datos) {
    throw new Error("Método actualizar no implementado.");
  }

  async asignarIntegrantes(brigadaId, integrantes) {
    throw new Error("Método asignarIntegrantes no implementado.");
  }

  async asignarLocalidades(brigadaId, localidadIds) {
    throw new Error("Método asignarLocalidades no implementado.");
  }
}