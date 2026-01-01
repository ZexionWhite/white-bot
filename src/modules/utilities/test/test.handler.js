import { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { welcomeEmbed, logJoinEmbed } from "../../../embeds/welcome.js";
import { boosterEmbed } from "../../../embeds/boost.js";
import { configEmbed } from "../../../embeds/config.js";
import { voiceStateEmbed } from "../../../embeds/voice.js";
import { createModlogEmbed, createCaseEmbed, createHistoryEmbed, createSuccessEmbed, createErrorEmbed } from "../../moderation/ui/embeds.js";
import { createUserinfoOverview, createUserinfoSanctions, createUserinfoVoice, createUserinfoMessages, createUserinfoPermissions, createUserinfoStatistics } from "../../info/ui/embeds.js";
import { createBlacklistEmbed, createBlacklistHistoryEmbed } from "../../blacklist/ui/embeds.js";
import { getEmbedByCategory } from "../help/help.embed.js";

const TEST_GUILD_ID = "1053040188445704253";

export function isTestGuild(guildId) {
  return guildId === TEST_GUILD_ID;
}

export function createTestSelectMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("test:select")
      .setPlaceholder("Selecciona un embed para testear...")
      .addOptions([
        { label: "Welcome", value: "welcome", emoji: "👋" },
        { label: "Join Log", value: "joinlog", emoji: "📥" },
        { label: "Boost", value: "boost", emoji: "💎" },
        { label: "Config", value: "config", emoji: "⚙️" },
        { label: "Voice State", value: "voicestate", emoji: "🎤" },
        { label: "Modlog", value: "modlog", emoji: "🛡️" },
        { label: "Case", value: "case", emoji: "📋" },
        { label: "History", value: "history", emoji: "📜" },
        { label: "Success", value: "success", emoji: "✅" },
        { label: "Error", value: "error", emoji: "❌" },
        { label: "User Overview", value: "user_overview", emoji: "👤" },
        { label: "User Sanctions", value: "user_sanctions", emoji: "⚠️" },
        { label: "User Voice", value: "user_voice", emoji: "🎙️" },
        { label: "User Messages", value: "user_messages", emoji: "💬" },
        { label: "User Permissions", value: "user_permissions", emoji: "🔐" },
        { label: "User Statistics", value: "user_statistics", emoji: "📊" },
        { label: "Blacklist", value: "blacklist", emoji: "🚫" },
        { label: "Blacklist History", value: "blacklist_history", emoji: "📚" },
        { label: "Help - Intro", value: "help_intro", emoji: "📖" },
        { label: "Help - Config", value: "help_config", emoji: "⚙️" },
        { label: "Help - Moderation", value: "help_moderation", emoji: "🛡️" },
        { label: "Help - Cases", value: "help_cases", emoji: "📋" },
        { label: "Help - Blacklist", value: "help_blacklist", emoji: "🚫" },
        { label: "Help - Info", value: "help_info", emoji: "🔍" },
        { label: "Help - Voice", value: "help_voice", emoji: "🎤" }
      ])
  );
}

function generateMockCase(member, type = "WARN") {
  const now = Date.now();
  const randomId = Math.floor(Math.random() * 1000) + 1;
  return {
    id: randomId,
    guild_id: member.guild.id,
    type,
    target_id: member.id,
    moderator_id: member.id,
    reason: `Test reason for ${type.toLowerCase()}`,
    created_at: now,
    expires_at: type === "TEMPBAN" || type === "MUTE" ? now + 3600000 : null,
    active: 1,
    metadata: null,
    deleted_at: null,
    deleted_by: null,
    deleted_reason: null
  };
}

function generateMockBlacklistEntry(member) {
  const now = Date.now();
  const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  return {
    id: Math.floor(Math.random() * 100) + 1,
    guild_id: member.guild.id,
    user_id: member.id,
    moderator_id: member.id,
    reason: "Test blacklist entry reason",
    evidence: "Test evidence: User violated server rules",
    severity: severities[Math.floor(Math.random() * severities.length)],
    created_at: now,
    updated_at: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
    deleted_reason: null
  };
}

function generateMockSettings(guild) {
  const channels = guild.channels.cache.filter(c => c.isTextBased());
  const channelArray = Array.from(channels.values());
  const roles = Array.from(guild.roles.cache.values());
  
  return {
    welcome_channel_id: channelArray[0]?.id || null,
    log_channel_id: channelArray[1]?.id || null,
    welcome_cd_minutes: 60,
    autorole_channel_id: channelArray[2]?.id || null,
    autorole_message_id: null,
    booster_role_id: roles.find(r => r.name.toLowerCase().includes("boost"))?.id || roles[0]?.id || null,
    booster_announce_channel_id: channelArray[3]?.id || null,
    info_channel_id: channelArray[4]?.id || null,
    message_log_channel_id: channelArray[5]?.id || null,
    avatar_log_channel_id: channelArray[6]?.id || null,
    nickname_log_channel_id: channelArray[7]?.id || null,
    voice_log_channel_id: channelArray[8]?.id || null,
    modlog_channel_id: channelArray[9]?.id || null,
    blacklist_channel_id: channelArray[10]?.id || null,
    mute_role_id: roles.find(r => r.name.toLowerCase().includes("mute"))?.id || roles[1]?.id || null,
    dm_on_punish: true
  };
}

