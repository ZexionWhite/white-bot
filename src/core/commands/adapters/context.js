/**
 * Crea contextos normalizados desde interaction o message
 */

/**
 * Crea contexto desde una interaction
 * @param {Interaction} itx - Interaction de Discord
 * @returns {Promise<CommandContext>}
 */
export async function createCommandContextFromInteraction(itx) {
  const guild = itx.guild;
  const member = itx.member;
  const channel = itx.channel;
  
  return {
    guildId: guild?.id,
    userId: itx.user.id,
    channelId: channel?.id,
    args: {}, // Se llena desde las opciones de la interaction
    reply: async (options) => {
      if (itx.replied || itx.deferred) {
        return itx.editReply(options);
      }
      return itx.reply(options);
    },
    defer: async (options) => {
      return itx.deferReply(options);
    },
    raw: itx,
    member,
    guild,
    channel
  };
}

/**
 * Crea contexto desde un message
 * @param {Message} message - Mensaje de Discord
 * @param {Object} args - Argumentos ya validados
 * @returns {Promise<CommandContext>}
 */
export async function createCommandContextFromMessage(message, args) {
  const guild = message.guild;
  const member = message.member;
  const channel = message.channel;
  
  return {
    guildId: guild?.id,
    userId: message.author.id,
    channelId: channel?.id,
    args,
    reply: async (options) => {
      return message.reply(options);
    },
    defer: async (options) => {
      // Para messages, defer no hace nada (es inmediato)
      return Promise.resolve();
    },
    raw: message,
    member,
    guild,
    channel
  };
}
