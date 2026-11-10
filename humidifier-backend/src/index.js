import {buildApp} from './app.js';
import {config} from './config.js';
import {initDatabase, pool} from './db.js';

async function start() {
    const fastify = await buildApp();

    try {
        await initDatabase();
        await fastify.listen({port: config.port, host: '0.0.0.0'});

        for (const signal of ['SIGINT', 'SIGTERM']) {
            process.on(signal, async () => {
                await fastify.close();
                pool.end();
                process.exit(0);
            });
        }

    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start().catch((err) => {
    console.error(err);
    process.exit(1);
});
