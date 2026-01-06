import { EmbedBuilder, MessageFlags } from "discord.js";
import { prepare } from "../../core/db/index.js";
import { getLocaleForGuild, t } from "../../core/i18n/index.js";

export default async function handlePing(itx) {
  const locale = await getLocaleForGuild(itx.guild);
  const publico = itx.options.getBoolean("public") ?? false;

  const t0 = Date.now();
  await itx.deferReply({ flags: publico ? 0 : MessageFlags.Ephemeral });

  const rt = Date.now() - t0;
  const api = Math.round(itx.client.ws.ping);

  let dbMs = null;
  try { const s = Date.now(); await prepare("SELECT 1").get(); dbMs = Date.now() - s; } catch { }

  const up = process.uptime();
  const h = Math.floor(up / 3600), m = Math.floor((up % 3600) / 60), s = Math.floor(up % 60);
  const mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

  const embed = new EmbedBuilder()
    .setTitle(t(locale, "utilities.ping.title"))
    .addFields(
      { name: t(locale, "utilities.ping.fields.api"), value: `${api} ms`, inline: true },
      { name: t(locale, "utilities.ping.fields.round_trip"), value: `${rt} ms`, inline: true },
      { name: t(locale, "utilities.ping.fields.db"), value: dbMs !== null ? `${dbMs} ms` : t(locale, "utilities.ping.not_available"), inline: true },
      { name: t(locale, "utilities.ping.fields.uptime"), value: `${h}h ${m}m ${s}s`, inline: true },
      { name: t(locale, "utilities.ping.fields.memory"), value: `${mem} MB`, inline: true },
      { name: t(locale, "utilities.ping.fields.guilds"), value: `${itx.client.guilds.cache.size}`, inline: true }
    )
    .setColor(0x5865f2)
    .setTimestamp();

  await itx.editReply({ embeds: [embed] });
}
