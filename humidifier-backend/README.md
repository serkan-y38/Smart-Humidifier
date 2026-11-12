# Smart Humidifier - Backend

REST API for the Smart Humidifier project. An ESP32 posts temperature and
humidity readings; the dashboard reads them and changes the control mode.
Built with Node.js 22, Fastify 5 and MySQL 8.

## Requirements

- Node.js 22+
- MySQL 8

## Local setup

### 1. Create the database and a user:

   ```sql
   CREATE DATABASE IF NOT EXISTS humidifier;
   CREATE USER IF NOT EXISTS 'humidifier'@'localhost' IDENTIFIED BY 'password';
   GRANT ALL ON humidifier.* TO 'humidifier'@'localhost';
   ```

   Tables and the default control row are created automatically on startup.

### 2. Create a `.env` file in `humidifier-backend/`:

   ```env
   # API & server
   PORT=3839
   API_KEY=api_key
   CORS_ORIGIN=http://localhost:3840

   # Database
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=humidifier
   DB_PASSWORD=password
   DB_NAME=humidifier
   ```

   `CORS_ORIGIN` is the address the dashboard is opened from (comma-separated
   for multiple origins). `API_KEY` must match the key used by the ESP32 and
   the frontend.

### 3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

## API

Every endpoint expects the `X-API-Key` header.

| Method | Path | Description |
|---|---|---|
| POST | `/api/readings` | ESP32 sends `{humidity, temperature, relay}`; responds with the current `{mode, threshold}` |
| GET | `/api/latest` | Latest reading, its age in seconds and the control state |
| GET | `/api/readings` | History. Query: `from`, `to` (ISO 8601 or unix seconds), `interval` (bucket size in seconds, returns averages), `limit` (1-2000) |
| GET | `/api/control` | Current mode (`auto` / `on` / `off`) and humidity threshold |
| PUT | `/api/control` | Updates `{mode, threshold}` (both fields required) |

Readings older than 7 days are deleted automatically.

## Docker

This service is built and run by the `docker-compose.yml` in the repository
root. In Docker the values above come from the root `.env` file; this
folder's `.env` is only used for local development.