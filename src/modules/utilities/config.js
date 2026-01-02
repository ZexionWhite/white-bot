import { PermissionFlagsBits } from "discord.js";
import { getSettings } from "../../db.js";
import { configEmbed } from "./ui/config.js";

export default async function handleConfig(itx) {
  if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild) && 
      !itx.memberPermissions.has(PermissionFlagsBits.ManageRoles)) {
    return itx.reply({ 
      content: "❌ No tienes permisos para ver la configuración. Se requiere `ManageGuild` o `ManageRoles`.", 
      ephemeral: true 
    });
  }

  const settings = (await getSettings.get(itx.guild.id)) ?? {};
  const embed = configEmbed(itx.guild, settings);
  return itx.reply({ embeds: [embed], ephemeral: true });
}

