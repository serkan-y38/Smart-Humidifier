# Smart Humidifier - Frontend

Dashboard for the Smart Humidifier project. It shows the latest temperature
and humidity readings, lets you switch the humidifier between Auto / On / Off,
set the humidity threshold, and browse the reading history on a chart.
Built with Vite, React 19 and TypeScript. Charts use Recharts.

## Requirements

- Node.js 22+
- A running backend (see `../humidifier-backend`)

## Local setup

### 1. Create a `.env` file in `humidifier-frontend/`:

   ```env
   VITE_API_BASE_URL=http://localhost:3839
   VITE_API_KEY=api_key
   ```

   - `VITE_API_BASE_URL` is the address of the **backend** (not of this app).
   - `VITE_API_KEY` must match the backend's `API_KEY`.

### 2. Make sure the backend allows this app's origin. In the backend `.env`:

   ```env
   CORS_ORIGIN=http://localhost:3840
   ```

### 3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   The dev server runs on http://localhost:3840 (the port is fixed; if it is
   taken, Vite exits instead of switching ports).

## Docker

In Docker the app is built and served by nginx on port 3840. It is built and
run by the `docker-compose.yml` in the repository root.

Vite embeds `VITE_*` variables into the JavaScript bundle at **build time**,
so they are passed as build arguments (not runtime environment variables).
If you change the API address or the API key you must rebuild the image:

This folder's `.env` is only used for local development; the Docker build
ignores it (see `.dockerignore`).

## Security note

The API key is part of the built JavaScript, so anyone who can open the
dashboard can read it. This is fine for a home network. Do not expose the
dashboard to the internet without adding real authentication.