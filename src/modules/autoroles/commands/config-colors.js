import { PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getColorRoles, insertColorRole } from "../../../db.js";
import { EMOJIS } from "../../../config/emojis.js";

export async function handle(itx) {
  if (!itx.memberPermissions.has(PermissionFlagsBits.ManageRoles)) {
    return itx.reply({ content: "Sin permisos.", ephemeral: true });
  }

  await itx.deferReply({ ephemeral: true });

  const colors = await getColorRoles.all(itx.guild.id);
  if (!colors.length) {
    return itx.editReply({ content: "No hay roles de color. Utiliza /setupcolors primero." });
  }

  // Ordenar colores alfabéticamente
  const sortedColors = colors.sort((a, b) => a.name.localeCompare(b.name));

  const options = sortedColors.map(c => ({
    label: c.name,
    value: c.role_id,
    description: c.booster_only === 1 ? "Premium (solo boosters)" : "Free (todos)"
  }));

  // Dividir en múltiples select menus si hay más de 25 colores
  const menus = [];
  for (let i = 0; i < options.length; i += 25) {
    const menuOptions = options.slice(i, i + 25);
    const menu = new StringSelectMenuBuilder()
      .setCustomId("config-color-select")
      .setPlaceholder(i === 0 ? "Selecciona un color para configurar" : `Más colores (${i + 1}-${Math.min(i + 25, options.length)})`)
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(menuOptions);
    menus.push(new ActionRowBuilder().addComponents(menu));
  }

  const embed = new EmbedBuilder()
    .setTitle(`${EMOJIS.UTILS.CONFIG} Configurar Colores Premium`)
    .setDescription([
      "Selecciona un color del menú para cambiar su estado:",
      "",
      "• **Free**: Disponible para todos",
      "• **Premium**: Solo disponible para boosters",
      "",
      `**Total de colores:** ${colors.length}`
    ].join("\n"))
    .setColor(0x5865f2);

  return itx.editReply({ embeds: [embed], components: menus });
}

export async function handleColorSelect(itx, selectedRoleId) {
  await itx.deferUpdate();

  const colors = await getColorRoles.all(itx.guild.id);
  const selectedColor = colors.find(c => c.role_id === selectedRoleId);
  
  if (!selectedColor) {
    return itx.editReply({ content: `${EMOJIS.LOGS.MESSAGE_DELETED} Color no encontrado.`, components: [] });
  }

  const isCurrentlyPremium = selectedColor.booster_only === 1;

  // Crear botones para elegir el estado
  const freeButton = new ButtonBuilder()
    .setCustomId(`config-color-free:${selectedRoleId}`)
    .setLabel("Free")
    .setStyle(isCurrentlyPremium ? ButtonStyle.Secondary : ButtonStyle.Success)
    .setEmoji("🆓");

  const premiumButton = new ButtonBuilder()
    .setCustomId(`config-color-premium:${selectedRoleId}`)
    .setLabel("Premium")
    .setStyle(isCurrentlyPremium ? ButtonStyle.Success : ButtonStyle.Secondary)
    .setEmoji(EMOJIS.BOOST.BOOSTER);

  const backButton = new ButtonBuilder()
    .setCustomId("config-color-back")
    .setLabel("Volver")
    .setStyle(ButtonStyle.Danger);

  const buttons = new ActionRowBuilder()
    .addComponents(freeButton, premiumButton, backButton);

  const embed = new EmbedBuilder()
    .setTitle(`${EMOJIS.UTILS.CONFIG} Configurar Color`)
    .setDescription([
      `**Color seleccionado:** ${selectedColor.name}`,
      `**Estado actual:** ${isCurrentlyPremium ? "Premium (solo boosters)" : "Free (todos)"}`,
      "",
      "Selecciona el estado que deseas asignar:",
      "",
      "• **Free**: Disponible para todos",
      "• **Premium**: Solo disponible para boosters"
    ].join("\n"))
    .setColor(isCurrentlyPremium ? 0xf1c40f : 0x2ecc71);

  return itx.editReply({ embeds: [embed], components: [buttons] });
}

export async function handleColorStatusChange(itx, selectedRoleId, newStatus) {
  await itx.deferUpdate();

  const colors = await getColorRoles.all(itx.guild.id);
  const selectedColor = colors.find(c => c.role_id === selectedRoleId);
  
  if (!selectedColor) {
    return itx.editReply({ content: `${EMOJIS.LOGS.MESSAGE_DELETED} Color no encontrado.`, components: [] });
  }

  // Actualizar en base de datos
  await insertColorRole.run(
    itx.guild.id,
    selectedColor.role_id,
    selectedColor.name,
    selectedColor.hex,
    newStatus ? 1 : 0
  );

  const statusText = newStatus ? "**Premium** (solo boosters)" : "**Free** (todos)";
  const statusEmoji = newStatus ? EMOJIS.BOOST.BOOSTER : "🆓";

  const embed = new EmbedBuilder()
    .setTitle(`${EMOJIS.BOOST.BOOSTER} Color actualizado`)
    .setDescription([
      `**${selectedColor.name}** ahora es ${statusText} ${statusEmoji}`,
      "",
      "Utiliza /config-colors nuevamente para configurar más colores."
    ].join("\n"))
    .setColor(newStatus ? 0xf1c40f : 0x2ecc71);

  return itx.editReply({ embeds: [embed], components: [] });
}

export async function handleBack(itx) {
  await itx.deferUpdate();

  const colors = await getColorRoles.all(itx.guild.id);
  if (!colors.length) {
    return itx.editReply({ content: "No hay roles de color. Utiliza /setupcolors primero.", components: [] });
  }

  // Ordenar colores alfabéticamente
  const sortedColors = colors.sort((a, b) => a.name.localeCompare(b.name));

  const options = sortedColors.map(c => ({
    label: c.name,
    value: c.role_id,
    description: c.booster_only === 1 ? "Premium (solo boosters)" : "Free (todos)"
  }));

  // Dividir en múltiples select menus si hay más de 25 colores
  const menus = [];
  for (let i = 0; i < options.length; i += 25) {
    const menuOptions = options.slice(i, i + 25);
    const menu = new StringSelectMenuBuilder()
      .setCustomId("config-color-select")
      .setPlaceholder(i === 0 ? "Selecciona un color para configurar" : `Más colores (${i + 1}-${Math.min(i + 25, options.length)})`)
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(menuOptions);
    menus.push(new ActionRowBuilder().addComponents(menu));
  }

  const embed = new EmbedBuilder()
    .setTitle(`${EMOJIS.UTILS.CONFIG} Configurar Colores Premium`)
    .setDescription([
      "Selecciona un color del menú para cambiar su estado:",
      "",
      "• **Free**: Disponible para todos",
      "• **Premium**: Solo disponible para boosters",
      "",
      `**Total de colores:** ${colors.length}`
    ].join("\n"))
    .setColor(0x5865f2);

  return itx.editReply({ embeds: [embed], components: menus });
}
