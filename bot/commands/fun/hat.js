const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const logger = require('../../tools/logger');
const { ensureHouseRoles } = require('../../tools/ensureHouseRoles');

// Texto/estética por casa
const HOUSE_META = {
  gryffindor: { display: 'GRYFFINDOR',  quote: '“donde habitan los valientes”',    color: '#AE0001', thumb: null },
  slytherin:  { display: 'SLYTHERIN',   quote: '“cautelosos y ambiciosos”',         color: '#2A623D', thumb: null },
  ravenclaw:  { display: 'RAVENCLAW',   quote: '“ingenio e inteligencia”',          color: '#0E1A40', thumb: null },
  hufflepuff: { display: 'HUFFLEPUFF',  quote: '“donde son justos y leales”',       color: '#FFD800', thumb: null }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hat')
    .setDescription('🎩 El Sombrero Seleccionador: asegura roles y, con suerte, te asigna una casa'),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    try {
      // Asegurar/crear roles de casas
      const { roles, created } = await ensureHouseRoles(interaction.guild, { enforceColor: true });

      if (created.length > 0) {
        const createdNames = created.map(k => roles[k].name).join(', ');
        await interaction.reply({
          content: `🧪 Setup inicial completado. Roles creados: **${createdNames}**.\nVuelve a usar \`/hat\` para intentar ser seleccionado`,
          flags: 64
        });
        return;
      }

      // Inmutabilidad: si ya tienes una casa, no se cambia
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const houseKeys = /** @type {const} */ (['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff']);
      const owned = houseKeys.filter(k => member.roles.cache.has(roles[k].id));

      if (owned.length > 0) {
        const current = roles[owned[0]];
        await interaction.reply({
          content: `🛑 Ya has sido seleccionado: **${current.name}**. El Sombrero no cambia de opinión`,
          flags: 64
        });
        return;
      }

      // Elegir casa aleatoria
      const pickedKey = houseKeys[Math.floor(Math.random() * houseKeys.length)];
      const pickedRole = roles[pickedKey];

      // Comprobar permisos/jerarquía antes de asignar
      const me = interaction.guild.members.me || await interaction.guild.members.fetchMe().catch(() => null);
      if (!me || !me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        await interaction.reply({ content: '❌ No tengo permisos para gestionar roles', flags: 64 });
        return;
      }
      if (me.roles.highest && me.roles.highest.comparePositionTo(pickedRole) <= 0) {
        await interaction.reply({ content: '⚠️ No puedo asignar ese rol por jerarquía. Ajusta mi rol por encima', flags: 64 });
        return;
      }

      // Quitar otras casas si existieran por manipulación manual
      const otherRoles = houseKeys
        .filter(k => k !== pickedKey)
        .map(k => roles[k])
        .filter(r => member.roles.cache.has(r.id));
      if (otherRoles.length > 0) {
        try { await member.roles.remove(otherRoles, 'Normalizar casas antes de primera asignación'); }
        catch (e) { logger.warn(`[Houses] No se pudieron retirar roles previos de ${interaction.user.tag}: ${e.message}`); }
      }

      // Asignar y anunciar públicamente
      await member.roles.add(pickedRole, 'Primera asignación del Sombrero Seleccionador (/hat)');

      const meta = HOUSE_META[pickedKey];
      const avatar = member.displayAvatarURL({ size: 256, extension: 'png' });
      const embed = new EmbedBuilder()
        .setColor(meta.color)
        .setTitle('🪄 ¡NUEVA SELECCIÓN! 🪄')
        .setDescription(
          `**${interaction.user}** ha sido seleccionado para...\n\n` +
          `🪄 **${meta.display}** 🪄\n` +
          `*${meta.quote}*`
        )
	.setThumbnail(avatar)
        .setFooter({ text: 'El Sombrero Seleccionador ha hablado' })
        .setTimestamp();
      if (meta.thumb) embed.setThumbnail(meta.thumb);

      // Respuesta pública
      await interaction.reply({ embeds: [embed] });

      logger.info(`[Houses] ${interaction.user.tag} asignado a ${pickedRole.name}`);
    } catch (error) {
      logger.error(`[Houses] Error en /hat: ${error.message}`);

      if (interaction.replied || interaction.deferred) {
        try {
          await interaction.followUp({
            content: '❌ No se pudo completar /hat. Revisa permisos y jerarquía',
            flags: 64,
          });
        } catch (followUpError) {
          logger.error(`[Houses] No se pudo enviar el mensaje de error: ${followUpError.message}`);
        }
      } else {
        try {
          await interaction.reply({
            content: '❌ No se pudo completar /hat. Revisa permisos y jerarquía',
            flags: 64,
          });
        } catch (replyError) {
          logger.error(`[Houses] No se pudo enviar el mensaje de error: ${replyError.message}`);
        }
      }
    }
  }
};
