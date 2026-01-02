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

  const role = itx.options.getRole("role", true);

  const botMember = await itx.guild.members.fetchMe();
  if (!PermService.canManageRole(botMember, role)) {
    return itx.reply({ embeds: [createErrorEmbed("El bot no puede gestionar este rol. Verifica la jerarquía de roles")], ephemeral: true });
  }

  await SettingsRepo.updateGuildSettings(itx.guild.id, { mute_role_id: role.id });

  return itx.reply({ embeds: [createSuccessEmbed(`Rol de mute configurado: ${role}`, { id: role.id })] });
}

