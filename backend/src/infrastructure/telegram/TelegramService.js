import crypto from "node:crypto";

const sha256 = (value) =>
    crypto.createHash("sha256").update(value).digest("hex");

export class TelegramService {
    constructor(pool) {
        this.pool = pool;
    }

    async crearCodigo(usuarioId) {
        const codigo = crypto.randomInt(100000, 1000000).toString();
        const codigoHash = sha256(codigo);

        const resultado = await this.pool.query(
            `INSERT INTO telegram_codigos_vinculacion
                (usuario_id, codigo_hash, expira_at)
             SELECT $1, $2, NOW() + INTERVAL '10 minutes'
             WHERE EXISTS (
                SELECT 1
                FROM usuarios u
                INNER JOIN personal p ON p.id = u.personal_id
                WHERE u.id = $1
                  AND u.estado = 'activo'
                  AND p.estado = 'activo'
             )
             RETURNING id`,
            [usuarioId, codigoHash]
        );

        if (!resultado.rowCount) {
            throw new Error(
                "La cuenta no está activa o no se pudo generar el código."
            );
        }

        return codigo;
    }

    async vincular(codigo, telegramUserId, chatId) {
        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            const resultado = await client.query(
                `SELECT id, usuario_id
                 FROM telegram_codigos_vinculacion
                 WHERE codigo_hash = $1
                   AND consumido_at IS NULL
                   AND expira_at > NOW()
                 ORDER BY creado_at DESC
                 LIMIT 1
                 FOR UPDATE`,
                [sha256(codigo)]
            );

            if (!resultado.rowCount) {
                await client.query("ROLLBACK");
                return false;
            }

            const { id, usuario_id } = resultado.rows[0];

            const usuarioActivo = await client.query(
                `SELECT 1
                 FROM usuarios u
                 INNER JOIN personal p ON p.id = u.personal_id
                 WHERE u.id = $1
                   AND u.estado = 'activo'
                   AND p.estado = 'activo'`,
                [usuario_id]
            );

            if (!usuarioActivo.rowCount) {
                await client.query("ROLLBACK");
                return false;
            }

            await client.query(
                `INSERT INTO telegram_vinculaciones
                    (usuario_id, telegram_user_id, chat_id, activo, vinculado_at)
                 VALUES ($1, $2, $3, TRUE, NOW())
                 ON CONFLICT (telegram_user_id)
                 DO UPDATE SET
                    usuario_id = EXCLUDED.usuario_id,
                    chat_id = EXCLUDED.chat_id,
                    activo = TRUE,
                    vinculado_at = NOW(),
                    revocado_at = NULL`,
                [
                    usuario_id,
                    String(telegramUserId),
                    String(chatId)
                ]
            );

            await client.query(
                `UPDATE telegram_codigos_vinculacion
                 SET consumido_at = NOW()
                 WHERE id = $1`,
                [id]
            );

            await client.query("COMMIT");
            return true;

        } catch (error) {
            await client.query("ROLLBACK");
            throw error;

        } finally {
            client.release();
        }
    }

    async obtenerUsuario(telegramUserId) {
        const resultado = await this.pool.query(
            `SELECT
                u.id,
                u.username,
                p.nombres,
                p.apellido_paterno,
                p.apellido_materno,
                r.nombre AS rol
             FROM telegram_vinculaciones tv
             INNER JOIN usuarios u ON u.id = tv.usuario_id
             INNER JOIN personal p ON p.id = u.personal_id
             INNER JOIN rol r ON r.id = p.rol_id
             WHERE tv.telegram_user_id = $1
               AND tv.activo = TRUE
               AND u.estado = 'activo'
               AND p.estado = 'activo'`,
            [String(telegramUserId)]
        );

        return resultado.rows[0] || null;
    }

    async registrarEvento(
        usuarioId,
        telegramUserId,
        pregunta,
        estado
    ) {
        await this.pool.query(
            `INSERT INTO telegram_consultas_auditoria
                (usuario_id, telegram_user_id, pregunta, resultado)
             VALUES ($1, $2, $3, $4)`,
            [
                usuarioId,
                String(telegramUserId),
                String(pregunta).slice(0, 1000),
                estado
            ]
        );
    }
}