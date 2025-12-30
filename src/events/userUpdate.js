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

    const member = await guild.members.fetch(newUser.id).catch(() => null);
    if (!member) continue;

    const logCh = await guild.channels.fetch(logId).catch(() => null);
    if (!logCh?.isTextBased()) continue;

    const composed = await composeBeforeAfter(oldUrl, newUrl).catch(() => null);
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
      await logCh.send({ embeds: [embed], files: [file] }).catch(() => {});
    } else {
      const fallback = newUrl ?? oldUrl ?? null;
      if (fallback) embed.setImage(fallback);
      await logCh.send({ embeds: [embed] }).catch(() => {});
    }
  }
}
