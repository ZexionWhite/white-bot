import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";

export const moderationSlashCommands = [
  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a user")
    .addUserOption(o => o.setName("user").setDescription("User to warn").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mute a user")
    .addUserOption(o => o.setName("user").setDescription("User to mute").setRequired(true))
    .addStringOption(o => o.setName("duration").setDescription("Duration (e.g: 10m, 2h, 3d)")),
  
  new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Unmute a user")
    .addUserOption(o => o.setName("user").setDescription("User to unmute").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a user")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addStringOption(o => o.setName("duration").setDescription("Duration (e.g: 10m, 2h, 3d)").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Remove timeout from a user")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user")
    .addUserOption(o => o.setName("user").setDescription("User to kick").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user")
    .addUserOption(o => o.setName("user").setDescription("User to ban").setRequired(true))
    .addIntegerOption(o => o.setName("deletedays").setDescription("Days of messages to delete (0-7)").setMinValue(0).setMaxValue(7)),
  
  new SlashCommandBuilder()
    .setName("tempban")
    .setDescription("Temporarily ban a user")
    .addUserOption(o => o.setName("user").setDescription("User to ban").setRequired(true))
    .addStringOption(o => o.setName("duration").setDescription("Duration (e.g: 10m, 2h, 3d)").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("softban")
    .setDescription("Softban a user (ban and unban immediately)")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addIntegerOption(o => o.setName("deletedays").setDescription("Days of messages to delete (0-7)").setMinValue(0).setMaxValue(7)),
  
  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user")
    .addStringOption(o => o.setName("user").setDescription("User ID").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("history")
    .setDescription("View a user's moderation history")
    .addUserOption(o => o.setName("user").setDescription("User to view history for").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("case")
    .setDescription("View details of a moderation case")
    .addIntegerOption(o => o.setName("id").setDescription("Case ID").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("editcase")
    .setDescription("Edit a moderation case")
    .addIntegerOption(o => o.setName("id").setDescription("Case ID to edit").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove a moderation case")
    .addIntegerOption(o => o.setName("id").setDescription("Case ID to remove").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason for removal")),
  
  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Delete multiple messages from a channel")
    .addIntegerOption(o => o.setName("amount").setDescription("Number of messages to delete").setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o => o.setName("user").setDescription("Specific user to delete messages from (optional)")),
  
  new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock a text channel")
    .addChannelOption(o => o.setName("channel").setDescription("Channel to lock"))
    .addStringOption(o => o.setName("reason").setDescription("Reason for locking")),
  
  new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock a text channel")
    .addChannelOption(o => o.setName("channel").setDescription("Channel to unlock"))
    .addStringOption(o => o.setName("reason").setDescription("Reason for unlocking")),
  
  new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Set slowmode rate limit for a channel")
    .addIntegerOption(o => o.setName("seconds").setDescription("Slowmode delay in seconds").setRequired(true).setMinValue(0).setMaxValue(21600))
    .addChannelOption(o => o.setName("channel").setDescription("Channel to set slowmode for")),
  
  new SlashCommandBuilder()
    .setName("createmuterole")
    .setDescription("Create and configure a mute role for this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  new SlashCommandBuilder()
    .setName("setmuterole")
    .setDescription("Set an existing role as the mute role")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addRoleOption(o => o.setName("role").setDescription("Role to use for muting").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("setmodlog")
    .setDescription("Set the moderation log channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(o => o.setName("channel").setDescription("Channel for moderation logs").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("voice-mod")
    .setDescription("Moderate users in voice channels")
    .addSubcommand(sc =>
      sc.setName("channel")
       .setDescription("Moderate all users in a voice channel")
       .addChannelOption(o =>
         o.setName("channel")
          .setDescription("Voice channel to moderate (optional, uses current channel if not specified)")
          .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
       )
    )
    .addSubcommand(sc =>
      sc.setName("user")
       .setDescription("Moderate a specific user in voice")
       .addUserOption(o =>
         o.setName("user")
          .setDescription("User to moderate")
          .setRequired(true)
       )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers | PermissionFlagsBits.MoveMembers)
];

