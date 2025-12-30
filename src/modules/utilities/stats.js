import { getUserStats } from "../../db.js";
import { userStatsEmbed } from "../../utils/embeds.js";

export default async function handleStats(itx) {
  await itx.deferReply({ ephemeral: false });

  const targetUser = itx.options.getUser("usuario") ?? itx.user;
  const member = await itx.guild.members.fetch(targetUser.id).catch(() => null);
  
  if (!member) {
    return itx.editReply({ content: "No encontré ese usuario en el servidor." });
  }

  const stats = getUserStats.get(itx.guild.id, member.id) ?? null;
  const embed = userStatsEmbed(member, stats);
  await itx.editReply({ embeds: [embed] });
}

