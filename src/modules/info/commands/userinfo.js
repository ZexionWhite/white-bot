import * as PermService from "../../moderation/services/permissions.service.js";
import { createUserinfoOverview, createUserinfoSanctions, createUserinfoVoice, createUserinfoMessages, createUserinfoPermissions, createUserinfoStatistics } from "../ui/embeds.js";
import { createUserinfoSelectMenu } from "../../moderation/ui/components.js";
import { createErrorEmbed } from "../../moderation/ui/embeds.js";
import { getUserStats } from "../../../db.js";
import { log } from "../../../core/logger/index.js";
import { getLocaleForGuild, t, DEFAULT_LOCALE } from "../../../core/i18n/index.js";
import { MessageFlags } from "discord.js";

export async function handle(itx) {
  const locale = itx.guild ? await getLocaleForGuild(itx.guild) : DEFAULT_LOCALE;
  
  if (!itx.inGuild()) {
    return itx.reply({ content: `❌ ${t(locale, "common.errors.guild_only")}`, flags: MessageFlags.Ephemeral });
  }

  const target = itx.options.getUser("user") || itx.user;

  if (!await PermService.canExecuteCommand(itx.member, "user")) {
    return itx.reply({ embeds: [createErrorEmbed(t(locale, "common.errors.permission_denied"), locale)], flags: MessageFlags.Ephemeral });
  }

  const targetMember = await itx.guild.members.fetch(target.id).catch(() => null);
  if (!targetMember) {
    return itx.reply({ embeds: [createErrorEmbed(t(locale, "common.errors.user_not_found"), locale)], flags: MessageFlags.Ephemeral });
  }

  const embed = await createUserinfoOverview(targetMember, itx.guild, locale);
  const components = [createUserinfoSelectMenu(`user:${target.id}`, "overview")];

  return itx.reply({ embeds: [embed], components });
}

export async function handleSelectMenu(itx, targetId, view) {
  try {
    const locale = itx.guild ? await getLocaleForGuild(itx.guild) : DEFAULT_LOCALE;
    
    const targetMember = await itx.guild.members.fetch(targetId).catch(() => null);
    if (!targetMember) {
      return itx.update({ embeds: [createErrorEmbed(t(locale, "common.errors.user_not_found"), locale)], components: [] });
    }

    let embed;
    switch (view) {
      case "overview":
        embed = await createUserinfoOverview(targetMember, itx.guild, locale);
        break;
      case "sanctions":
        embed = await createUserinfoSanctions(targetMember, itx.guild, locale);
        break;
      case "voice":
        embed = await createUserinfoVoice(targetMember, itx.guild, locale);
        break;
      case "messages":
        embed = await createUserinfoMessages(targetMember, itx.guild, locale);
        break;
      case "permissions":
        embed = await createUserinfoPermissions(targetMember, itx.guild, locale);
        break;
      case "statistics":
        const stats = (await getUserStats.get(itx.guild.id, targetMember.id)) ?? null;
        embed = await createUserinfoStatistics(targetMember, stats, itx.guild, locale);
        break;
      default:
        embed = await createUserinfoOverview(targetMember, itx.guild, locale);
    }

    const components = [createUserinfoSelectMenu(`user:${targetId}`, view)];

    return itx.update({ embeds: [embed], components });
  } catch (error) {
    log.error("userinfo", `Error en handleSelectMenu para view "${view}":`, error);
    const locale = itx.guild ? await getLocaleForGuild(itx.guild) : DEFAULT_LOCALE;
    return itx.update({ 
      embeds: [createErrorEmbed(t(locale, "common.errors.unknown_error"), locale)], 
      components: [] 
    }).catch(() => {});
  }
}

