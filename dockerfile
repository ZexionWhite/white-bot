# --- Base compatible (glibc) para librerías nativas / sqlite ---
FROM node:22-bookworm-slim

# Paquetes del sistema que vas a necesitar:
# - ffmpeg: audio para @discordjs/voice
# - sqlite3: CLI (útil para debug) y runtime
# - python3 + build-essential: por si algún paquete compila nativo (p. ej. sqlite3, sharp, bcrypt)
# - ca-certificates: TLS
RUN apt-get update && apt-get install -y \
    ffmpeg sqlite3 ca-certificates python3 build-essential curl \
  && rm -rf /var/lib/apt/lists/*

# (Opcional pero útil) yt-dlp para fuentes tipo YouTube
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
      -o /usr/local/bin/yt-dlp && chmod +x /usr/local/bin/yt-dlp

WORKDIR /app

# Cache de deps: primero package.json / lock
COPY package*.json ./
RUN npm ci --omit=dev

# Copiá tu código
COPY . .

# Carpeta para la DB/archivos que tienen que persistir fuera de la imagen
RUN mkdir -p /app/data

# VARIABLES de entorno de prod
ENV NODE_ENV=production \
    TZ=America/Argentina/Buenos_Aires \
    # Tu SQLite vivirá en /app/data dentro del contenedor
    DATABASE_URL=file:/app/data/bot.db

# (Opcional) si usás Prisma, descomentá:
# RUN npx prisma generate

# Arranque del bot
CMD ["npm","start"]
