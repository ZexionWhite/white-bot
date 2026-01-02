# Arquitectura del Bot - Capybot

Este documento describe la arquitectura general del proyecto, sus componentes principales y los patrones de diseño utilizados.

## Visión General

Capybot es un bot de Discord construido con Node.js (ESM), discord.js v14, y SQLite (con migración planificada a PostgreSQL). El bot está diseñado con una arquitectura modular que facilita la escalabilidad y el mantenimiento.

## Estructura de Directorios

```
src/
├── core/                    # Infraestructura central (no depende de módulos específicos)
│   ├── commands/            # Command Kernel (soporte para slash y prefix commands)
│   ├── config/              # Configuración y validación de variables de entorno
│   ├── constants/           # Constantes compartidas
│   ├── db/                  # Abstracción de base de datos (SQLite actual, preparado para PostgreSQL)
│   ├── discord/             # Utilidades de Discord (registro de eventos)
│   ├── errors/              # Clases de error y helpers
│   └── logger/              # Sistema de logging unificado
│
├── modules/                 # Módulos de funcionalidad (features)
│   ├── autoroles/           # Sistema de roles de colores
│   ├── blacklist/           # Sistema de blacklist
│   ├── info/                # Información de usuarios
│   ├── moderation/          # Sistema completo de moderación
│   ├── permissions/         # Sistema de permisos avanzado
│   ├── settings/            # Configuración del servidor
│   ├── utilities/           # Comandos de utilidad
│   └── registry.js          # Registro centralizado de comandos/componentes
│
├── events/                  # Event handlers de Discord
│   ├── guildMemberAdd.js
│   ├── guildMemberUpdate.js
│   ├── interactionCreate.js
│   ├── messageCreate.js
│   ├── messageDelete.js
│   ├── messageUpdate.js
│   ├── ready.js
│   ├── userUpdate.js
│   └── voiceStateUpdate.js
│
├── commands/                # Scripts de utilidad (legacy)
│   ├── cleanupCommands.js
│   └── registerCommands.js
│
├── utils/                   # Utilidades genéricas compartidas
├── config.js                # Configuración de bot (timezone, GIFs)
└── db.js                    # Módulo legacy de DB (usa src/core/db/ internamente)
```

## Componentes Principales

### 1. Command Kernel (`src/core/commands/`)

Sistema unificado para manejar comandos slash y prefix commands.

- **`commandRegistry.js`**: Registro centralizado de comandos con soporte para aliases
- **`adapters/context.js`**: Normalización de contexto (Interaction → CommandContext, Message → CommandContext)
- **`adapters/slashAdapter.js`**: Adaptador para slash commands (preparado para integración completa)
- **`adapters/prefixAdapter.js`**: Adaptador para prefix commands con parsing de argumentos
- **`command.types.js`**: Definiciones de tipos (JSDoc) para CommandContext y CommandDefinition

**Patrón**: Cada comando define:
- `name`: Nombre del comando
- `aliases`: Array de alias (opcional)
- `description`: Descripción
- `argsSchema`: Schema Zod para validación
- `execute(ctx)`: Función de ejecución que recibe CommandContext

### 2. Sistema de Base de Datos (`src/core/db/`)

Abstracción que permite cambiar de SQLite a PostgreSQL sin modificar el código de los módulos.

- **`interface.js`**: Interfaz genérica `DatabaseDriver` y `PreparedStatement`
- **`sqlite-adapter.js`**: Implementación para SQLite (better-sqlite3)
- **`postgres-adapter.js`**: Placeholder para PostgreSQL (FASE 2)
- **`index.js`**: Punto de entrada que exporta helpers y el driver actual

**Uso actual**: `src/db.js` usa internamente `src/core/db/` pero mantiene la API legacy para compatibilidad.

**Migración futura**: En FASE 2, se cambiará el driver en `src/core/db/index.js` y se actualizarán los repositorios para usar queries PostgreSQL.

### 3. Sistema de Logging (`src/core/logger/`)

Logger unificado con niveles: ERROR, WARN, INFO, DEBUG.

