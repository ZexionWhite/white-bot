/**
 * Definiciones de comandos slash para música
 */
import { SlashCommandBuilder } from "discord.js";
import { getLocaleForGuildId, t } from "../../core/i18n/index.js";

export const musicSlashCommands = [
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play music from a URL or search")
    .addStringOption(o => 
      o.setName("query")
       .setDescription("YouTube/Spotify URL or search term")
       .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Show the playback queue")
    .addIntegerOption(o =>
      o.setName("page")
       .setDescription("Page number (optional)")
       .setMinValue(1)
    ),

  new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Show the currently playing song"),

  new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the current song or multiple songs")
    .addIntegerOption(o =>
      o.setName("amount")
       .setDescription("Number of songs to skip (optional, default 1)")
       .setMinValue(1)
    ),

  new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop playback and clear the queue"),

  new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pause playback"),

  new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Resume playback"),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Clear the playback queue"),

  new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Set the loop mode")
    .addStringOption(o =>
      o.setName("mode")
       .setDescription("Mode: off, track or queue")
       .setRequired(true)
       .addChoices(
         { name: "Off", value: "off" },
         { name: "Track", value: "track" },
         { name: "Queue", value: "queue" }
       )
    ),

  new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Shuffle the playback queue"),

  new SlashCommandBuilder()
    .setName("autoplay")
    .setDescription("Enable or disable autoplay")
    .addStringOption(o =>
      o.setName("state")
       .setDescription("on or off")
       .setRequired(true)
       .addChoices(
         { name: "On", value: "on" },
         { name: "Off", value: "off" }
       )
    ),

  new SlashCommandBuilder()
    .setName("dj")
    .setDescription("Manage the DJ role")
    .addSubcommand(sc =>
      sc.setName("setrole")
       .setDescription("Set the DJ role")
       .addRoleOption(o =>
         o.setName("role")
          .setDescription("Role to set as DJ")
          .setRequired(true)
       )
    )
    .addSubcommand(sc =>
      sc.setName("clearrole")
       .setDescription("Clear the DJ role")
    )
    .addSubcommand(sc =>
      sc.setName("view")
       .setDescription("Show the current DJ role")
    )
];
