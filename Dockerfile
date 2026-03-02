# ─────────────────────────────────────────────
# Stage 1 — Build (Node 20 Alpine)
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (layer cache)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source
COPY . .

# Build-time env vars (VITE_ vars are baked in at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_POLLINATIONS_API_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_POLLINATIONS_API_KEY=$VITE_POLLINATIONS_API_KEY

RUN npm run build

# ─────────────────────────────────────────────
# Stage 2 — Serve (Nginx Alpine)
# ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Copy built SPA assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Inject SPA-aware Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
