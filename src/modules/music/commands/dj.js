/**
 * Comando /dj
 * Gestiona el rol DJ
 */
import { getLocaleForGuildId, t } from "../../../core/i18n/index.js";
import { canSetDjRole, setDjRole, clearDjRole, getDjRole } from "../services/permissions.service.js";
import { createErrorEmbed } from "../ui/embeds.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: t(await getLocaleForGuildId(itx.guild.id), "common.errors.guild_only"), ephemeral: true });
  }

  const locale = await getLocaleForGuildId(itx.guild.id);
  const subcommand = itx.options.getSubcommand();

  if (subcommand === "setrole") {
    // Verificar permisos
    if (!canSetDjRole(itx.member)) {
      return itx.reply({
        embeds: [createErrorEmbed(t(locale, "music.errors.dj_setrole_permission"))],
        ephemeral: true
      });
    }

    const role = itx.options.getRole("role", true);

    if (!role) {
      return itx.reply({
        embeds: [createErrorEmbed(t(locale, "music.errors.dj_role_not_found"))],
        ephemeral: true
      });
    }

    setDjRole(itx.guild.id, role.id);

    return itx.reply({
      content: t(locale, "music.success.dj_role_set", { role: role.toString() })
    });
  }

  if (subcommand === "clearrole") {
    // Verificar permisos
    if (!canSetDjRole(itx.member)) {
      return itx.reply({
        embeds: [createErrorEmbed(t(locale, "music.errors.dj_setrole_permission"))],
        ephemeral: true
      });
    }

    clearDjRole(itx.guild.id);

    return itx.reply({
      content: t(locale, "music.success.dj_role_cleared")
    });
  }

  if (subcommand === "view") {
    const djRoleId = getDjRole(itx.guild.id);

    if (!djRoleId) {
      return itx.reply({
        content: t(locale, "music.dj.no_role")
      });
    }

    const role = itx.guild.roles.cache.get(djRoleId);
    if (!role) {
      // Rol eliminado pero aún en configuración
      clearDjRole(itx.guild.id);
      return itx.reply({
        content: t(locale, "music.dj.no_role")
      });
    }

    return itx.reply({
      content: t(locale, "music.dj.current_role", { role: role.toString() })
    });
  }
}