- Todos los eventos y módulos usan `log.error()`, `log.warn()`, `log.info()`, `log.debug()`
- Reemplaza `console.log/error/warn` en todo el código
- Preparado para extensión (logs externos, archivos, etc.)

### 4. Sistema de Errores (`src/core/errors/`)

Clases de error jerárquicas para manejo consistente:

- **`BotError`**: Error base
- **`ConfigError`**: Errores de configuración
- **`ValidationError`**: Errores de validación
- **`database.error.js`**: Errores de base de datos (DatabaseConnectionError, DatabaseQueryError, etc.)
- **`discord.error.js`**: Errores de Discord API (DiscordPermissionError, DiscordRateLimitError, etc.)
- **`handlers.js`**: Helpers para manejo de errores (`handleError`, `handleErrorAndThrow`, `normalizeError`)

### 5. Módulos (`src/modules/`)

Cada módulo sigue una estructura consistente:

```
module-name/
├── commands/          # Handlers de comandos (slash y prefix)
├── db/                # Repositorios de base de datos (solo queries)
├── services/          # Lógica de negocio
├── ui/                # Embeds, componentes Discord (buttons, select menus)
├── modals/            # Handlers de modals (si aplica)
├── router.js          # Routing de comandos y componentes
├── slash.js           # Definiciones de slash commands
└── index.js           # Exports públicos del módulo
```

**Principios**:
- Separación de responsabilidades: DB → Services → Commands/Handlers
- Cada módulo es independiente (puede usar otros módulos pero sin dependencias circulares)
- Router centraliza el routing de interacciones

### 6. Registry (`src/modules/registry.js`)

Registro centralizado que exporta:
- `allSlashCommands`: Array de todos los slash commands para registro
- `commandHandlers`: Mapeo de nombre de comando → handler
- `componentHandlers`: Mapeo de customId → handler (buttons, select menus)
- `modalHandlers`: Mapeo de customId → handler (modals)
- `autocompleteHandlers`: Mapeo de nombre de comando → handler (autocomplete)

**Ventajas**:
- `interactionCreate.js` es minimalista (solo lookup en registry)
- Fácil agregar nuevos comandos sin tocar `interactionCreate.js`
- Un solo lugar donde se registran todos los comandos

## Flujos Principales

### 1. Flujo de Comando Slash

```
Usuario ejecuta /comando
  → Discord envía Interaction
  → interactionCreate.js
  → Busca handler en registry.commandHandlers[commandName]
  → Handler ejecuta lógica (puede usar Services)
  → Response enviada
```

### 2. Flujo de Comando Prefix

```
Usuario escribe "prefix!comando args"
  → messageCreate.js
  → prefixAdapter.handlePrefixCommand()
  → Busca comando en commandRegistry (por nombre o alias)
  → Valida args con Zod schema
  → Ejecuta command.execute(ctx)
  → Response enviada
```

### 3. Flujo de Moderación

```
Moderador ejecuta /warn @usuario
  → Handler muestra modal para razón
  → Usuario completa modal
  → Modal handler llama ModerationService.warn()
  → Service crea caso en DB (CasesService.createCase)
  → Service envía DM al usuario (DmService)
  → Service envía embed a modlog (ModlogService)
  → Response de confirmación
```

### 4. Flujo de Logging de Eventos

```
Evento Discord ocurre (ej: messageDelete)
  → Event handler (messageDelete.js)
  → Obtiene configuración de guild (getSettings)
  → Construye embed con información
  → Envía embed a canal de logs configurado
  → Usa logger para errores (log.error)
```

## Patrones de Diseño

### 1. Repository Pattern

Cada módulo tiene repositorios en `db/` que encapsulan queries SQL:
- `cases.repo.js`: Queries relacionadas con casos de moderación
- `blacklist.repo.js`: Queries relacionadas con blacklist
- `settings.repo.js`: Queries relacionadas con configuración

**Ventajas**:
- Separación entre lógica de negocio y acceso a datos
- Fácil cambiar queries sin tocar services
- Preparado para migración de DB

### 2. Service Layer

