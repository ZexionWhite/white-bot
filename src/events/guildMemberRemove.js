import { EmbedBuilder } from "discord.js";
import { getSettings } from "../db.js";
import { TZ } from "../config.js";

export default async function guildMemberRemove(client, member) {
  const cfg = getSettings.get(member.guild.id);
  if (!cfg?.log_channel_id) return;

  const ch = await member.guild.channels.fetch(cfg.log_channel_id).catch(() => null);
  if (!ch?.isTextBased()) return;

  const when = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short", timeStyle: "short", timeZone: TZ
  }).format(new Date());

  const tag = member.user?.tag ?? member.displayName ?? "Miembro";
  const id  = member.id ?? "desconocido";

  const embed = new EmbedBuilder()
    .setTitle("<:user_left:1404291902236528700> User left")
    .setDescription(`**${tag}** (\`${id}\`) user left the guild.`)
    .setFooter({ text: `${when}` })
    .setColor(0xed4245)

  await ch.send({ embeds: [embed] }).catch(() => {});
}
