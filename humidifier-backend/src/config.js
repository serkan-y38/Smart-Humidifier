const CORS_ORIGIN = process.env.CORS_ORIGIN;

export const config = {
    port: Number(process.env.PORT),
    apiKey: process.env.API_KEY,
    allowedOrigins: CORS_ORIGIN.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    db: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT ?? 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    }
};
