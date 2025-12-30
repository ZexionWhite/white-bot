import { helpEmbed } from "../../utils/embeds.js";

export default async function handleHelp(itx) {
  const embed = helpEmbed();
  return itx.reply({ embeds: [embed], ephemeral: false });
}

