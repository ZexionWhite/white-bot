import { PermissionFlagsBits, MessageFlags } from "discord.js";
import { getSettings } from "../../db.js";
import { configEmbed } from "./ui/config.js";
import { getLocaleForGuild, t } from "../../core/i18n/index.js";

export default async function handleConfig(itx) {
  const locale = await getLocaleForGuild(itx.guild);

  if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild) && 
      !itx.memberPermissions.has(PermissionFlagsBits.ManageRoles)) {
    return itx.reply({ 
      content: `❌ ${t(locale, "utilities.config.errors.permission_denied")}`, 
      flags: MessageFlags.Ephemeral 
    });
  }

  const settings = (await getSettings.get(itx.guild.id)) ?? {};
  const embed = await configEmbed(itx.guild, settings, locale);
  return itx.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
