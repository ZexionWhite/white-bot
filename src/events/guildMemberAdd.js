import { welcomeEmbed, logJoinEmbed } from "../utils/embeds.js";
import { getSettings, getCooldown, setCooldown } from "../db.js";

export default async function guildMemberAdd(client, member) {
  // if (member.pending) return; // si usás screening y querés esperar verificación

  const cfg = getSettings.get(member.guild.id);
  if (!cfg) return;

  // --- COOLdOWN SOLO PARA EL MENSAJE PÚBLICO ---
  const cdMin = Number.isFinite(cfg.welcome_cd_minutes) ? cfg.welcome_cd_minutes : 60;
  const last = (getCooldown.get(member.guild.id, member.id, "welcome") || {}).last_ts ?? 0;
  const now = Date.now();
  const canSendWelcome = now - last >= cdMin * 60_000;

  // mensaje público de bienvenida (si no está en cooldown)
  if (cfg.welcome_channel_id && canSendWelcome) {
    const ch = await member.guild.channels.fetch(cfg.welcome_channel_id).catch(() => null);
    if (ch?.isTextBased()) {
      const content = `¡Bienvenido/a <@${member.id}>!`;
      await ch.send({ content, embeds: [welcomeEmbed(member)] }).catch(() => {});
      try { setCooldown.run(member.guild.id, member.id, "welcome", now); } catch {}
    }
  }

  // log para admins (siempre, SIN cooldown)
  if (cfg.log_channel_id) {
    const log = await member.guild.channels.fetch(cfg.log_channel_id).catch(() => null);
    if (log?.isTextBased()) {
      await log.send({ embeds: [logJoinEmbed(member)] }).catch(() => {});
    }
  }
}
