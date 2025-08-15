# ---------- Stage 1: deps (compila nativos como sharp/better-sqlite3) ----------
FROM node:22-bookworm-slim AS deps
WORKDIR /app

# Herramientas de build para módulos nativos
RUN apt-get update && apt-get install -y \
    python3 build-essential ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Cache de deps
COPY package*.json ./
RUN npm ci --omit=dev

# ---------- Stage 2: runtime (limpio y liviano) ----------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

# Runtime tools (opcional ffmpeg/sqlite3 si los usás)
RUN apt-get update && apt-get install -y \
    ffmpeg sqlite3 ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*

# (Opcional) yt-dlp si algún día reproducís contenido externo
# RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
#     -o /usr/local/bin/yt-dlp && chmod +x /usr/local/bin/yt-dlp

# Copiá node_modules ya compilados
COPY --from=deps /app/node_modules ./node_modules

# Copiá tu código
COPY . .

# Carpeta para la DB y archivos persistentes
RUN mkdir -p /app/data

# Variables de entorno
ENV NODE_ENV=production \
    TZ=America/Argentina/Cordoba

# Seguridad: correr como usuario no root
RUN useradd -m -u 10001 appuser && chown -R appuser:appuser /app
USER appuser

# Declarar volumen para persistir la DB fuera de la imagen
VOLUME ["/app/data"]

# Healthcheck simple (opcional)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('https://discord.com/api/v10/gateway').then(()=>process.exit(0)).catch(()=>process.exit(1))"

# Arranque
CMD ["npm","start"]
