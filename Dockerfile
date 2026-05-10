# syntax=docker/dockerfile:1.6
#
# AI Act Compass — production image
#
# Multi-stage build:
#   1. `build`  — installs deps + runs `vite build` to produce `dist/`
#   2. runtime  — nginx:alpine serves the static dist/ behind a SPA-aware config
#
# Resulting image: ~25–35 MB.

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — build
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install deps with a clean lockfile (faster, deterministic)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy sources and build
COPY index.html vite.config.js ai-act-compass.jsx ./
COPY src ./src
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — runtime
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Drop the stock landing page
RUN rm -rf /usr/share/nginx/html/*

# SPA-aware nginx config (try_files fallback to index.html, gzip, cache)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=build /app/dist /usr/share/nginx/html

# Health-check endpoint baked into the static root (zero-cost)
RUN echo 'ok' > /usr/share/nginx/html/health

EXPOSE 80

# Use nginx's foreground mode so Docker can supervise the process
CMD ["nginx", "-g", "daemon off;"]
