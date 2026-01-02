import * as setupColors from "./commands/setup-colors.js";
import * as colorMenu from "./commands/color-menu.js";
import * as configColors from "./commands/config-colors.js";

export const autorolesHandlers = {
  setupcolors: setupColors.handle,
  "color-menu": colorMenu.handle,
  "config-colors": configColors.handle
};

// Handler para el componente color-select
export async function handleColorSelect(itx, customId) {
  await itx.deferReply({ ephemeral: true });

  const { getSettings, getColorRoles } = await import("../../db.js");

  const cfg = await getSettings.get(itx.guild.id);
  const all = await getColorRoles.all(itx.guild.id);

  const selectedId = itx.values[0];
  const chosen = all.find(r => r.role_id === selectedId);
  if (!chosen) return itx.editReply({ content: "Opción inválida." });

  const member = await itx.guild.members.fetch(itx.user.id);

  const togglingOff = member.roles.cache.has(selectedId);

  if (!togglingOff && chosen.booster_only) {
    const boosterRoleId = cfg?.booster_role_id;
    const hasBooster = boosterRoleId ? member.roles.cache.has(boosterRoleId) : false;
    if (!hasBooster) return itx.editReply({ content: "Este color es solo para boosters." });
  }

  const paletteIds = new Set(all.map(r => r.role_id));
  const toRemove = member.roles.cache.filter(r => paletteIds.has(r.id) && r.id !== selectedId);

  try {
    await (
      togglingOff
        ? member.roles.remove(selectedId)
        : (async () => {
            if (toRemove.size) await member.roles.remove([...toRemove.keys()]);
            await member.roles.add(selectedId);
          })()
    );

    return itx.editReply({ content: togglingOff ? "Color quitado ✅" : "Color aplicado ✅" });
  } catch {
    return itx.editReply({ content: "No pude cambiar el rol. Revisá permisos/jerarquía del bot." });
  }
}

export async function handleConfigColorSelect(itx) {
  const selectedRoleId = itx.values[0];
  const { handleColorSelect } = await import("./commands/config-colors.js");
  return handleColorSelect(itx, selectedRoleId);
}

export const autorolesComponentHandlers = {
  "color-select": handleColorSelect,
  "config-color-select": handleConfigColorSelect
};
