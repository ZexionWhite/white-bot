import { EmbedBuilder, AttachmentBuilder } from "discord.js";
import { getSettings } from "../db.js";
import { TZ } from "../config.js";
import { composeBeforeAfter } from "../utils/beforeAfter.js";

function fmtNow() {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: TZ
  }).format(new Date());
}

export default async function userUpdate(client, oldUser, newUser) {
  if (oldUser?.avatar === newUser?.avatar) return;

  const oldUrl = oldUser?.displayAvatarURL?.({ size: 512, extension: "png" }) ?? null;
  const newUrl = newUser?.displayAvatarURL?.({ size: 512, extension: "png" }) ?? null;

  for (const [, guild] of client.guilds.cache) {
    const cfg = getSettings.get(guild.id);
    const logId = cfg?.avatar_log_channel_id;
    if (!logId) continue;

    const member = await guild.members.fetch(newUser.id).catch((err) => {
      console.warn(`[userUpdate] Usuario ${newUser.tag} no encontrado en ${guild.name}:`, err.message);
      return null;
    });
    if (!member) continue;

    const logCh = await guild.channels.fetch(logId).catch((err) => {
      console.error(`[userUpdate] Error al obtener canal de logs ${logId} en ${guild.name}:`, err.message);
      return null;
    });
    if (!logCh?.isTextBased()) continue;

    const composed = await composeBeforeAfter(oldUrl, newUrl).catch((err) => {
      console.warn(`[userUpdate] Error al componer imagen before/after para ${newUser.tag}:`, err.message);
      return null;
    });
    const when = fmtNow();

    const embed = new EmbedBuilder()
      .setTitle("🖼️ Avatar cambiado")
      .setDescription(`**User:** ${newUser.tag} (\`${newUser.id}\`)`)
      .setColor(0x5865f2)
      .setFooter({
        text: `Actualizado el ${when}`,
        iconURL: guild.iconURL({ size: 64, extension: "png" }) ?? undefined
      });

    const linksField = [
      oldUrl ? `**Before:** [open](${oldUrl})` : "**Before:** —",
      newUrl ? `**After:**  [open](${newUrl})` : "**After:** —"
    ].join("\n");
    embed.addFields({ name: "Links", value: linksField });

    if (composed) {
      const file = new AttachmentBuilder(composed, { name: "avatar-before-after.png" });
      embed.setImage("attachment://avatar-before-after.png");
      await logCh.send({ embeds: [embed], files: [file] }).catch((err) => {
        console.error(`[userUpdate] Error al enviar log de avatar con imagen compuesta en ${guild.name}:`, err.message);
      });
    } else {
      const fallback = newUrl ?? oldUrl ?? null;
      if (fallback) embed.setImage(fallback);
      await logCh.send({ embeds: [embed] }).catch((err) => {
        console.error(`[userUpdate] Error al enviar log de avatar en ${guild.name}:`, err.message);
      });
    }
  }
}
