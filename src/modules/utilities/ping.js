import { EmbedBuilder } from "discord.js";
import { prepare } from "../../core/db/index.js";

export default async function handlePing(itx) {
  const publico = itx.options.getBoolean("publico") ?? false;

  const t0 = Date.now();
  await itx.deferReply({ ephemeral: !publico });

  const rt = Date.now() - t0;
  const api = Math.round(itx.client.ws.ping);

  let dbMs = null;
  try { const s = Date.now(); await prepare("SELECT 1").get(); dbMs = Date.now() - s; } catch { }

  const up = process.uptime();
  const h = Math.floor(up / 3600), m = Math.floor((up % 3600) / 60), s = Math.floor(up % 60);
  const mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

  const embed = new EmbedBuilder()
    .setTitle("🏓 Pong")
    .addFields(
      { name: "API (WS)", value: `${api} ms`, inline: true },
      { name: "Round-trip", value: `${rt} ms`, inline: true },
      { name: "DB", value: dbMs !== null ? `${dbMs} ms` : "–", inline: true },
      { name: "Uptime", value: `${h}h ${m}m ${s}s`, inline: true },
      { name: "Memoria", value: `${mem} MB`, inline: true },
      { name: "Guilds", value: `${itx.client.guilds.cache.size}`, inline: true }
    )
    .setColor(0x5865f2)
    .setTimestamp();

  await itx.editReply({ embeds: [embed] });
}

