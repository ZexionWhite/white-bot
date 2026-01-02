import { PermissionFlagsBits } from "discord.js";
import { DEFAULT_COLORS } from "../../../config.js";
import { insertColorRole } from "../../../db.js";
import { hexToInt } from "../../../utils/colors.js";

export async function handle(itx) {
  if (!itx.memberPermissions.has(PermissionFlagsBits.ManageRoles)) {
    return itx.reply({ content: "Sin permisos.", ephemeral: true });
  }

  await itx.deferReply({ ephemeral: true });

  const guild = itx.guild;
  let created = 0;
  let updated = 0;
  const errors = [];

  for (const color of DEFAULT_COLORS) {
    try {
      // Buscar si ya existe un rol con ese nombre
      let role = guild.roles.cache.find(r => r.name === color.name);
      
      if (!role) {
        // Crear nuevo rol
        role = await guild.roles.create({
          name: color.name,
          color: hexToInt(color.hex),
          mentionable: false,
          hoist: false
        });
        created++;
      } else {
        // Actualizar color si es diferente
        if (role.color !== hexToInt(color.hex)) {
          await role.setColor(hexToInt(color.hex));
        }
        updated++;
      }

      // Guardar en BD (booster_only se puede configurar después, por ahora todos son false)
      await insertColorRole.run(guild.id, role.id, color.name, color.hex, 0);
    } catch (error) {
      errors.push(`${color.name}: ${error.message}`);
    }
  }

  let response = `✅ **Roles de colores configurados**\n`;
  response += `• Creados: ${created}\n`;
  response += `• Actualizados: ${updated}\n`;
  
  if (errors.length > 0) {
    response += `\n⚠️ Errores (${errors.length}):\n${errors.slice(0, 5).join("\n")}`;
    if (errors.length > 5) {
      response += `\n... y ${errors.length - 5} más`;
    }
  }

  return itx.editReply({ content: response });
}
