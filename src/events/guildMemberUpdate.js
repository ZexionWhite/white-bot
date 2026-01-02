import { EmbedBuilder, AttachmentBuilder, AuditLogEvent } from "discord.js";
import { boosterEmbed } from "../modules/settings/ui/boost.js";
import { getSettings } from "../db.js";
import { TZ } from "../config.js";
import { composeBeforeAfter } from "../utils/beforeAfter.js";
import { EMOJIS } from "../config/emojis.js";
import { log } from "../core/logger/index.js";

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

        const embed = boosterEmbed(newM, { boosterRoleId, infoChannelId });
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

          const when = new Intl.DateTimeFormat("es-AR", {
            dateStyle: "short",
            timeStyle: "short",
            timeZone: TZ
          }).format(new Date());

          const embed = new EmbedBuilder()
            .setTitle(`${EMOJIS.LOGS.USER_PICTURE} Avatar updated`)
            .setDescription(`**User:** ${newM.user?.tag ?? "(unknown)"} (\`${newM.id}\`)`)
            .setColor(0x393a41)
            .setFooter({
              text: `Actualizado el ${when}`,
              iconURL: newM.guild.iconURL({ size: 64, extension: "png" }) ?? undefined
            });

          const linksField = [
            oldServerUrl ? `**Before:** [open](${oldServerUrl})` : "**Before:** —",
            newServerUrl ? `**After:**  [open](${newServerUrl})`  : "**After:** —"
          ].join("\n");
          embed.addFields({ name: "Links", value: linksField });

          if (composed) {
            const file = new AttachmentBuilder(composed, { name: "server-avatar-before-after.png" });
            embed.setImage("attachment://server-avatar-before-after.png");
            await logCh.send({ embeds: [embed], files: [file] }).catch((err) => {
              log.error("guildMemberUpdate", `Error al enviar log de avatar de servidor con imagen compuesta en ${newM.guild.name}:`, err.message);
            });
          } else {
            const fallback = newServerUrl ?? oldServerUrl ?? null;
            if (fallback) embed.setImage(fallback);
            await logCh.send({ embeds: [embed] }).catch((err) => {
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

          const when = new Intl.DateTimeFormat("es-AR", {
            dateStyle: "short",
            timeStyle: "short",
            timeZone: TZ
          }).format(new Date());

          const embed = new EmbedBuilder()
            .setTitle(`${EMOJIS.LOGS.NICKNAME_CHANGE} Nickname updated`)
            .setDescription(
              [
                `**User:** ${newM.user?.tag ?? "(unknown)"} (\`${newM.id}\`)`,
                `**Changed by:** ${executorText}`
              ].join("\n")
            )
            .addFields(
              { name: "Before", value: oldNick ? `\`${oldNick}\`` : "—", inline: true },
              { name: "After",  value: newNick ? `\`${newNick}\`` : "—", inline: true }
            )
            .setColor(0x393a41)
            .setTimestamp()
            .setFooter({
              text: `Nick update`,
              iconURL: newM.guild.iconURL({ size: 64, extension: "png" }) ?? undefined
            });

          await ch.send({ embeds: [embed] }).catch((err) => {
            log.error("guildMemberUpdate", `Error al enviar log de nickname en ${newM.guild.name}:`, err.message);
          });
        }
      }
    }
  }
}
