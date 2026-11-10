import Fastify from 'fastify';
import cors from '@fastify/cors';
import pino from 'pino';
import {config} from './config.js';
import {readingsRoutes} from './routes/readings.js';
import {controlRoutes} from './routes/control.js';

export async function buildApp() {
    const fastify = Fastify({
        logger: {
            timestamp: pino.stdTimeFunctions.isoTime
        }
    });

    await fastify.register(cors, {
        methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'X-API-Key'],
        origin: (origin, cb) => {
            if (!origin) {
                return cb(null, true);
            }
            if (config.allowedOrigins.includes(origin)) {
                return cb(null, true);
            }
            const err = new Error('CORS origin not allowed');
            err.statusCode = 403;
            return cb(err, false);
        }
    });

    await fastify.register(readingsRoutes);
    await fastify.register(controlRoutes);

    return fastify;
}

