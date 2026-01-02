import { welcomeEmbed, logJoinEmbed } from "../modules/settings/ui/welcome.js";
import { getSettings, getCooldown, setCooldown } from "../db.js";

export default async function guildMemberAdd(client, member) {
  try {
    const cfg = getSettings.get(member.guild.id);
    if (!cfg) {
      console.log(`[guildMemberAdd] Servidor ${member.guild.name} (${member.guild.id}) no tiene configuración`);
      return;
    }

    const cdMin = Number.isFinite(cfg.welcome_cd_minutes) ? cfg.welcome_cd_minutes : 60;
    const last = (getCooldown.get(member.guild.id, member.id, "welcome") || {}).last_ts ?? 0;
    const now = Date.now();
    const canSendWelcome = now - last >= cdMin * 60_000;

    if (cfg.welcome_channel_id && canSendWelcome) {
      const ch = await member.guild.channels.fetch(cfg.welcome_channel_id).catch((err) => {
        console.error(`[guildMemberAdd] Error al obtener canal de bienvenida ${cfg.welcome_channel_id} en ${member.guild.name}:`, err.message);
        return null;
      });
      if (ch?.isTextBased()) {
        const content = `¡Bienvenido/a <@${member.id}>!`;
        await ch.send({ content, embeds: [welcomeEmbed(member)] }).catch((err) => {
          console.error(`[guildMemberAdd] Error al enviar mensaje de bienvenida en ${member.guild.name}:`, err.message);
        });
        try { 
          setCooldown.run(member.guild.id, member.id, "welcome", now); 
          console.log(`[guildMemberAdd] Welcome enviado a ${member.user.tag} en ${member.guild.name}`);
        } catch (err) {
          console.error(`[guildMemberAdd] Error al guardar cooldown:`, err.message);
        }
      }
    } else if (cfg.welcome_channel_id && !canSendWelcome) {
      console.log(`[guildMemberAdd] Welcome en cooldown para ${member.user.tag} en ${member.guild.name}`);
    }

    if (cfg.log_channel_id) {
      const log = await member.guild.channels.fetch(cfg.log_channel_id).catch((err) => {
        console.error(`[guildMemberAdd] Error al obtener canal de logs ${cfg.log_channel_id} en ${member.guild.name}:`, err.message);
        return null;
      });
      if (log?.isTextBased()) {
        await log.send({ embeds: [logJoinEmbed(member)] }).catch((err) => {
          console.error(`[guildMemberAdd] Error al enviar log de join en ${member.guild.name}:`, err.message);
        });
      }
    }
  } catch (error) {
    console.error(`[guildMemberAdd] Error inesperado en ${member.guild?.name || "unknown"}:`, error.message);
  }
}
