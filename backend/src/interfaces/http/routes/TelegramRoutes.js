import { Router } from "express";

export const crearTelegramRoutes = (telegramService) => {
    const router = Router();

    router.post("/codigo", async (req, res, next) => {
        try {
            const codigo = await telegramService.crearCodigo(
                req.usuario.id
            );

            return res.status(201).json({
                mensaje:
                    "Código generado. Envíalo al bot con /vincular. Caduca en 10 minutos.",
                datos: {
                    codigo,
                    expira_en_minutos: 10
                }
            });

        } catch (error) {
            next(error);
        }
    });

    return router;
};