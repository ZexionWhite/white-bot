import { PermissionFlagsBits, EmbedBuilder } from "discord.js";
import * as PolicyRepo from "../../moderation/db/policy.repo.js";
import { createSuccessEmbed, createErrorEmbed } from "../../moderation/ui/embeds.js";
import { MODULES, MODULE_NAMES, COMMAND_TO_MODULE, getModuleCommands, getAllModules } from "../../moderation/services/modules.service.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "This command only works in servers.", ephemeral: true });
  }

  if (!itx.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return itx.reply({ embeds: [createErrorEmbed("You need the 'Manage Server' permission")], ephemeral: true });
  }

  const subcommand = itx.options.getSubcommand();

  switch (subcommand) {
    case "view":
      return await handleView(itx);
    case "module":
      return await handleModule(itx);
    case "command":
      return await handleCommand(itx);
    case "reset":
      return await handleReset(itx);
    default:
      return itx.reply({ embeds: [createErrorEmbed("Unknown subcommand")], ephemeral: true });
  }
}

async function handleView(itx) {
  const type = itx.options.getString("type") || "all";
  const user = itx.options.getUser("user");
  const role = itx.options.getRole("role");

  if (type === "user" && !user) {
    return itx.reply({ embeds: [createErrorEmbed("Please specify a user")], ephemeral: true });
  }

  if (type === "role" && !role) {
    return itx.reply({ embeds: [createErrorEmbed("Please specify a role")], ephemeral: true });
  }

  let policies = [];

  if (type === "user" && user) {
    policies = PolicyRepo.getAllPoliciesBySubject.all(itx.guild.id, "USER", user.id);
  } else if (type === "role" && role) {
    policies = PolicyRepo.getAllPoliciesBySubject.all(itx.guild.id, "ROLE", role.id);
  } else {
    // Get all policies for the guild (simplified - would need a new query for all)
    // For now, show a message explaining how to view specific policies
    return itx.reply({
      embeds: [new EmbedBuilder()
        .setTitle("Permission Policies")
        .setDescription("Use `/modconfig view user @user` or `/modconfig view role @role` to view specific policies.\n\nOr use `/user @user` and check the Permissions/Overrides section.")
        .setColor(0x5865f2)
      ],
      ephemeral: true
    });
  }

  if (policies.length === 0) {
    const target = user ? user.tag : role.name;
    return itx.reply({
      embeds: [new EmbedBuilder()
        .setTitle("Permission Policies")
        .setDescription(`No permission overrides configured for ${target}`)
        .setColor(0x5865f2)
      ],
      ephemeral: true
    });
  }

  // Group by module and command
  const modulePolicies = policies.filter(p => getAllModules().includes(p.command_key));
  const commandPolicies = policies.filter(p => !getAllModules().includes(p.command_key));

  const embed = new EmbedBuilder()
    .setTitle(`Permission Policies - ${user ? user.tag : role.name}`)
    .setColor(0x5865f2)
    .setTimestamp();

  if (modulePolicies.length > 0) {
    const allowedModules = modulePolicies.filter(p => p.effect === "ALLOW").map(p => MODULE_NAMES[p.command_key] || p.command_key);
    const deniedModules = modulePolicies.filter(p => p.effect === "DENY").map(p => MODULE_NAMES[p.command_key] || p.command_key);

    if (allowedModules.length > 0) {
      embed.addFields({ name: "✅ Allowed Modules", value: allowedModules.join(", ") || "None", inline: false });
    }
    if (deniedModules.length > 0) {
      embed.addFields({ name: "❌ Denied Modules", value: deniedModules.join(", ") || "None", inline: false });
    }
  }

  if (commandPolicies.length > 0) {
    const allowedCommands = commandPolicies.filter(p => p.effect === "ALLOW").map(p => p.command_key);
    const deniedCommands = commandPolicies.filter(p => p.effect === "DENY").map(p => p.command_key);

    if (allowedCommands.length > 0) {
      embed.addFields({ name: "✅ Allowed Commands", value: allowedCommands.join(", ") || "None", inline: false });
    }
    if (deniedCommands.length > 0) {
      embed.addFields({ name: "❌ Denied Commands", value: deniedCommands.join(", ") || "None", inline: false });
    }
  }

  return itx.reply({ embeds: [embed], ephemeral: true });
}

