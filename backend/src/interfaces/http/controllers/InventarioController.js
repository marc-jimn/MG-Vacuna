import {
    ObtenerResumenInventario,
    ObtenerBiologicos,
    ObtenerDetalleCampaniaBiologica,
    ObtenerMovimientosBiologicos,
    RegistrarRecepcionBiologica,
    ConfirmarRecepcionProgramada,
    ActualizarLoteBiologico,
    RegistrarMovimientoBiologico,
    ObtenerInsumos,
    ObtenerMovimientosInsumos,
    RegistrarMovimientoInsumo,
    CrearInsumo,
    ActualizarInsumo,
    ObtenerNotificaciones,
    MarcarNotificacionLeida,
    ResolverNotificacion
} from "../../../application/use-cases/InventarioUseCases.js";


const ejecutar = (callback, status = 200) => async (req, res) => {

    try {

        const datos = await callback(req);

        return res.status(status).json({
            ok: true,
            mensaje: "Operación realizada correctamente.",
            datos
        });

    } catch (error) {

        const codigosConflicto = new Set([
            "23505",
            "23503",
            "23514",
            "23P01"
        ]);

        const codigosEntrada = new Set([
            "22P02",
            "22003",
            "22007"
        ]);

        const statusCode = Number(error.statusCode) || (
            codigosConflicto.has(error.code)
                ? 409
                : codigosEntrada.has(error.code)
                    ? 400
                    : 500
        );

        const mensaje = statusCode >= 500
            ? "Ocurrió un error al procesar la operación de inventario. Revisa el registro del servidor."
            : error.message;

        if (statusCode >= 500) {
            console.error("[Inventario]", error);
        }

        return res.status(statusCode).json({
            ok: false,
            mensaje,
            detalle: statusCode >= 500 ? undefined : error.message
        });

    }

};


export default class InventarioController {

    constructor(repository) {

        this.repository = repository;

        this.resumen = ejecutar(
            () => new ObtenerResumenInventario(repository).ejecutar()
        );

        this.biologicos = ejecutar(
            () => new ObtenerBiologicos(repository).ejecutar()
        );

        this.detalleCampania = ejecutar(
            req => new ObtenerDetalleCampaniaBiologica(repository).ejecutar(
                req.params.campaniaId
            )
        );

        this.movimientosBiologicos = ejecutar(
            req => new ObtenerMovimientosBiologicos(repository).ejecutar(
                req.query
            )
        );

        this.registrarRecepcion = ejecutar(
            req => new RegistrarRecepcionBiologica(repository).ejecutar(
                req.body
            ),
            201
        );

        this.confirmarRecepcionProgramada = ejecutar(
            req => new ConfirmarRecepcionProgramada(repository).ejecutar(
                req.params.id,
                req.body
            ),
            200
        );

        this.actualizarLoteBiologico = ejecutar(
            req => new ActualizarLoteBiologico(repository).ejecutar(
                req.params.id,
                req.body
            )
        );

        this.registrarMovimientoBiologico = ejecutar(
            req => new RegistrarMovimientoBiologico(repository).ejecutar(
                req.body
            ),
            201
        );

        this.insumos = ejecutar(
            () => new ObtenerInsumos(repository).ejecutar()
        );

        this.movimientosInsumos = ejecutar(
            req => new ObtenerMovimientosInsumos(repository).ejecutar(
                req.query
            )
        );

        this.registrarMovimientoInsumo = ejecutar(
            req => new RegistrarMovimientoInsumo(repository).ejecutar(
                req.body
            ),
            201
        );

        this.crearInsumo = ejecutar(
            req => new CrearInsumo(repository).ejecutar(
                req.body
            ),
            201
        );

        this.actualizarInsumo = ejecutar(
            req => new ActualizarInsumo(repository).ejecutar(
                req.params.id,
                req.body
            )
        );

        this.notificaciones = ejecutar(
            req => new ObtenerNotificaciones(repository).ejecutar(
                req.query
            )
        );

        this.marcarNotificacionLeida = ejecutar(
            req => new MarcarNotificacionLeida(repository).ejecutar(
                req.params.id
            )
        );

        this.resolverNotificacion = ejecutar(
            req => new ResolverNotificacion(repository).ejecutar(
                req.params.id
            )
        );

    }

}