import {pool} from '../db.js';
import {nowUnixSeconds, parseTimestampParam} from '../utils/time.js';
import {requireApiKey} from "./control.js";

export async function readingsRoutes(fastify) {
    // POST /api/readings
    fastify.post(
        '/api/readings',
        {
            preValidation: requireApiKey,
            schema: {
                body: {
                    type: 'object',
                    required: ['humidity', 'temperature', 'relay'],
                    additionalProperties: false,
                    properties: {
                        humidity: {type: 'number'},
                        temperature: {type: 'number'},
                        relay: {type: 'boolean'}
                    }
                }
            }
        },
        async (request) => {
            const {humidity, temperature, relay} = request.body;
            const nowTs = nowUnixSeconds();
            const sevenDaysAgoTs = nowTs - 7 * 24 * 60 * 60;

            await pool.execute(
                `INSERT INTO readings (ts, humidity, temperature, relay)
                 VALUES (?, ?, ?, ?)`,
                [nowTs, humidity, temperature, relay ? 1 : 0]
            );

            await pool.execute(`DELETE
                                FROM readings
                                WHERE ts < ?`, [sevenDaysAgoTs]);

            const [controlRows] = await pool.execute(
                `SELECT mode, threshold
                 FROM control
                 WHERE id = ?`,
                [1]
            );

            const control = controlRows[0] ?? {mode: 'auto', threshold: 80};
            return {
                mode: control.mode,
                threshold: Number(control.threshold)
            };
        }
    );

    // GET /api/latest
    fastify.get('/api/latest', {preValidation: requireApiKey}, async () => {
        const nowTs = nowUnixSeconds();

        const [readingRows] = await pool.execute(
            `SELECT ts, humidity, temperature, relay
             FROM readings
             ORDER BY ts DESC, id DESC LIMIT 1`
        );

        const [controlRows] = await pool.execute(
            `SELECT mode, threshold, updated_at
             FROM control
             WHERE id = ?`,
            [1]
        );

        const rawReading = readingRows[0] ?? null;
        const reading = rawReading
            ? {
                humidity: Number(rawReading.humidity),
                temperature: Number(rawReading.temperature),
                relay: Boolean(rawReading.relay),
                ts: Number(rawReading.ts)
            }
            : null;

        const age = reading ? Math.max(0, nowTs - reading.ts) : null;

        const rawControl = controlRows[0];
        const control = rawControl
            ? {
                mode: rawControl.mode,
                threshold: Number(rawControl.threshold),
                updated_at: rawControl.updated_at
            }
            : {mode: 'auto', threshold: 80, updated_at: null};

        return {
            reading,
            age,
            control
        };
    });

    // GET /api/readings
    fastify.get(
        '/api/readings',
        {
            schema: {
                querystring: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        from: {type: 'string'},
                        to: {type: 'string'},
                        limit: {type: 'integer', minimum: 1, maximum: 2000, default: 120}
                    }
                }
            }
        },
        async (request, reply) => {
            const {from, to, limit} = request.query;
            const nowTs = nowUnixSeconds();

            let fromTs = null;
            let toTs = null;

            if (from !== undefined) {
                fromTs = parseTimestampParam(from);
                if (fromTs === null) {
                    return reply.code(400).send({error: 'Invalid "from" parameter'});
                }
            }

            if (to !== undefined) {
                toTs = parseTimestampParam(to);
                if (toTs === null) {
                    return reply.code(400).send({error: 'Invalid "to" parameter'});
                }
            }

            if (fromTs !== null && toTs === null) {
                toTs = nowTs;
            }

            if (fromTs !== null && toTs !== null && fromTs > toTs) {
                return reply.code(400).send({error: '"from" cannot be greater than "to"'});
            }

            const conditions = [];
            const params = [];

            if (fromTs !== null) {
                conditions.push('ts >= ?');
                params.push(fromTs);
            }

            if (toTs !== null) {
                conditions.push('ts <= ?');
                params.push(toTs);
            }

            const whereClause =
                conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

            params.push(Number(limit));

            const sql = `
                SELECT ts, humidity, temperature, relay, created_at
                FROM (SELECT id, ts, humidity, temperature, relay, created_at
                      FROM readings ${whereClause}
                      ORDER BY ts DESC, id DESC LIMIT ?) AS sub
                ORDER BY ts ASC, id ASC
            `;

            const [rows] = await pool.query(sql, params);

            return rows.map((row) => ({
                ts: Number(row.ts),
                humidity: Number(row.humidity),
                temperature: Number(row.temperature),
                relay: Boolean(row.relay),
                created_at: row.created_at
            }));
        }
    );
}

