# Módulo de Música

Módulo de música para el bot usando Lavalink v4.

## Requisitos

- Lavalink v4.1.x corriendo y accesible
- Plugins de Lavalink:
  - `youtube-plugin-1.16.0.jar` o superior
  - `lavasrc-plugin-4.8.1.jar` o superior (para soporte de Spotify)

## Variables de Entorno

Agrega estas variables a tu archivo `.env` o en la configuración de tu plataforma:

```env
# Configuración de Lavalink
LAVALINK_HOST=lavalink          # Hostname o IP del servidor Lavalink
LAVALINK_PORT=2333              # Puerto de Lavalink (por defecto 2333)
LAVALINK_PASSWORD=capybaras     # Contraseña configurada en application.yml de Lavalink
LAVALINK_SECURE=false           # true si usas HTTPS/WSS, false para HTTP/WS (por defecto false)
```

### Ejemplo para Dokploy - Servicios Separados

Si tu bot corre en Dokploy y Lavalink está en un servicio separado (mismo environment pero diferente docker-compose):

**Opción 1: Usar el nombre del servicio (recomendado si están en la misma red)**
```env
LAVALINK_HOST=discord-bots-capylavalink-dsrhbj  # Nombre exacto del servicio en Dokploy
LAVALINK_PORT=2333
LAVALINK_PASSWORD=tu_contraseña_segura
LAVALINK_SECURE=false
```

**Opción 2: Si no se resuelve el hostname, usar IP pública o hostname completo**
```env
LAVALINK_HOST=lavalink.tu-dominio.com  # O la IP pública del servicio
LAVALINK_PORT=2333
LAVALINK_PASSWORD=tu_contraseña_segura
LAVALINK_SECURE=false
```

**Importante para Dokploy:**
- Si los servicios están en el mismo environment, deberían poder comunicarse por hostname
- Si el hostname no se resuelve, verifica:
  - Que ambos servicios estén en la misma red de Docker
  - El nombre exacto del servicio (puede verse en los logs o configuración de Dokploy)
  - Considera usar una IP/host público si la red interna no funciona

### Ejemplo para VPS

Si ambos están en el mismo VPS o en la misma red local:

```env
LAVALINK_HOST=localhost         # O la IP local (ej: 192.168.1.100)
LAVALINK_PORT=2333
LAVALINK_PASSWORD=tu_contraseña_segura
LAVALINK_SECURE=false
```

### Diagnóstico de Conexión

El bot realiza un diagnóstico automático al iniciar:
- Verifica conectividad HTTP a Lavalink antes de conectar el WebSocket
- Si falla, el bot continúa funcionando sin música (NO crashea)
- Revisa los logs para ver el resultado del diagnóstico

**Errores comunes:**
- `DNS_FAILED`: El hostname no se resuelve. Verifica `LAVALINK_HOST` o configura red compartida
- `AUTH_FAILED`: La contraseña es incorrecta. Verifica `LAVALINK_PASSWORD`
- `CONNECTION_REFUSED`: Lavalink no está corriendo o el puerto está bloqueado

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

## Manejo de Errores y Reconexión

- **El bot NUNCA crashea por errores de Lavalink**: Si Lavalink está caído, el bot continúa funcionando sin funcionalidad de música
- **Reconexión automática**: El bot intenta reconectar automáticamente con backoff exponencial
- **Diagnóstico previo**: Al iniciar, verifica conectividad HTTP antes de conectar WebSocket
- **Mensajes claros**: Los comandos de música muestran errores descriptivos si Lavalink no está disponible
- **Logs detallados**: Todos los eventos de conexión/desconexión/error se loggean para debugging

## Notas

- El bot se desconecta automáticamente después de 5 minutos de inactividad
- Los settings (loop, autoplay, rol DJ) se guardan en memoria (se pierden al reiniciar)
- Para persistencia, considera integrar con Redis o base de datos
- Si Lavalink no está disponible, el bot sigue funcionando normalmente sin música
