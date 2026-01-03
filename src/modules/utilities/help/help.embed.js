import { EmbedBuilder } from "discord.js";
import { EMOJIS } from "../../../config/emojis.js";

export function getIntroEmbed(client) {
  return new EmbedBuilder()
    .setTitle("Capybot – Centro de Ayuda")
    .setDescription(
      "**Capybot** es un bot de moderación completo diseñado para gestionar tu servidor de Discord de manera eficiente.\n\n" +
      "**Funcionalidades principales:**\n" +
      "• Sistema completo de moderación y sanciones\n" +
      "• Logs automáticos mediante webhooks (sin rate limits)\n" +
      "• Herramientas de gestión de usuarios y canales\n" +
      "• Sistema de blacklist y casos\n" +
      "• Moderación avanzada de canales de voz\n" +
      "• Comandos slash (`/comando`) y prefix (`capy!comando`)\n\n"
    )
    .setThumbnail(client.user.displayAvatarURL())
    .setColor(0x393a41)
    .setFooter({ text: "Selecciona una categoría del menú para ver los comandos disponibles" })
    .setTimestamp();
}

export function getConfigEmbed() {
  return new EmbedBuilder()
    .setTitle(`${EMOJIS.UTILS.CONFIG} Configuración del Servidor`)
    .setDescription("Comandos para configurar los diferentes aspectos del bot en tu servidor.")
    .setColor(0x393a41)
    .addFields(
      {
        name: "Canal de Bienvenida",
        value: "`/set welcome [canal] [cooldown]`\nConfigura el canal donde el bot enviará los mensajes de bienvenida. El cooldown evita spam cuando entran muchos usuarios juntos (por defecto: 60 segundos).",
        inline: false
      },
      {
        name: "Logs del Servidor",
        value: [
          "`/set join-log [canal]` – Registra entradas y salidas de miembros",
          "`/set message-log [canal]` – Logs de mensajes eliminados o editados",
          "`/set avatar-log [canal]` – Registra cambios de avatar",
          "`/set nickname-log [canal]` – Registra cambios de apodo",
          "`/set voice-log [canal]` – Registra actividad en canales de voz"
        ].join("\n"),
        inline: false
      },
      {
        name: "Boosters y Anuncios",
        value: [
          "`/set boost-channel [canal]` – Canal para anunciar boosts",
          "`/set info-channel [canal]` – Canal de información y perks",
          "`/set booster-role [rol]` – Define el rol de boosters"
        ].join("\n"),
        inline: false
      },
      {
        name: "Moderación",
        value: [
          "`/setmodlog [canal]` – Canal para registrar sanciones",
          "`/setblacklistchannel [canal]` – Canal para blacklist",
          "`/createmuterole` – Crea automáticamente el rol Muted",
          "`/setmuterole [rol]` – Selecciona un rol existente para mute"
        ].join("\n"),
        inline: false
      }
    )
    .setFooter({ text: "Todos estos comandos requieren el permiso 'Gestionar Servidor'" })
    .setTimestamp();
}

