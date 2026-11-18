export class VisitaRepository {
  async obtenerTodos() {
    throw new Error("Método obtenerTodos no implementado.");
  }

  async obtenerPorId(id) {
    throw new Error("Método obtenerPorId no implementado.");
  }

  async crear(datos) {
    throw new Error("Método crear no implementado.");
  }

  async actualizar(id, datos) {
    throw new Error("Método actualizar no implementado.");
  }

  async agregarJornadas(visitaId, jornadas) {
    throw new Error("Método agregarJornadas no implementado.");
  }

  async actualizarJornada(visitaId, jornadaId, datos) {
    throw new Error("Método actualizarJornada no implementado.");
  }

  async eliminarJornada(visitaId, jornadaId) {
    throw new Error("Método eliminarJornada no implementado.");
  }

  async cancelar(id) {
    throw new Error("Método cancelar no implementado.");
  }

  async obtenerCatalogos() {
    throw new Error("Método obtenerCatalogos no implementado.");
  }

  async crearPuntoVacunacion(datos) {
    throw new Error("Método crearPuntoVacunacion no implementado.");
  }

  async actualizarEstadosAutomaticos() {
    throw new Error("Método actualizarEstadosAutomaticos no implementado.");
  }
}