function generateMockStats() {
  return {
    total_voice_seconds: Math.floor(Math.random() * 86400) + 3600,
    message_count: Math.floor(Math.random() * 1000) + 10
  };
}

function generateMockVoiceActivity(member) {
  const channels = member.guild.channels.cache.filter(c => c.isVoiceBased());
  const channelArray = Array.from(channels.values());
  const actions = ["JOIN", "LEAVE", "MOVE"];
  const now = Date.now();
  
  return Array.from({ length: 5 }, (_, i) => ({
    guild_id: member.guild.id,
    user_id: member.id,
    action: actions[Math.floor(Math.random() * actions.length)],
    channel_id: channelArray[Math.floor(Math.random() * channelArray.length)]?.id || null,
    at: now - (i * 3600000)
  }));
}

function generateMockMessages(member) {
  const channels = member.guild.channels.cache.filter(c => c.isTextBased());
  const channelArray = Array.from(channels.values());
  const now = Date.now();
  const messages = [
    "This is a test message for embed testing",
    "Another test message with some content",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
    "Test message number four",
    "Final test message for the embed"
  ];
  
  return Array.from({ length: 5 }, (_, i) => ({
    guild_id: member.guild.id,
    user_id: member.id,
    channel_id: channelArray[Math.floor(Math.random() * channelArray.length)]?.id || null,
    content: messages[i] || "Test message",
    at: now - (i * 1800000)
  }));
}

function generateMockPolicies(member) {
  const commands = ["warn", "mute", "ban", "kick", "timeout"];
  const effects = ["ALLOW", "DENY"];
  const now = Date.now();
  
  return {
    userPolicies: Array.from({ length: 2 }, (_, i) => ({
      id: i + 1,
      guild_id: member.guild.id,
      command_key: commands[Math.floor(Math.random() * commands.length)],
      subject: "USER",
      subject_id: member.id,
      effect: effects[Math.floor(Math.random() * effects.length)],
      created_at: now - (i * 86400000)
    })),
    rolePolicies: Array.from({ length: 2 }, (_, i) => {
      const role = member.roles.cache.first();
      return {
        id: i + 10,
        guild_id: member.guild.id,
        command_key: commands[Math.floor(Math.random() * commands.length)],
        subject: "ROLE",
        subject_id: role?.id || member.guild.id,
        effect: effects[Math.floor(Math.random() * effects.length)],
        created_at: now - (i * 86400000)
      };
    })
  };
}

