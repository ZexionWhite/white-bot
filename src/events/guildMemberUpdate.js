import { EmbedBuilder, AttachmentBuilder, AuditLogEvent } from "discord.js";
import { boosterEmbed } from "../utils/embeds.js";
import { getSettings } from "../db.js";
import { TZ } from "../config.js";
import { composeBeforeAfter } from "../utils/beforeAfter.js";

export default async function guildMemberUpdate(client, oldM, newM) {
  const cfg = getSettings.get(newM.guild.id) ?? {};

  // ===== 1) Anuncio de BOOST (igual que antes) =====
  const had = Boolean(oldM?.premiumSince);
  const has = Boolean(newM?.premiumSince);
  const started = !had && has;

  if (started) {
    const channelId = cfg?.booster_announce_channel_id;
    if (channelId) {
      const ch = await newM.guild.channels.fetch(channelId).catch(() => null);
      if (ch?.isTextBased()) {
        const autoBoosterRoleId =
          newM.guild.roles.cache.find(r => r.tags?.premiumSubscriberRole)?.id ?? null;
        const boosterRoleId = cfg?.booster_role_id ?? autoBoosterRoleId;
        const infoChannelId = cfg?.info_channel_id ?? null;

        const embed = boosterEmbed(newM, { boosterRoleId, infoChannelId });
        await ch.send({ embeds: [embed] }).catch(() => {});
      }
    }
  }

  // ===== 2) Log de SERVER AVATAR (avatar del miembro en este guild) =====
  {
    const serverAvatarChanged = oldM?.avatar !== newM?.avatar;
    if (serverAvatarChanged) {
      const avatarLogId = cfg?.avatar_log_channel_id;
      if (avatarLogId) {
        const logCh = await newM.guild.channels.fetch(avatarLogId).catch(() => null);
        if (logCh?.isTextBased()) {
          const oldServerUrl = oldM?.avatar ? oldM.avatarURL({ size: 512, extension: "png" }) : null;
          const newServerUrl = newM?.avatar ? newM.avatarURL({ size: 512, extension: "png" }) : null;

          const composed = await composeBeforeAfter(oldServerUrl, newServerUrl).catch(() => null);

          const when = new Intl.DateTimeFormat("es-AR", {
            dateStyle: "short",
            timeStyle: "short",
            timeZone: TZ
          }).format(new Date());

          const embed = new EmbedBuilder()
            .setTitle("<:user_picture:1405722148823367830> Avatar updated")
            .setDescription(`**User:** ${newM.user?.tag ?? "(unknown)"} (\`${newM.id}\`)`)
            .setColor(0x9b59b6)
            .setFooter({
              text: `Actualizado el ${when}`,
              iconURL: newM.guild.iconURL({ size: 64, extension: "png" }) ?? undefined
            });

          // Links enmascarados a cada versión
          const linksField = [
            oldServerUrl ? `**Before:** [open](${oldServerUrl})` : "**Before:** —",
            newServerUrl ? `**After:**  [open](${newServerUrl})`  : "**After:** —"
          ].join("\n");
          embed.addFields({ name: "Links", value: linksField });

          if (composed) {
            const file = new AttachmentBuilder(composed, { name: "server-avatar-before-after.png" });
            embed.setImage("attachment://server-avatar-before-after.png");
            await logCh.send({ embeds: [embed], files: [file] }).catch(() => {});
          } else {
            const fallback = newServerUrl ?? oldServerUrl ?? null;
            if (fallback) embed.setImage(fallback);
            await logCh.send({ embeds: [embed] }).catch(() => {});
          }
        }
      }
    }
  }

  // ===== 3) Log de NICKNAME =====
  {
    const oldNick = oldM?.nickname ?? null;
    const newNick = newM?.nickname ?? null;
    const nickChanged = oldNick !== newNick;
    if (nickChanged) {
      const nickLogId = cfg?.nickname_log_channel_id;
      if (nickLogId) {
        const ch = await newM.guild.channels.fetch(nickLogId).catch(() => null);
        if (ch?.isTextBased()) {
          // best-effort: quién lo cambió (audit log)
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
          } catch { /* sin View Audit Log o rate-limit */ }

          const when = new Intl.DateTimeFormat("es-AR", {
            dateStyle: "short",
            timeStyle: "short",
            timeZone: TZ
          }).format(new Date());

          const embed = new EmbedBuilder()
            .setTitle("<:nickname_change:1405729775330398308> Nickname updated")
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
            .setColor(0x3498db)
            .setTimestamp()
            .setFooter({
              text: `Nick update`,
              iconURL: newM.guild.iconURL({ size: 64, extension: "png" }) ?? undefined
            });

          await ch.send({ embeds: [embed] }).catch(() => {});
        }
      }
    }
  }
}
