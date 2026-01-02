/**
 * Tipos y definiciones para el Command Kernel
 */

/**
 * @typedef {Object} CommandContext
 * @property {string} guildId - ID del servidor
 * @property {string} userId - ID del usuario que ejecutó el comando
 * @property {string} channelId - ID del canal
 * @property {Object} args - Argumentos validados del comando
 * @property {Function} reply - Función para responder (message o interaction)
 * @property {Function} defer - Función para defer (message o interaction)
 * @property {Object} raw - Objeto raw (Message o Interaction)
 * @property {Object} member - GuildMember del usuario
 * @property {Object} guild - Guild
 * @property {Object} channel - Channel
 */

/**
 * @typedef {Object} CommandDefinition
 * @property {string} name - Nombre del comando
 * @property {string} description - Descripción del comando
 * @property {string[]} aliases - Aliases del comando (ej: ["b"] para "ban")
 * @property {Object} permissions - Permisos requeridos (discord.js PermissionFlagsBits)
 * @property {z.ZodSchema} argsSchema - Schema de validación de argumentos (zod)
 * @property {Function} execute - Función ejecutora: (ctx: CommandContext) => Promise<void>
 */