Services contienen la lógica de negocio:
- `moderation.service.js`: Lógica de sanciones (warn, ban, kick, etc.)
- `blacklist.service.js`: Lógica de blacklist
- `cases.service.js`: Lógica de casos

**Responsabilidades**:
- Validaciones de negocio
- Orquestación de múltiples repositorios
- Integración con Discord API (roles, bans, etc.)

### 3. Command Kernel Pattern

Unificación de comandos slash y prefix:
- Misma definición de comando para ambos tipos
- Contexto normalizado (`CommandContext`)
- Validación de argumentos con Zod

### 4. Registry Pattern

Centralización de routing:
- Un solo lugar donde se registran handlers
- Lookup rápido por nombre/customId
- Facilita testing y debugging

## Base de Datos

### Esquema Actual (SQLite)

Tablas principales:
- `guild_settings`: Configuración por servidor
- `mod_cases`: Casos de moderación
- `blacklist`: Entradas de blacklist
- `mod_policy`: Políticas de permisos
- `user_stats`: Estadísticas de usuarios
- `voice_sessions`: Sesiones de voz activas
- `voice_activity`: Historial de actividad de voz
- `message_log`: Log de mensajes (para histórico)
- `color_roles`: Roles de colores
- `cooldowns`: Cooldowns de eventos
- `pending_actions`: Acciones pendientes (para modals)

### Migración Futura (PostgreSQL - FASE 2)

- Conversión de tipos: TEXT → VARCHAR/TEXT, INTEGER → BIGINT/SERIAL
- AUTOINCREMENT → SERIAL/BIGSERIAL
- Índices para optimización
- Transacciones para operaciones complejas

## Estado y Escalabilidad

### Actual (SQLite)
- Base de datos embebida (un archivo)
- Preparado para múltiples servidores (guild_id como clave)
- Sin pooling (better-sqlite3 es síncrono)

### Futuro (PostgreSQL + Redis - FASE 2-3)
- PostgreSQL para persistencia
- Redis para cache y estado temporal
- Pool de conexiones
- Escalabilidad horizontal (múltiples instancias del bot)

## Roadmap de Mejoras

### FASE 1 (En progreso)
- ✅ Abstracción de base de datos
- ✅ Logging unificado
- 🔄 Estandarización de errores
- ⏳ Optimización de queries
- ⏳ Documentación

### FASE 2 (Planificada)
- Migración a PostgreSQL
- Scripts de migración de datos
- Actualización de repositorios

### FASE 3 (Planificada)
- Integración con Redis
- Cache de configuraciones
- Cache de datos frecuentes
- Rate limiting mejorado

### FASE 4 (Planificada)
- Sistema de webhooks para logging
- Queue system para mensajes
- Eliminación de rate limits de Discord

### FASE 5 (Planificada)
- Módulo musical
- Integración con servicios de música (YouTube, etc.)
- Sistema de colas de reproducción

## Convenciones

### Naming
- Archivos: `kebab-case.js`
- Funciones: `camelCase`
- Clases: `PascalCase`
- Constantes: `UPPER_SNAKE_CASE`

### Imports
- Imports absolutos desde `src/` usando rutas relativas
- Agrupar imports: node_modules, core/, modules/, locales

### Errores
- Usar clases de error específicas (`BotError`, `ValidationError`, etc.)
- Logging de errores con contexto claro
- No exponer detalles internos al usuario final

### Logging
- Usar `log.error()` para errores
- Usar `log.warn()` para advertencias
- Usar `log.info()` para información importante
- Usar `log.debug()` para información de depuración
- Incluir contexto en el prefijo (módulo/función)

## Testing (Futuro)

Estrategia recomendada:
- Unit tests para services y utilidades
- Integration tests para comandos completos
- Mock de Discord API y base de datos
- Tests de migración de datos

## Contribución

Al agregar nuevas funcionalidades:
1. Crear módulo en `src/modules/` siguiendo la estructura estándar
2. Registrar comandos en `src/modules/registry.js`
3. Usar el logger unificado (`src/core/logger/`)
4. Usar clases de error apropiadas (`src/core/errors/`)
5. Documentar cambios en este archivo si afectan arquitectura