export async function handleTestCommand(itx, client) {
  try {
    if (!itx.inGuild()) {
      return itx.reply({ content: "❌ Este comando solo funciona en servidores.", flags: MessageFlags.Ephemeral });
    }

    if (!itx.guild || !itx.guild.id) {
      return itx.reply({ content: "❌ No se pudo obtener información del servidor.", ephemeral: true });
    }

    if (!isTestGuild(itx.guild.id)) {
      return itx.reply({ content: "❌ Este comando solo está disponible en el servidor de pruebas.", flags: MessageFlags.Ephemeral });
    }

    const selectMenu = createTestSelectMenu();
    return itx.reply({ 
      content: "**🧪 Test Embed Selector**\nSelecciona un embed del menú para testearlo:",
      components: [selectMenu],
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    console.error("[test] Error en handleTestCommand:", error);
    return itx.reply({ content: `❌ Error: ${error.message}`, flags: MessageFlags.Ephemeral }).catch(() => {});
  }
}

export async function handleTestSelect(itx, client) {
  try {
    if (!itx.inGuild() || !itx.guild || !itx.guild.id) {
      return itx.reply({ content: "❌ Este comando solo funciona en servidores.", flags: MessageFlags.Ephemeral });
    }

    if (!isTestGuild(itx.guild.id)) {
      return itx.reply({ content: "❌ Este comando solo está disponible en el servidor de pruebas.", flags: MessageFlags.Ephemeral });
    }

    if (!itx.member) {
      return itx.reply({ content: "❌ No se pudo obtener información del miembro.", flags: MessageFlags.Ephemeral });
    }

    const embedType = itx.values?.[0];
    if (!embedType) {
      return itx.update({ content: "❌ No se seleccionó ningún embed.", components: [] });
    }

    const member = itx.member;
    let embed;

    switch (embedType) {
      case "welcome":
        embed = welcomeEmbed(member, { autorolesChannelId: itx.guild.channels.cache.find(c => c.isTextBased())?.id });
        break;

      case "joinlog":
        embed = logJoinEmbed(member);
        break;

      case "boost":
        embed = boosterEmbed(member, {
          boosterRoleId: member.guild.roles.cache.find(r => r.name.toLowerCase().includes("boost"))?.id,
          infoChannelId: itx.guild.channels.cache.find(c => c.isTextBased())?.id
        });
        break;

      case "config":
        embed = configEmbed(itx.guild, generateMockSettings(itx.guild));
        break;

      case "voicestate":
        const oldChannel = itx.guild.channels.cache.find(c => c.isVoiceBased());
        const newChannel = itx.guild.channels.cache.filter(c => c.isVoiceBased()).at(1) || oldChannel;
        if (oldChannel && newChannel) {
          const mockOldState = { channel: oldChannel, member };
          const mockNewState = { channel: newChannel, member };
          embed = voiceStateEmbed(mockOldState, mockNewState, {
            join_timestamp: Date.now() - 3600000,
            guild_id: itx.guild.id,
            user_id: member.id
          });
        } else {
          return itx.update({ content: "❌ No hay canales de voz disponibles para testear este embed.", components: [] });
        }
        break;

      case "modlog":
        const case_ = generateMockCase(member, "WARN");
        embed = createModlogEmbed(case_, member.user, itx.user, true);
        break;

      case "case":
        const caseData = generateMockCase(member, "BAN");
        embed = createCaseEmbed(caseData, member.user, itx.user);
        break;

      case "history":
        const cases = [
          generateMockCase(member, "WARN"),
          generateMockCase(member, "MUTE"),
          generateMockCase(member, "KICK")
        ];
        embed = createHistoryEmbed(cases, member.user, 1, 1);
        break;

      case "success":
        embed = createSuccessEmbed("warn", member.user, 123);
        break;

      case "error":
        embed = createErrorEmbed("Test error message");
        break;

      case "user_overview": {
        embed = createUserinfoOverview(member, itx.guild);
        break;
      }

      case "user_sanctions": {
        embed = createUserinfoSanctions(member, itx.guild);
        break;
      }

      case "user_voice": {
        embed = createUserinfoVoice(member, itx.guild);
        break;
      }

      case "user_messages": {
        embed = createUserinfoMessages(member, itx.guild);
        break;
      }

      case "user_permissions": {
        embed = createUserinfoPermissions(member, itx.guild);
        break;
      }

      case "user_statistics": {
        const mockStats = generateMockStats();
        embed = createUserinfoStatistics(member, mockStats);
        break;
      }

      case "blacklist":
        const entry = generateMockBlacklistEntry(member);
        embed = createBlacklistEmbed(entry, member.user, itx.user);
        break;

      case "blacklist_history":
        const entries = [
          generateMockBlacklistEntry(member),
          generateMockBlacklistEntry(member)
        ];
        embed = createBlacklistHistoryEmbed(entries, member.user);
        break;

      case "help_intro":
        embed = getEmbedByCategory("intro", client);
        break;

      case "help_config":
        embed = getEmbedByCategory("config", client);
        break;

      case "help_moderation":
        embed = getEmbedByCategory("moderation", client);
        break;

      case "help_cases":
        embed = getEmbedByCategory("cases", client);
        break;

      case "help_blacklist":
        embed = getEmbedByCategory("blacklist", client);
        break;

      case "help_info":
        embed = getEmbedByCategory("info", client);
        break;

      case "help_voice":
        embed = getEmbedByCategory("voice", client);
        break;

      case "help_utilities":
        embed = getEmbedByCategory("utilities", client);
        break;

      default:
        return itx.update({ content: "❌ Tipo de embed no reconocido.", components: [] });
    }

    if (!embed) {
      return itx.update({ 
        content: "❌ No se pudo generar el embed.",
        components: []
      });
    }

    const selectMenu = createTestSelectMenu();
    return itx.update({ 
      content: `**🧪 Testing: ${embedType}**`,
      embeds: [embed],
      components: [selectMenu]
    });
  } catch (error) {
    console.error(`[test] Error al generar embed:`, error);
    console.error(`[test] Stack:`, error.stack);
    return itx.update({ 
      content: `❌ Error al generar el embed: ${error.message}`,
      components: []
    }).catch(() => {
      return itx.reply({ 
        content: `❌ Error crítico: ${error.message}`,
        flags: MessageFlags.Ephemeral 
      });
    });
  }
}
