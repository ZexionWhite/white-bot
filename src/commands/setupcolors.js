import { PermissionFlagsBits } from "discord.js";
import { DEFAULT_COLORS } from "../config.js";
import { insertColorRole, getColorRoles } from "../db.js";
import { hexToInt } from "../utils/colors.js";

export default async function setupcolors(itx) {
  if (!itx.memberPermissions.has(PermissionFlagsBits.ManageRoles))
    return itx.reply({ content: "Sin permisos.", ephemeral: true });

  await itx.deferReply({ ephemeral: true });

  const boosterOnlyNames = new Set(["Rosa", "Blanco", "Negro", "Violeta", "Verde", "Gris" ]);

  const created = [];
  for (const c of DEFAULT_COLORS) {
    let role = itx.guild.roles.cache.find(r => r.name === c.name);
    if (!role) {
      try {
        role = await itx.guild.roles.create({
          name: c.name,
          color: hexToInt(c.hex),
          mentionable: false,
          reason: "Setup colores autoroles"
        });
      } catch {
        continue;
      }
    }

    insertColorRole.run(
      itx.guild.id,
      role.id,
      c.name,
      c.hex,
      boosterOnlyNames.has(c.name) ? 1 : 0
    );
    created.push(`@${role.name}${boosterOnlyNames.has(c.name) ? " (Booster)" : ""}`);
  }

  return itx.editReply({ content: `Listo. Roles de color registrados:\n- ${created.join("\n- ")}` });
}
