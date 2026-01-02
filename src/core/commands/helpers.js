/**
 * Helpers para convertir comandos existentes al command kernel
 */

/**
 * Crea un schema básico para comandos sin argumentos
 */
export function createEmptyArgsSchema() {
  const { z } = require("zod");
  return z.object({}).transform(() => ({}));
}

/**
 * Crea un schema para comandos que solo requieren un usuario
 */
export function createUserArgsSchema() {
  const { z } = require("zod");
  return z.object({
    rawArgs: z.array(z.string())
  }).transform((data) => {
    if (!data.rawArgs || data.rawArgs.length === 0) {
      return { userId: null };
    }
    // Parsear mention o ID
    const input = data.rawArgs[0];
    const mentionMatch = input.match(/^<@!?(\d+)>$/);
    if (mentionMatch) {
      return { userId: mentionMatch[1] };
    }
    if (/^\d+$/.test(input)) {
      return { userId: input };
    }
    throw new Error("Debes mencionar a un usuario o proporcionar su ID");
  });
}