async function handleModule(itx) {
  const module = itx.options.getString("module", true);
  const effect = itx.options.getString("effect", true);
  const user = itx.options.getUser("user");
  const role = itx.options.getRole("role");

  if (!user && !role) {
    return itx.reply({ embeds: [createErrorEmbed("Please specify either a user or a role")], ephemeral: true });
  }

  if (user && role) {
    return itx.reply({ embeds: [createErrorEmbed("Please specify either a user OR a role, not both")], ephemeral: true });
  }

  const subjectType = user ? "USER" : "ROLE";
  const subjectId = user ? user.id : role.id;
  const subjectName = user ? user.tag : role.name;

  if (effect === "RESET") {
    PolicyRepo.deletePolicy.run(itx.guild.id, module, subjectType, subjectId);
    return itx.reply({
      embeds: [createSuccessEmbed(`Module policy reset for ${MODULE_NAMES[module]} → ${subjectName}`)]
    });
  }

  PolicyRepo.createPolicy.run(
    itx.guild.id,
    module,
    subjectType,
    subjectId,
    effect,
    Date.now(),
    itx.user.id
  );

  const effectEmoji = effect === "ALLOW" ? "✅" : "❌";
  return itx.reply({
    embeds: [createSuccessEmbed(`${effectEmoji} ${effect} permission for module **${MODULE_NAMES[module]}** → ${subjectName}`)]
  });
}

async function handleCommand(itx) {
  const commandKey = itx.options.getString("command", true);
  const effect = itx.options.getString("effect", true);
  const user = itx.options.getUser("user");
  const role = itx.options.getRole("role");

  if (!user && !role) {
    return itx.reply({ embeds: [createErrorEmbed("Please specify either a user or a role")], ephemeral: true });
  }

  if (user && role) {
    return itx.reply({ embeds: [createErrorEmbed("Please specify either a user OR a role, not both")], ephemeral: true });
  }

  // Validate command exists
  if (!COMMAND_TO_MODULE[commandKey]) {
    return itx.reply({ embeds: [createErrorEmbed(`Unknown command: ${commandKey}`)], ephemeral: true });
  }

  const subjectType = user ? "USER" : "ROLE";
  const subjectId = user ? user.id : role.id;
  const subjectName = user ? user.tag : role.name;

  if (effect === "RESET") {
    PolicyRepo.deletePolicy.run(itx.guild.id, commandKey, subjectType, subjectId);
    return itx.reply({
      embeds: [createSuccessEmbed(`Command policy reset for \`${commandKey}\` → ${subjectName}`)]
    });
  }

  PolicyRepo.createPolicy.run(
    itx.guild.id,
    commandKey,
    subjectType,
    subjectId,
    effect,
    Date.now(),
    itx.user.id
  );

  const effectEmoji = effect === "ALLOW" ? "✅" : "❌";
  return itx.reply({
    embeds: [createSuccessEmbed(`${effectEmoji} ${effect} permission for command \`${commandKey}\` → ${subjectName}`)]
  });
}

async function handleReset(itx) {
  const confirm = itx.options.getBoolean("confirm", true);

  if (!confirm) {
    return itx.reply({
      embeds: [createErrorEmbed("Please confirm by setting the `confirm` option to `true`")]
    });
  }

  // Delete all policies for this guild
  PolicyRepo.deleteAllPolicies.run(itx.guild.id);

  return itx.reply({
    embeds: [createSuccessEmbed("All permission policies have been reset for this server")]
  });
}

// Autocomplete handler for command option
export async function handleAutocomplete(itx) {
  const focused = itx.options.getFocused(true);
  
  if (focused.name === "command") {
    const query = focused.value.toLowerCase();
    const commands = Object.keys(COMMAND_TO_MODULE)
      .filter(cmd => cmd.toLowerCase().includes(query))
      .slice(0, 25)
      .map(cmd => ({
        name: cmd,
        value: cmd
      }));

    return itx.respond(commands);
  }

  return itx.respond([]);
}