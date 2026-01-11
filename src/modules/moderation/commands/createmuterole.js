import { PermissionFlagsBits } from "discord.js";
import * as PermService from "../services/permissions.service.js";
import * as SettingsRepo from "../db/settings.repo.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "Este comando solo funciona en servidores.", ephemeral: true });
  }

  if (!itx.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return itx.reply({ embeds: [createErrorEmbed("Necesitas el permiso 'Gestionar Servidor'")], ephemeral: true });
  }

  const botMember = await itx.guild.members.fetchMe();
  if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles | PermissionFlagsBits.ManageChannels)) {
    return itx.reply({ embeds: [createErrorEmbed("El bot necesita los permisos 'Gestionar Roles' y 'Gestionar Canales'")], ephemeral: true });
  }

  try {
    const muteRole = await itx.guild.roles.create({
      name: "Muted",
      color: 0x808080,
      reason: "Rol de mute creado automáticamente"
    });

    if (botMember.roles.highest.position <= muteRole.position) {
      await muteRole.delete("El rol del bot debe estar por encima del rol de mute");
      return itx.reply({ embeds: [createErrorEmbed("El rol del bot debe estar por encima del rol de mute. Ajusta la jerarquía y vuelve a intentar")], ephemeral: true });
    }

    for (const channel of itx.guild.channels.cache.values()) {
      try {
        if (channel.isTextBased() && !channel.isThread()) {
          await channel.permissionOverwrites.edit(muteRole, {
            SendMessages: false,
            AddReactions: false,
            Speak: false
          });
        } else if (channel.isVoiceBased()) {
          await channel.permissionOverwrites.edit(muteRole, {
            Speak: false,
            Connect: true
          });
        }
      } catch (error) {
        console.warn(`[createmuterole] No se pudo configurar permisos en ${channel.name}:`, error.message);
      }
    }

    await SettingsRepo.updateGuildSettings(itx.guild.id, { mute_role_id: muteRole.id });

    return itx.reply({ embeds: [createSuccessEmbed(`Rol de mute creado y configurado: ${muteRole}`, { id: muteRole.id })] });
  } catch (error) {
    console.error("[createmuterole] Error:", error);
    return itx.reply({ embeds: [createErrorEmbed(error.message)], ephemeral: true });
  }
}
