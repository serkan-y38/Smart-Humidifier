# --- Build Stage ---
FROM node:22-alpine AS builder
WORKDIR /app

# Copy only package files first to leverage Docker layer caching
COPY package*.json ./
RUN npm ci

# Vite bakes VITE_* variables into the bundle at build time
ARG VITE_API_BASE_URL
ARG VITE_API_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_KEY=$VITE_API_KEY

# Copy the source code and compile the project
COPY . .
RUN npm run build

# --- Production Stage ---
# Use a lightweight Nginx image to serve the compiled static files
FROM nginx:alpine

# Custom nginx config (port 3840, SPA fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build artifacts from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3840

# Run nginx in the foreground so the container does not exit
CMD ["nginx", "-g", "daemon off;"]