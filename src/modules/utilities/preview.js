import { PermissionFlagsBits, MessageFlags } from "discord.js";
import { welcomeEmbed } from "../settings/ui/welcome.js";
import { boosterEmbed } from "../settings/ui/boost.js";
import { getSettings } from "../../db.js";
import { getLocaleForGuild, t } from "../../core/i18n/index.js";

export default async function handlePreview(itx) {
  const locale = await getLocaleForGuild(itx.guild);

  if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
    return itx.reply({ content: `❌ ${t(locale, "utilities.preview.errors.no_permission")}`, flags: MessageFlags.Ephemeral });
  }

  const subcommand = itx.options.getSubcommand();
  const targetUser = itx.options.getUser("user") ?? itx.user;
  const member = await itx.guild.members.fetch(targetUser.id).catch(() => null);
  if (!member) return itx.reply({ content: `❌ ${t(locale, "utilities.preview.errors.member_not_found")}`, flags: MessageFlags.Ephemeral });

  const publico = itx.options.getBoolean("public") ?? false;

  if (subcommand === "boost") {
    const settings = await getSettings.get(itx.guild.id);
    const embed = await boosterEmbed(member, {
      boosterRoleId: settings?.booster_role_id ?? null,
      infoChannelId: settings?.info_channel_id ?? null
    }, locale);

    const forced = itx.options.getInteger("boosts");
    if (forced !== null) {
      const when = new Intl.DateTimeFormat("es-AR", {
        dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Cordoba"
      }).format(new Date());
      embed.setFooter({
        text: t(locale, "utilities.preview.boost_footer", { count: forced, when }),
        iconURL: member.guild.iconURL({ size: 64, extension: "png" }) ?? undefined
      });
    }

    if (!publico) {
      return itx.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    const cfg = await getSettings.get(itx.guild.id);
    let ch = null;
    if (cfg?.booster_announce_channel_id) {
      ch = await itx.guild.channels.fetch(cfg.booster_announce_channel_id).catch(() => null);
    }
    if (!ch?.isTextBased()) ch = itx.channel;

    await ch.send({ embeds: [embed] }).catch(() => { });
    return itx.reply({ content: t(locale, "utilities.preview.boost_sent"), flags: MessageFlags.Ephemeral });
  }

  if (subcommand === "welcome") {
    const cfg = await getSettings.get(itx.guild.id);
    const embed = await welcomeEmbed(member, {
      autorolesChannelId: cfg?.autorole_channel_id ?? null
    }, locale);

    if (!publico) {
      return itx.reply({ 
        content: `${t(locale, "common.labels.welcome")} <@${member.id}>!`,
        embeds: [embed], 
        flags: MessageFlags.Ephemeral 
      });
    }

    const welcomeCh = cfg?.welcome_channel_id 
      ? await itx.guild.channels.fetch(cfg.welcome_channel_id).catch(() => null)
      : null;
    const ch = welcomeCh?.isTextBased() ? welcomeCh : itx.channel;

    await ch.send({ 
      content: `${t(locale, "common.labels.welcome")} <@${member.id}>!`,
      embeds: [embed] 
    }).catch(() => { });
    return itx.reply({ content: t(locale, "utilities.preview.welcome_sent"), flags: MessageFlags.Ephemeral });
  }
}
