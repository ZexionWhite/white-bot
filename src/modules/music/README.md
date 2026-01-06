# Módulo de Música

Módulo de música para el bot usando Lavalink v4.

## Requisitos

- Lavalink v4.1.x corriendo y accesible
- Plugins de Lavalink:
  - `youtube-plugin-1.16.0.jar` o superior
  - `lavasrc-plugin-4.8.1.jar` o superior (para soporte de Spotify)

## Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
# Configuración de Lavalink
LAVALINK_HOST=lavalink          # Hostname o IP del servidor Lavalink (ej: "lavalink" para Docker, "localhost" para local)
LAVALINK_PORT=2333              # Puerto de Lavalink (por defecto 2333)
LAVALINK_PASSWORD=capybaras     # Contraseña configurada en application.yml de Lavalink
LAVALINK_SECURE=false           # true si usas HTTPS/WSS, false para HTTP/WS
```

### Ejemplo para Dokploy

Si tu bot corre en Dokploy y Lavalink está en otro servicio:

```env
LAVALINK_HOST=lavalink          # Nombre del servicio Docker
LAVALINK_PORT=2333
LAVALINK_PASSWORD=tu_contraseña_segura
LAVALINK_SECURE=false
```

### Ejemplo para VPS

Si ambos están en el mismo VPS:

```env
LAVALINK_HOST=localhost
LAVALINK_PORT=2333
LAVALINK_PASSWORD=tu_contraseña_segura
LAVALINK_SECURE=false
```

## Permisos del Bot

El bot necesita los siguientes permisos de Discord:

- **Conectarse a canales de voz**: `Connect`
- **Hablar en canales de voz**: `Speak`
- **Usar comandos slash**: `Use Application Commands`

## Comandos Disponibles

### Comandos Públicos (cualquiera puede usar)

- `/play <query|url>` - Reproduce música desde una URL o búsqueda
- `/queue [page]` - Muestra la cola de reproducción
- `/nowplaying` - Muestra la canción que se está reproduciendo

### Comandos de Control (requieren rol DJ o Admin)

- `/skip [amount]` - Salta la canción actual o múltiples canciones
- `/stop` - Detiene la reproducción y limpia la cola
- `/pause` - Pausa la reproducción
- `/resume` - Reanuda la reproducción
- `/clear` - Limpia la cola de reproducción
- `/loop <off|track|queue>` - Configura el modo de loop
- `/shuffle` - Mezcla la cola de reproducción
- `/autoplay <on|off>` - Activa o desactiva el autoplay

### Comandos DJ (requieren Manage Server)

- `/dj setrole @rol` - Configura el rol DJ
- `/dj clearrole` - Elimina el rol DJ
- `/dj view` - Muestra el rol DJ actual

## Características

### Autoplay

Cuando el autoplay está activado y la cola se vacía, el bot automáticamente:
1. Toma el último track reproducido como "seed"
2. Busca canciones similares usando `ytmsearch`
3. Añade 1-3 tracks similares a la cola
4. Evita duplicados usando un historial de los últimos 50 tracks

### Loop

- **off**: No repite (por defecto)
- **track**: Repite la canción actual indefinidamente
- **queue**: Repite toda la cola (cuando se implemente completamente)

### Fuentes Soportadas

- **YouTube**: URLs directas y búsquedas (`ytsearch`, `ytmsearch`)
- **Spotify**: URLs de tracks, álbumes, playlists (mediante mirroring a YouTube)
- **Otras fuentes**: SoundCloud, Bandcamp, Twitch, Vimeo, HTTP (según configuración de Lavalink)

## Arquitectura

```
src/modules/music/
├── commands/          # Handlers de comandos slash
├── services/          # Lógica de negocio
│   ├── lavalink.service.js    # Conexión a Lavalink
│   ├── player.service.js       # Gestión de players
│   ├── queue.service.js        # Gestión de colas
│   ├── search.service.js       # Resolución de queries
│   ├── autoplay.service.js     # Lógica de autoplay
│   └── permissions.service.js  # Permisos DJ
├── events/
│   └── trackEnd.js    # Manejo de fin de track
├── ui/
│   ├── embeds.js      # Embeds de Discord
│   └── components.js  # Componentes opcionales (botones)
├── router.js          # Router de comandos
└── slash.js           # Definiciones de comandos
```

## Notas

- El bot se desconecta automáticamente después de 5 minutos de inactividad
- Los settings (loop, autoplay, rol DJ) se guardan en memoria (se pierden al reiniciar)
- Para persistencia, considera integrar con Redis o base de datos
