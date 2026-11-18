export class ObtenerResumenInventario {

    constructor(repository) {
        this.repository = repository;
    }

    ejecutar() {
        return this.repository.obtenerResumen();
    }

}

export class ObtenerBiologicos {

    constructor(repository) {
        this.repository = repository;
    }

    ejecutar() {
        return this.repository.obtenerBiologicos();
    }

}

export class ObtenerDetalleCampaniaBiologica {

    constructor(repository) {
        this.repository = repository;
    }

    ejecutar(id) {
        return this.repository.obtenerDetalleCampania(id);
    }

}

export class ObtenerMovimientosBiologicos {

    constructor(repository) {
        this.repository = repository;
    }

    ejecutar(filtros) {
        return this.repository.obtenerMovimientosBiologicos(filtros);
    }

}

export class RegistrarRecepcionBiologica {

    constructor(repository) {
        this.repository = repository;
    }

    ejecutar(datos) {
        return this.repository.registrarRecepcionBiologica(datos);
    }

}

export class ConfirmarRecepcionProgramada {

    constructor(repository) {
        this.repository = repository;
    }

    ejecutar(id, datos) {
        return this.repository.confirmarRecepcionProgramada(id, datos);
    }

}

export class ActualizarLoteBiologico {

    constructor(repository) {
        this.repository = repository;
    }

    ejecutar(id, datos) {
        return this.repository.actualizarLoteBiologico(id, datos);
    }

}

export class RegistrarMovimientoBiologico {

    constructor(repository) {
        this.repository = repository;
    }

    ejecutar(datos) {
        return this.repository.registrarMovimientoBiologico(datos);
    }

}

export class ObtenerInsumos {

    constructor(repository) {
        this.repository = repository;
    }

    ejecutar() {
        return this.repository.obtenerInsumos();
    }

}

export class ObtenerMovimientosInsumos {

    constructor(repository) {
        this.repository = repository;
    }

    ejecutar(filtros) {
        return this.repository.obtenerMovimientosInsumos(filtros);
    }

}

export class RegistrarMovimientoInsumo {

    constructor(repository) {
        this.repository = repository;
    }

    ejecutar(datos) {
        return this.repository.registrarMovimientoInsumo(datos);
    }

}

export class CrearInsumo {

    constructor(repository) {
        this.repository = repository;
    }

    ejecutar(datos) {
        return this.repository.crearInsumo(datos);
    }

}
export class ActualizarInsumo {

    constructor(repository) {
        this.repository = repository;
    }

    ejecutar(id, datos) {
        return this.repository.actualizarInsumo(id, datos);
    }

}
export class ObtenerNotificaciones {

    constructor(repository) {
        this.repository = repository;
    }

    ejecutar(filtros) {
        return this.repository.obtenerNotificaciones(filtros);
    }

}
export class MarcarNotificacionLeida {

    constructor(repository) {
        this.repository = repository;
    }

    ejecutar(id) {
        return this.repository.marcarNotificacionLeida(id);
    }

}
export class ResolverNotificacion {

    constructor(repository) {
        this.repository = repository;
    }

    ejecutar(id) {
        return this.repository.resolverNotificacion(id);
    }

}

