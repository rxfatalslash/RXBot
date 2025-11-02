const {SlashCommandBuilder, PermissionsBitField, MessageFlags} = require('discord.js');
const logger = require('../../tools/logger');
const { ensureHouseRoles } = require('../../tools/ensureHouseRoles');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hat')
        .setDescription('🎩 El Sombrero Seleccionador: asegura los roles de casas y puede asignarte uno'),

        /**
         * @param {import('discord.js').ChatInputCommandInteraction} interaction
         */
        async execute(interaction) {
            try {
                await interaction.deferReply({  flags: MessageFlags.Ephemeral });

                const guild = interaction.guild;
                if (!guild) {
                    await interaction.editReply('❌ Este comando solo puede usarse dentro de un servidor');
                    return;
                }

                const { roles, created } = await ensureHouseRoles(guild, { enforceColor: true });

                if (created.length > 0) {
                    const createdNames = created.map(k => roles[k].name).join(', ');
                    await interaction.editReply(
                        `🧪 Setup inicial completado. Roles creados: **${createdNames}**.\n` +
                        `Vuelve a usar \`/hat\` para intentar ser seleccionado por una casa.`
                    );
                    return;
                }

                const roll = Math.random();
                if (roll >= 0.25) {
                    await interaction.editReply('🤫 El Sombrero pondera… pero hoy guarda silencio. (Prueba de nuevo más tarde)');
                    return;
                }

                /** @type {Array<'gryffindor'|'slytherin'|'ravenclaw'|'hufflepuff'>} */
                const houseKeys = ['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'];
                const pickedKey = houseKeys[Math.floor(Math.random() * houseKeys.length)];
                const pickedRole = roles[pickedKey];

                const me = guild.members.me || await guild.members.fetchMe().catch(() => null);
                if (!me || !me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                    await interaction.editReply('❌ No tengo permisos para gestionar roles en este servidor');
                    return;
                }
                if (me.roles.highest && me.roles.highest.comparePositionTo(pickedRole) <= 0) {
                    await interaction.editReply('⚠️ No puedo asignar ese rol porque está por encima (o al mismo nivel) de mi rol. Ajusta la jerarquía y vuelve a intentarlo');
                    return;
                }

                const member = await guild.members.fetch(interaction.user.id);

                const otherRoles = houseKeys
                    .filter(k => k !== pickedKey)
                    .map(k => roles[k])
                    .filter(r => member.roles.cache.has(r.id));

                if (otherRoles.length > 0) {
                    try {
                        await member.roles.remove(otherRoles, 'Cambio de casa por /hat (Sombrero Seleccionador)');
                    } catch (e) {
                        logger.warn(`[Houses] No se pudieron retirar roles previos de ${interaction.user.tag}`);
                    }
                }

                await member.roles.add(pickedRole, 'Asignación aleatoria del Sombrero Seleccionador (/hat)');

                await interaction.editReply(`🪄 El Sombrero ha decidido: **${pickedRole.name}**. ¡Rol asignado! ${pickedRole}`);
                logger.info(`[Houses] ${interaction.user.tag} asignado a ${pickedRole.name}`);
            } catch (error) {
                logger.error(`[Houses] Error en /hat: ${error.message}`);
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply('❌ No se pudo completar /hat. Revisa permisos del bot y la jerarquía de roles');
                } else {
                    await interaction.reply({ content: '❌ No se pudo completar /hat', flags: 64 });
                }
            }
        }
};
