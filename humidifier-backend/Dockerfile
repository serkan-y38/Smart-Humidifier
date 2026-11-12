# --- Dependencies Stage ---
FROM node:22-alpine AS deps
WORKDIR /app

# Copy only package files first to leverage Docker layer caching
COPY package*.json ./

# Install production dependencies and clean npm cache
RUN npm ci --omit=dev && npm cache clean --force

# --- Production Stage ---
FROM node:22-alpine
WORKDIR /app

# Copy installed dependencies from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the application source
COPY package*.json ./
COPY src ./src

# Do not run as root
USER node

EXPOSE 3839

CMD ["node", "src/index.js"]