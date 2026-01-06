import { PermissionFlagsBits, MessageFlags } from "discord.js";
import { getSettings, upsertSettings } from "../../../db.js";
import { getAllSettingsFields } from "./_updateAllSettings.js";
import { getLocaleForGuild, t } from "../../../core/i18n/index.js";

export async function handle(itx) {
  const locale = await getLocaleForGuild(itx.guild);
  
  if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
    console.warn(`[settings/prefix] Sin permisos - ${itx.user.tag} en ${itx.guild.name}`);
    return itx.reply({ content: `❌ ${t(locale, "common.settings.prefix.no_permissions")}`, flags: MessageFlags.Ephemeral });
  }

  const prefix = itx.options.getString("prefijo", true).trim();
  
  if (prefix.length === 0 || prefix.length > 10) {
    return itx.reply({ 
      content: `❌ ${t(locale, "common.settings.prefix.invalid_length")}`, 
      flags: MessageFlags.Ephemeral 
    });
  }

  try {
    const allFields = await getAllSettingsFields(itx.guild.id, {
      command_prefix: prefix
    });
    await upsertSettings.run(allFields);
    console.log(`[settings/prefix] Prefijo configurado a '${prefix}' en ${itx.guild.name}`);
  } catch (err) {
    console.error(`[settings/prefix] Error al guardar configuración:`, err.message);
    return itx.reply({ content: `❌ ${t(locale, "common.settings.prefix.save_error")}`, flags: MessageFlags.Ephemeral });
  }
  
  return itx.reply({ 
    content: `✅ ${t(locale, "common.settings.prefix.success", { prefix })}`, 
    flags: MessageFlags.Ephemeral 
  });
}
