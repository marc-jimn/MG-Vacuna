import { Visita } from "../../domain/entities/Visita.js";

export class CrearVisita {
  constructor(visitaRepository) {
    this.visitaRepository = visitaRepository;
  }

  async ejecutar(datos) {
    const visita = new Visita(datos);
    visita.validar();

    return await this.visitaRepository.crear(visita);
  }
}