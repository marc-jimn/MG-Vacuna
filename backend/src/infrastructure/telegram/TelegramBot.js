const TELEGRAM_API = "https://api.telegram.org";

export class TelegramBot {
    constructor({
        token,
        telegramService,
        ollamaService,
        reportes
    }) {
        this.token = token;
        this.telegramService = telegramService;
        this.ollamaService = ollamaService;
        this.reportes = reportes;
        this.offset = 0;
        this.running = false;
    }

    async api(method, body = {}) {
        const response = await fetch(
            `${TELEGRAM_API}/bot${this.token}/${method}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(30000)
            }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(
                data.description || `Telegram HTTP ${response.status}`
            );
        }

        return data.result;
    }

    async enviar(chatId, mensaje) {
        const texto = String(mensaje || "Sin respuesta.");

        for (let i = 0; i < texto.length; i += 4000) {
            await this.api("sendMessage", {
                chat_id: chatId,
                text: texto.slice(i, i + 4000)
            });
        }
    }

    async procesar(update) {
        const message = update.message;

        if (!message?.text || !message.from || !message.chat) {
            return;
        }

        const chatId = message.chat.id;
        const telegramId = message.from.id;
        const texto = message.text.trim();

        if (texto === "/start") {
            return this.enviar(
                chatId,
                "Bienvenido al asistente de MG-Vacuna.\n\n" +
                "Para comenzar, inicia sesión en MG-Vacuna, " +
                "genera tu código temporal de vinculación y envíalo así:\n\n" +
                "/vincular TU_CODIGO"
            );
        }

        if (texto.startsWith("/vincular")) {
            const codigo = texto.split(/\s+/)[1];

            if (!codigo || !/^\d{6}$/.test(codigo)) {
                return this.enviar(
                    chatId,
                    "Formato incorrecto.\nUtiliza: /vincular 123456"
                );
            }

            const vinculado = await this.telegramService.vincular(
                codigo,
                telegramId,
                chatId
            );

            return this.enviar(
                chatId,
                vinculado
                    ? "Tu cuenta MG-Vacuna quedó vinculada correctamente. Ya puedes realizar consultas."
                    : "El código es inválido, ya fue utilizado o ha vencido. Genera uno nuevo desde MG-Vacuna."
            );
        }

        if (texto === "/ayuda") {
            return this.enviar(
                chatId,
                "ASISTENTE MG-VACUNA\n\n" +
                "Puedes consultar indicadores generales de los reportes disponibles.\n\n" +
                "Comandos:\n" +
                "/start - Iniciar\n" +
                "/vincular - Vincular cuenta\n" +
                "/nuevo - Iniciar una consulta nueva\n" +
                "/ayuda - Mostrar ayuda"
            );
        }

        if (texto === "/nuevo") {
            return this.enviar(
                chatId,
                "Consulta nueva. Puedes realizar tu siguiente pregunta."
            );
        }

        if (texto.startsWith("/")) {
            return this.enviar(
                chatId,
                "Comando no reconocido. Escribe /ayuda."
            );
        }

        const usuario = await this.telegramService.obtenerUsuario(
            telegramId
        );

        if (!usuario) {
            return this.enviar(
                chatId,
                "No tienes acceso autorizado. Primero vincula tu cuenta MG-Vacuna."
            );
        }

        try {
            // Solo se consulta el repositorio de reportes existente.
            const datos = await this.reportes.ejecutar({});

            const datosAgregados = {
                periodo: datos.filtros,
                resumen: datos.resumen,
                campanias: datos.campanias,
                localidades: datos.localidades,
                brigadas: datos.brigadas,
                tendencia: datos.tendencia,
                inventarioBiologicos: datos.inventarioBiologicos,
                insumosBajoMinimo: datos.insumosBajoMinimo
            };

            const respuesta = await this.ollamaService.responder(
                texto,
                datosAgregados
            );

            await this.telegramService.registrarEvento(
                usuario.id,
                telegramId,
                texto,
                "correcto"
            );

            return this.enviar(chatId, respuesta);

        } catch (error) {
            await this.telegramService.registrarEvento(
                usuario.id,
                telegramId,
                texto,
                "error"
            ).catch(() => {});

            console.error(
                "[TELEGRAM] Error en consulta:",
                error.message
            );

            return this.enviar(
                chatId,
                "No pude consultar MG-Vacuna en este momento. " +
                "Verifica que PostgreSQL y Ollama estén disponibles."
            );
        }
    }

    async iniciar() {
        if (!this.token || this.running) return;

        this.running = true;

        console.log("[TELEGRAM] Bot iniciado mediante polling.");

        while (this.running) {
            try {
                const updates = await this.api("getUpdates", {
                    offset: this.offset,
                    timeout: 25,
                    allowed_updates: ["message"]
                });

                for (const update of updates) {
                    this.offset = update.update_id + 1;

                    try {
                        await this.procesar(update);
                    } catch (error) {
                        console.error(
                            "[TELEGRAM] Error procesando mensaje:",
                            error.message
                        );
                    }
                }
            } catch (error) {
                if (this.running) {
                    console.error(
                        "[TELEGRAM] Error de polling:",
                        error.message
                    );

                    await new Promise(
                        resolve => setTimeout(resolve, 3000)
                    );
                }
            }
        }
    }

    detener() {
        this.running = false;
    }
}