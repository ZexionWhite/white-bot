import * as CasesService from "../services/cases.service.js";
import * as SettingsRepo from "../db/settings.repo.js";
import * as CasesRepo from "../db/cases.repo.js";
import { createModlogEmbed } from "../ui/embeds.js";

export function startTempbanScheduler(client) {
  console.log("[SanctionScheduler] Iniciando scheduler de sanciones temporales...");

  setInterval(async () => {
    const now = Date.now();

    for (const guild of client.guilds.cache.values()) {
      try {
        // Check tempbans
        const expiredTempbans = await CasesRepo.getActiveTempbans.all(guild.id, now);
        for (const case_ of expiredTempbans) {
          try {
            await guild.bans.remove(case_.target_id, "Tempban expired automatically");
            await CasesService.deactivateCase(guild.id, case_.id);
            
            const autoCase = await CasesService.createCase(
              guild.id,
              "UNBAN",
              case_.target_id,
              client.user.id,
              "Tempban expired automatically"
            );

            // Send to modlog
            const settings = await SettingsRepo.getGuildSettings(guild.id);
            if (settings.modlog_channel_id) {
              const modlogChannel = await guild.channels.fetch(settings.modlog_channel_id).catch(() => null);
              if (modlogChannel) {
                const target = await client.users.fetch(case_.target_id).catch(() => ({ id: case_.target_id }));
                const embed = createModlogEmbed(autoCase, target, client.user);
                await modlogChannel.send({ embeds: [embed] });
              }
            }

            console.log(`[SanctionScheduler] Tempban expired for ${case_.target_id} in ${guild.name}`);
          } catch (error) {
            console.error(`[SanctionScheduler] Error unbanning ${case_.target_id}:`, error.message);
          }
        }

        // Check expired mutes
        const expiredMutes = await CasesRepo.getActiveMutes.all(guild.id, now);
        for (const case_ of expiredMutes) {
          try {
            const settings = await SettingsRepo.getGuildSettings(guild.id);
            if (settings.mute_role_id) {
              const muteRole = await guild.roles.fetch(settings.mute_role_id).catch(() => null);
              if (muteRole) {
                const targetMember = await guild.members.fetch(case_.target_id).catch(() => null);
                if (targetMember && targetMember.roles.cache.has(muteRole.id)) {
                  await targetMember.roles.remove(muteRole, "Mute expired automatically");
                }
              }
            }
            
            await CasesService.deactivateCase(guild.id, case_.id);
            
            const autoCase = await CasesService.createCase(
              guild.id,
              "UNMUTE",
              case_.target_id,
              client.user.id,
              "Mute expired automatically"
            );

            // Send to modlog
            if (settings.modlog_channel_id) {
              const modlogChannel = await guild.channels.fetch(settings.modlog_channel_id).catch(() => null);
              if (modlogChannel) {
                const target = await client.users.fetch(case_.target_id).catch(() => ({ id: case_.target_id }));
                const embed = createModlogEmbed(autoCase, target, client.user);
                await modlogChannel.send({ embeds: [embed] });
              }
            }

            console.log(`[SanctionScheduler] Mute expired for ${case_.target_id} in ${guild.name}`);
          } catch (error) {
            console.error(`[SanctionScheduler] Error unmuting ${case_.target_id}:`, error.message);
          }
        }

        // Check expired timeouts
        const expiredTimeouts = await CasesRepo.getActiveTimeouts.all(guild.id, now);
        for (const case_ of expiredTimeouts) {
          try {
            const targetMember = await guild.members.fetch(case_.target_id).catch(() => null);
            // Discord handles timeout expiration automatically, but we verify and create case
            if (targetMember && targetMember.communicationDisabledUntil) {
              const disabledUntil = targetMember.communicationDisabledUntil.getTime();
              // If timeout hasn't been manually removed and should have expired
              if (disabledUntil <= now) {
                // Timeout should have expired, but Discord might still show it
                // We'll just create the case and deactivate
              }
            }
            
            await CasesService.deactivateCase(guild.id, case_.id);
            
            const autoCase = await CasesService.createCase(
              guild.id,
              "UNTIMEOUT",
              case_.target_id,
              client.user.id,
              "Timeout expired automatically"
            );

            // Send to modlog
            const settings = await SettingsRepo.getGuildSettings(guild.id);
            if (settings.modlog_channel_id) {
              const modlogChannel = await guild.channels.fetch(settings.modlog_channel_id).catch(() => null);
              if (modlogChannel) {
                const target = await client.users.fetch(case_.target_id).catch(() => ({ id: case_.target_id }));
                const embed = createModlogEmbed(autoCase, target, client.user);
                await modlogChannel.send({ embeds: [embed] });
              }
            }

            console.log(`[SanctionScheduler] Timeout expired for ${case_.target_id} in ${guild.name}`);
          } catch (error) {
            console.error(`[SanctionScheduler] Error processing timeout expiration for ${case_.target_id}:`, error.message);
          }
        }
      } catch (error) {
        console.error(`[SanctionScheduler] Error processing guild ${guild.id}:`, error.message);
      }
    }
  }, 60 * 1000);

  console.log("[SanctionScheduler] Scheduler started (check every 60s)");
}
