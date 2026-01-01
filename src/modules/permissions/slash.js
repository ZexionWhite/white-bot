import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { MODULES, MODULE_NAMES } from "../moderation/services/modules.service.js";

const moduleChoices = Object.values(MODULES).map(module => ({
  name: MODULE_NAMES[module],
  value: module
}));

export const permissionsSlashCommands = [
  new SlashCommandBuilder()
    .setName("modconfig")
    .setDescription("Configure command and module permissions")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sc =>
      sc.setName("view")
        .setDescription("View current permission policies")
        .addStringOption(o => o.setName("type").setDescription("What to view").addChoices(
          { name: "All policies", value: "all" },
          { name: "By user", value: "user" },
          { name: "By role", value: "role" }
        ))
        .addUserOption(o => o.setName("user").setDescription("User to view policies for"))
        .addRoleOption(o => o.setName("role").setDescription("Role to view policies for"))
    )
    .addSubcommand(sc =>
      sc.setName("module")
        .setDescription("Configure permissions for an entire module")
        .addStringOption(o => o.setName("module").setDescription("Module to configure").setRequired(true).addChoices(...moduleChoices))
        .addStringOption(o => o.setName("effect").setDescription("Permission effect").setRequired(true).addChoices(
          { name: "Allow", value: "ALLOW" },
          { name: "Deny", value: "DENY" },
          { name: "Reset", value: "RESET" }
        ))
        .addUserOption(o => o.setName("user").setDescription("User to apply to"))
        .addRoleOption(o => o.setName("role").setDescription("Role to apply to"))
    )
    .addSubcommand(sc =>
      sc.setName("command")
        .setDescription("Configure permissions for a specific command")
        .addStringOption(o => o.setName("command").setDescription("Command name").setRequired(true).setAutocomplete(true))
        .addStringOption(o => o.setName("effect").setDescription("Permission effect").setRequired(true).addChoices(
          { name: "Allow", value: "ALLOW" },
          { name: "Deny", value: "DENY" },
          { name: "Reset", value: "RESET" }
        ))
        .addUserOption(o => o.setName("user").setDescription("User to apply to"))
        .addRoleOption(o => o.setName("role").setDescription("Role to apply to"))
    )
    .addSubcommand(sc =>
      sc.setName("reset")
        .setDescription("Reset all permission policies")
        .addBooleanOption(o => o.setName("confirm").setDescription("Confirm reset").setRequired(true))
    )
];

