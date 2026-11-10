import {pool} from '../db.js';
import {config} from '../config.js';

export async function requireApiKey(request, reply) {
    if (request.headers['x-api-key'] !== config.apiKey) {
        return reply.code(401).send({error: 'Unauthorized'});
    }
}

export async function controlRoutes(fastify) {
    // GET /api/control
    fastify.get('/api/control', {preValidation: requireApiKey}, async () => {
        const [rows] = await pool.execute(
            `SELECT mode, threshold, updated_at
             FROM control
             WHERE id = ?`,
            [1]
        );

        const row = rows[0];
        if (!row) {
            return {mode: 'auto', threshold: 80, updated_at: null};
        }

        return {
            mode: row.mode,
            threshold: Number(row.threshold),
            updated_at: row.updated_at
        };
    });

    // PUT /api/control
    fastify.put(
        '/api/control',
        {
            preValidation: requireApiKey,
            schema: {
                body: {
                    type: 'object',
                    required: ['mode', 'threshold'],
                    additionalProperties: false,
                    properties: {
                        mode: {type: 'string', enum: ['auto', 'on', 'off']},
                        threshold: {type: 'number', minimum: 0, maximum: 100}
                    }
                }
            }
        },
        async (request) => {
            const {mode, threshold} = request.body;

            await pool.execute(
                `UPDATE control
                 SET mode      = ?,
                     threshold = ?
                 WHERE id = ?`,
                [mode, threshold, 1]
            );

            const [rows] = await pool.execute(
                `SELECT mode, threshold, updated_at
                 FROM control
                 WHERE id = ?`,
                [1]
            );

            const row = rows[0];
            return {
                mode: row.mode,
                threshold: Number(row.threshold),
                updated_at: row.updated_at
            };
        }
    );
}

