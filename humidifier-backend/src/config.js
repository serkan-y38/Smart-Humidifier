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

/**
 * // Do not forget to create .env file
 *
 * # API && Server Settings
 * PORT=8000
 * API_KEY=key
 * CORS_ORIGIN=http://localhost:5000
 *
 * # DB Settings
 * DB_HOST=localhost
 * DB_PORT=3306
 * DB_USER=root
 * DB_PASSWORD=password
 * DB_NAME=humidifier
 */

