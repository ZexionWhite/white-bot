import { PermissionFlagsBits } from "discord.js";
import { getSettings, upsertSettings } from "../../../db.js";

export async function handle(itx) {
  if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
    console.warn(`[settings/prefix] Sin permisos - ${itx.user.tag} en ${itx.guild.name}`);
    return itx.reply({ content: "Sin permisos.", ephemeral: true });
  }

  const prefix = itx.options.getString("prefijo", true).trim();
  
  if (prefix.length === 0 || prefix.length > 10) {
    return itx.reply({ 
      content: "❌ El prefijo debe tener entre 1 y 10 caracteres.", 
      ephemeral: true 
    });
  }

  try {
    const allFields = getAllSettingsFields(itx.guild.id, {
      command_prefix: prefix
    });
    upsertSettings.run(allFields);
    console.log(`[settings/prefix] Prefijo configurado a '${prefix}' en ${itx.guild.name}`);
  } catch (err) {
    console.error(`[settings/prefix] Error al guardar configuración:`, err.message);
    return itx.reply({ content: "❌ Error al guardar la configuración.", ephemeral: true });
  }
  
  return itx.reply({ 
    content: `✅ Prefijo configurado a \`${prefix}\`\n\nAhora puedes usar comandos como: \`${prefix}help\``, 
    ephemeral: true 
  });
}
