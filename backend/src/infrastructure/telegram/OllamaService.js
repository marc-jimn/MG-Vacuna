export class OllamaService {
    constructor({
        url = "http://127.0.0.1:11434",
        model = "llama3.2:3b",
        timeoutMs = 0
    }) {
        this.url = url.replace(/\/+$/, "");
        this.model = model;
        this.timeoutMs = timeoutMs;
    }

    async responder(pregunta, datos) {
        const controller = new AbortController();

        const inicio = Date.now();

        const timer = this.timeoutMs > 0
            ? setTimeout(() => controller.abort(), this.timeoutMs)
            : null;

        try {
            const contenido = JSON.stringify(datos ?? {});

            const cuerpo = {
                model: this.model,
                stream: false,
                keep_alive: "5m",
                options: {
                    temperature: 0.2,
                    num_predict: 256
                },
                messages: [
                    {
                        role: "system",
                        content:
                            "Eres el asistente institucional de MG-Vacuna. " +
                            "Responde siempre en español, con claridad y profesionalismo. " +
                            "Utiliza exclusivamente los indicadores proporcionados. " +
                            "No inventes cifras ni completes información faltante. " +
                            "No reveles datos personales. " +
                            "Si no tienes información suficiente, dilo claramente. " +
                            "No afirmes que realizaste modificaciones en el sistema. " +
                            "Prioriza respuestas concretas, breves y organizadas."
                    },
                    {
                        role: "user",
                        content:
                            `DATOS AGREGADOS:\n${contenido}\n\n` +
                            `PREGUNTA:\n${pregunta}`
                    }
                ]
            };

            const cuerpoJSON = JSON.stringify(cuerpo);

            console.log(
                `[OLLAMA] Enviando solicitud. Datos: ${contenido.length} caracteres.`
            );

            const response = await fetch(
                `${this.url}/api/chat`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    signal: controller.signal,
                    body: cuerpoJSON
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Ollama respondió HTTP ${response.status}.`
                );
            }

            const resultado = await response.json();

            const respuesta = resultado.message?.content?.trim();

            if (!respuesta) {
                throw new Error("Ollama devolvió una respuesta vacía.");
            }

            console.log(
                `[OLLAMA] Respuesta recibida en ${Date.now() - inicio} ms.`
            );

            return respuesta;

        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error(
                    `Ollama superó el tiempo límite de ${this.timeoutMs / 1000} segundos.`
                );
            }

            throw error;

        } finally {
            if (timer) clearTimeout(timer);
        }
    }
}