export function getModerationEmbed() {
  return new EmbedBuilder()
    .setTitle(`${EMOJIS.UTILS.REPORT} Sanciones y Moderación`)
    .setDescription("Comandos para sancionar y moderar usuarios en el servidor.")
    .setColor(0x393a41)
    .addFields(
      {
        name: "Advertencias y Silencios",
        value: [
          "`/warn [usuario]` – Envía una advertencia formal (se solicitará la razón mediante modal)",
          "`/mute [usuario] [duración]` – Silencia con rol de mute (se solicitará la razón mediante modal)",
          "`/unmute [usuario]` – Remueve el silencio (se solicitará la razón mediante modal)"
        ].join("\n"),
        inline: false
      },
      {
        name: "Timeouts",
        value: [
          "`/timeout [usuario] [duración]` – Aplica timeout nativo de Discord (se solicitará la razón mediante modal)",
          "`/untimeout [usuario]` – Remueve un timeout activo (se solicitará la razón mediante modal)"
        ].join("\n"),
        inline: false
      },
      {
        name: "Expulsiones y Baneos",
        value: [
          "`/kick [usuario]` – Expulsa sin banear (se solicitará la razón mediante modal)",
          "`/ban [usuario] [días]` – Banea permanentemente (se solicitará la razón mediante modal)",
          "`/tempban [usuario] [duración]` – Banea temporalmente (se solicitará la razón mediante modal)",
          "`/softban [usuario] [días]` – Ban + unban para limpiar mensajes (se solicitará la razón mediante modal)",
          "`/unban [usuario]` – Elimina un ban activo (se solicitará la razón mediante modal)"
        ].join("\n"),
        inline: false
      }
    )
    .setFooter({ text: "Requieren permisos de moderación según la acción" })
    .setTimestamp();
}

export function getCasesEmbed() {
  return new EmbedBuilder()
    .setTitle(`${EMOJIS.UTILS.UTILITIES} Casos y Herramientas`)
    .setDescription("Herramientas para gestionar casos de moderación y canales.")
    .setColor(0x393a41)
    .addFields(
      {
        name: "Gestión de Casos",
        value: [
          "`/history [usuario] [tipo] [límite]` – Historial completo de sanciones",
          "`/case [id]` – Detalle de un case específico",
          "`/editcase [id]` – Edita el motivo de un case (se solicitará la nueva razón mediante modal)",
          "`/remove [id] [razón]` – Elimina o revierte una sanción"
        ].join("\n"),
        inline: false
      },
      {
        name: "Gestión de Canales",
        value: [
          "`/clear [cantidad] [usuario]` – Elimina mensajes recientes",
          "`/lock [canal] [razón]` – Bloquea un canal",
          "`/unlock [canal] [razón]` – Desbloquea un canal",
          "`/slowmode [segundos] [canal]` – Configura modo lento"
        ].join("\n"),
        inline: false
      }
    )
    .setFooter({ text: "Requieren permisos de moderación" })
    .setTimestamp();
}

export function getBlacklistEmbed() {
  return new EmbedBuilder()
    .setTitle(`${EMOJIS.UTILS.QUARANTINE} Sistema de Blacklist`)
    .setDescription("Gestiona la blacklist del servidor para registrar usuarios problemáticos.")
    .setColor(0x393a41)
    .addFields(
      {
        name: "Gestión de Blacklist",
        value: [
          "`/blacklist add [usuario] [severidad]` – Agrega un usuario con registro persistente (se solicitará razón y evidencia mediante modal)",
          "`/blacklist history [usuario]` – Muestra el historial completo",
          "`/blacklist edit [caseid] [nueva_severidad]` – Edita una entrada (se solicitará nueva razón y evidencia mediante modal)",
          "`/blacklist remove [caseid] [razón]` – Elimina una entrada dejando registro"
        ].join("\n"),
        inline: false
      },
      {
        name: "Severidades",
        value: "**LOW** – Baja | **MEDIUM** – Media | **HIGH** – Alta | **CRITICAL** – Crítica",
        inline: false
      }
    )
    .setFooter({ text: "Requiere permisos de moderación" })
    .setTimestamp();
}

export function getInfoEmbed() {
  return new EmbedBuilder()
    .setTitle(`${EMOJIS.UTILS.SEARCH} Información de Usuarios`)
    .setDescription("Comandos para obtener información detallada sobre usuarios del servidor.")
    .setColor(0x393a41)
    .addFields(
      {
        name: "Advanced Information",
        value: "`/user [user]`\nShows complete user information:\n• Overview with roles and permissions\n• Sanctions history\n• Recent voice activity\n• Recent messages\n• Permissions and overrides\n• Trust score (0-100)\n• Statistics (voice time, messages)",
        inline: false
      }
    )
    .setFooter({ text: "Requiere permisos de moderación" })
    .setTimestamp();
}

