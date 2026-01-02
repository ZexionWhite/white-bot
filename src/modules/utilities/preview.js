import { PermissionFlagsBits } from "discord.js";
import { welcomeEmbed } from "../settings/ui/welcome.js";
import { boosterEmbed } from "../settings/ui/boost.js";
import { getSettings } from "../../db.js";

export default async function handlePreview(itx) {
  if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
    return itx.reply({ content: "Sin permisos.", ephemeral: true });
  }

  const subcommand = itx.options.getSubcommand();
  const targetUser = itx.options.getUser("usuario") ?? itx.user;
  const member = await itx.guild.members.fetch(targetUser.id).catch(() => null);
  if (!member) return itx.reply({ content: "No encontré ese miembro.", ephemeral: true });

  const publico = itx.options.getBoolean("publico") ?? false;

  if (subcommand === "boost") {
    const embed = boosterEmbed(member, {
      boosterRoleId: getSettings.get(itx.guild.id)?.booster_role_id ?? null,
      infoChannelId: getSettings.get(itx.guild.id)?.info_channel_id ?? null
    });

    const forced = itx.options.getInteger("boosts");
    if (forced !== null) {
      const when = new Intl.DateTimeFormat("es-AR", {
        dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Cordoba"
      }).format(new Date());
      embed.setFooter({
        text: `${forced} boosts actuales • ${when}`,
        iconURL: member.guild.iconURL({ size: 64, extension: "png" }) ?? undefined
      });
    }

    if (!publico) {
      return itx.reply({ embeds: [embed], ephemeral: true });
    }

    const cfg = getSettings.get(itx.guild.id);
    let ch = null;
    if (cfg?.booster_announce_channel_id) {
      ch = await itx.guild.channels.fetch(cfg.booster_announce_channel_id).catch(() => null);
    }
    if (!ch?.isTextBased()) ch = itx.channel;

    await ch.send({ embeds: [embed] }).catch(() => { });
    return itx.reply({ content: "Preview de boost enviada ✅", ephemeral: true });
  }

  if (subcommand === "welcome") {
    const cfg = getSettings.get(itx.guild.id);
    const embed = welcomeEmbed(member, {
      autorolesChannelId: cfg?.autorole_channel_id ?? null
    });

    if (!publico) {
      return itx.reply({ 
        content: `¡Bienvenido/a <@${member.id}>!`,
        embeds: [embed], 
        ephemeral: true 
      });
    }

    const welcomeCh = cfg?.welcome_channel_id 
      ? await itx.guild.channels.fetch(cfg.welcome_channel_id).catch(() => null)
      : null;
    const ch = welcomeCh?.isTextBased() ? welcomeCh : itx.channel;

    await ch.send({ 
      content: `¡Bienvenido/a <@${member.id}>!`,
      embeds: [embed] 
    }).catch(() => { });
    return itx.reply({ content: "Preview de bienvenida enviada ✅", ephemeral: true });
  }
}

