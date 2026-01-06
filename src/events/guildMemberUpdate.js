import { EmbedBuilder, AttachmentBuilder, AuditLogEvent } from "discord.js";
import { boosterEmbed } from "../modules/settings/ui/boost.js";
import { getSettings } from "../db.js";
import { TZ } from "../config.js";
import { composeBeforeAfter } from "../utils/beforeAfter.js";
import { EMOJIS } from "../config/emojis.js";
import { log } from "../core/logger/index.js";
import { sendLog } from "../core/webhooks/index.js";
import { t, getLocaleForGuild } from "../core/i18n/index.js";

export default async function guildMemberUpdate(client, oldM, newM) {
  const cfg = (await getSettings.get(newM.guild.id)) ?? {};

  const had = Boolean(oldM?.premiumSince);
  const has = Boolean(newM?.premiumSince);
  const started = !had && has;

  if (started) {
    log.info("guildMemberUpdate", `Boost detectado: ${newM.user.tag} en ${newM.guild.name}`);
    const channelId = cfg?.booster_announce_channel_id;
    if (channelId) {
      const ch = await newM.guild.channels.fetch(channelId).catch((err) => {
        log.error("guildMemberUpdate", `Error al obtener canal de boost ${channelId} en ${newM.guild.name}:`, err.message);
        return null;
      });
      if (ch?.isTextBased()) {
        const autoBoosterRoleId =
          newM.guild.roles.cache.find(r => r.tags?.premiumSubscriberRole)?.id ?? null;
        const boosterRoleId = cfg?.booster_role_id ?? autoBoosterRoleId;
        const infoChannelId = cfg?.info_channel_id ?? null;

        const locale = await getLocaleForGuild(newM.guild);
        const embed = await boosterEmbed(newM, { boosterRoleId, infoChannelId }, locale);
        await ch.send({ embeds: [embed] }).catch((err) => {
          log.error("guildMemberUpdate", `Error al enviar anuncio de boost en ${newM.guild.name}:`, err.message);
        });
      }
    } else {
      log.debug("guildMemberUpdate", `Boost detectado pero no hay canal configurado en ${newM.guild.name}`);
    }
  }

  {
    const serverAvatarChanged = oldM?.avatar !== newM?.avatar;
    if (serverAvatarChanged) {
      const avatarLogId = cfg?.avatar_log_channel_id;
      if (avatarLogId) {
        const logCh = await newM.guild.channels.fetch(avatarLogId).catch((err) => {
          console.error(`[guildMemberUpdate] Error al obtener canal de logs de avatar ${avatarLogId} en ${newM.guild.name}:`, err.message);
          return null;
        });
        if (logCh?.isTextBased()) {
          const oldServerUrl = oldM?.avatar ? oldM.avatarURL({ size: 512, extension: "png" }) : null;
          const newServerUrl = newM?.avatar ? newM.avatarURL({ size: 512, extension: "png" }) : null;

          console.log(`[guildMemberUpdate] Avatar de servidor cambiado: ${newM.user.tag} en ${newM.guild.name}`);
          const composed = await composeBeforeAfter(oldServerUrl, newServerUrl).catch((err) => {
            console.warn(`[guildMemberUpdate] Error al componer imagen before/after para avatar de servidor:`, err.message);
            return null;
          });

          const locale = await getLocaleForGuild(newM.guild);
          const when = new Intl.DateTimeFormat("es-AR", {
            dateStyle: "short",
            timeStyle: "short",
            timeZone: TZ
          }).format(new Date());

          const userDisplay = `${newM.user?.tag ?? "(unknown)"} (\`${newM.id}\`)`;
          const linksField = [
            oldServerUrl ? t(locale, "logging.events.server_avatar_updated.link_before", { url: oldServerUrl }) : t(locale, "logging.events.server_avatar_updated.link_before_empty"),
            newServerUrl ? t(locale, "logging.events.server_avatar_updated.link_after", { url: newServerUrl }) : t(locale, "logging.events.server_avatar_updated.link_after_empty")
          ].join("\n");

          const embed = new EmbedBuilder()
            .setTitle(`${EMOJIS.LOGS.USER_PICTURE} ${t(locale, "logging.events.server_avatar_updated.title")}`)
            .setDescription(t(locale, "logging.events.server_avatar_updated.description_user", { user: userDisplay }))
            .setColor(0x393a41)
            .setFooter({
              text: t(locale, "logging.events.server_avatar_updated.footer_updated", { when }),
              iconURL: newM.guild.iconURL({ size: 64, extension: "png" }) ?? undefined
            })
            .addFields({ name: t(locale, "logging.events.server_avatar_updated.field_links"), value: linksField });

          if (composed) {
            const file = new AttachmentBuilder(composed, { name: "server-avatar-before-after.png" });
            embed.setImage("attachment://server-avatar-before-after.png");
            await sendLog(logCh, { embeds: [embed], files: [file] }, "user").catch((err) => {
              log.error("guildMemberUpdate", `Error al enviar log de avatar de servidor con imagen compuesta en ${newM.guild.name}:`, err.message);
            });
          } else {
            const fallback = newServerUrl ?? oldServerUrl ?? null;
            if (fallback) embed.setImage(fallback);
            await sendLog(logCh, { embeds: [embed] }, "user").catch((err) => {
              log.error("guildMemberUpdate", `Error al enviar log de avatar de servidor en ${newM.guild.name}:`, err.message);
            });
          }
        }
      }
    }
  }

  {
    const oldNick = oldM?.nickname ?? null;
    const newNick = newM?.nickname ?? null;
    const nickChanged = oldNick !== newNick;
    if (nickChanged) {
      const nickLogId = cfg?.nickname_log_channel_id;
      if (nickLogId) {
        const ch = await newM.guild.channels.fetch(nickLogId).catch((err) => {
          log.error("guildMemberUpdate", `Error al obtener canal de logs de nickname ${nickLogId} en ${newM.guild.name}:`, err.message);
          return null;
        });
        if (ch?.isTextBased()) {
          log.info("guildMemberUpdate", `Nickname cambiado: ${newM.user.tag} en ${newM.guild.name} (${oldM?.displayName} → ${newM.displayName})`);
          let executorText = "(unknown)";
          try {
            const logs = await newM.guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 5 });
            const now = Date.now();
            for (const [, entry] of logs.entries) {
              const recent = now - entry.createdTimestamp < 5000;
              const sameTarget = entry.target?.id === newM.id;
              const touchedNick = Array.isArray(entry.changes)
                ? entry.changes.some(c => c.key === "nick")
                : false;
              if (recent && sameTarget && touchedNick) {
                executorText = `${entry.executor.tag} (\`${entry.executor.id}\`)`;
                break;
              }
            }
          } catch (err) {
            log.warn("guildMemberUpdate", `Error al obtener audit log para nickname:`, err.message);
          }

          const locale = await getLocaleForGuild(newM.guild);
          const when = new Intl.DateTimeFormat("es-AR", {
            dateStyle: "short",
            timeStyle: "short",
            timeZone: TZ
          }).format(new Date());

          const userDisplay = `${newM.user?.tag ?? "(unknown)"} (\`${newM.id}\`)`;
          const embed = new EmbedBuilder()
            .setTitle(`${EMOJIS.LOGS.NICKNAME_CHANGE} ${t(locale, "logging.events.nickname_updated.title")}`)
            .setDescription(
              [
                t(locale, "logging.events.nickname_updated.description_user", { user: userDisplay }),
                t(locale, "logging.events.nickname_updated.description_changed_by", { executor: executorText })
              ].join("\n")
            )
            .addFields(
              { name: t(locale, "logging.events.nickname_updated.field_before"), value: oldNick ? `\`${oldNick}\`` : "—", inline: true },
              { name: t(locale, "logging.events.nickname_updated.field_after"),  value: newNick ? `\`${newNick}\`` : "—", inline: true }
            )
            .setColor(0x393a41)
            .setTimestamp()
            .setFooter({
              text: t(locale, "logging.events.nickname_updated.footer_nick_update"),
              iconURL: newM.guild.iconURL({ size: 64, extension: "png" }) ?? undefined
            });

          await sendLog(ch, { embeds: [embed] }, "user").catch((err) => {
            log.error("guildMemberUpdate", `Error al enviar log de nickname en ${newM.guild.name}:`, err.message);
          });
        }
      }
    }
  }
}