export function getVoiceEmbed() {
  return new EmbedBuilder()
    .setTitle(`${EMOJIS.UTILS.VOICE} Moderación de Voz`)
    .setDescription("Herramientas especializadas para moderar canales de voz.")
    .setColor(0x393a41)
    .addFields(
      {
        name: "Moderación por Canal",
        value: "`/voice-mod channel [canal]`\nMuestra un panel interactivo con todos los usuarios en el canal:\n• Ver estado de mute/deafen\n• Mutear/desmutear usuarios\n• Mover usuarios entre canales\n• Acciones masivas",
        inline: false
      },
      {
        name: "Moderación por Usuario",
        value: "`/voice-mod user [usuario]`\nPanel interactivo para un usuario específico:\n• Ver su estado actual\n• Mutear/desmutear\n• Mover a tu canal\n• Todas las acciones disponibles",
        inline: false
      }
    )
    .setFooter({ text: "Requiere permisos MuteMembers o MoveMembers" })
    .setTimestamp();
}

export function getUtilitiesEmbed() {
  return new EmbedBuilder()
    .setTitle(`${EMOJIS.UTILS.LIST} Utilidades y Otros`)
    .setDescription("Comandos útiles y herramientas adicionales.")
    .setColor(0x393a41)
    .addFields(
      {
        name: "Previsualización",
        value: [
          "`/preview boost [usuario]` – Previsualiza el mensaje de boost",
          "`/preview welcome [usuario]` – Previsualiza el mensaje de bienvenida"
        ].join("\n"),
        inline: false
      },
      {
        name: "Autoroles de Color",
        value: [
          "`/setupcolors` – Crea automáticamente los roles de colores",
          "`/color-menu` – Publica el menú interactivo de selección"
        ].join("\n"),
        inline: false
      },
      {
        name: "Información del Bot",
        value: [
          "`/ping` / `capy!ping` – Muestra latencia y estado del bot",
          "`/help` / `capy!help` – Muestra este centro de ayuda",
          "`/config` / `capy!config` – Muestra la configuración actual del servidor"
        ].join("\n"),
        inline: false
      },
      {
        name: "Comandos Prefix",
        value: "El bot también soporta comandos con prefijo `capy!`. Usa `capy!help` para ver todos los comandos prefix disponibles. Los comandos más comunes incluyen:\n• Moderación: `capy!warn`, `capy!ban`, `capy!kick`, `capy!mute`, `capy!timeout`, `capy!tempban`, `capy!history`, `capy!case`, `capy!clear`, `capy!unban`\n• Utilidades: `capy!ping`, `capy!help`, `capy!config`\n• Información: `capy!user`",
        inline: false
      },
      {
        name: "Permisos Avanzados",
        value: [
          "`/modconfig view [type] [user/role]` – Ver políticas de permisos actuales",
          "`/modconfig module [módulo] [effect] [user/role]` – Configurar permisos para un módulo completo",
          "`/modconfig command [comando] [effect] [user/role]` – Configurar permisos para un comando específico",
          "`/modconfig reset [confirm]` – Resetear todas las políticas de permisos"
        ].join("\n"),
        inline: false
      }
    )
    .setFooter({ text: "Algunos comandos requieren permisos de administrador" })
    .setTimestamp();
}

export function getEmbedByCategory(category, client) {
  switch (category) {
    case "intro":
      return getIntroEmbed(client);
    case "config":
      return getConfigEmbed();
    case "moderation":
      return getModerationEmbed();
    case "cases":
      return getCasesEmbed();
    case "blacklist":
      return getBlacklistEmbed();
    case "info":
      return getInfoEmbed();
    case "voice":
      return getVoiceEmbed();
    case "utilities":
      return getUtilitiesEmbed();
    default:
      return getIntroEmbed(client);
  }
}

