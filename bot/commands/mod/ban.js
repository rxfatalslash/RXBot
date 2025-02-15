const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require('discord.js');
const configManager = require('../../tools/configManager');
const logger = require('../../tools/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('🚫 Baneo de usuario')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Miembro a banear')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Razón del baneo')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No se ha proporcionado ninguna razón';
        const guild = interaction.guild;
        const guildId = guild.id;

        // Comprobar los permisos del bot
        if (!guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({
                content: '❌ Permisos insuficientes',
                flags: 64
            });
        }

        // Asegurarse de que el usuario es un miembro válido
        const member = await guild.members.fetch(target.id).catch(() => null);
        if (!member) {
            return interaction.reply({
                content: '❌ El usuario no se encuentra en el servidor',
                flags: 64
            });
        }

        // Comprueba si el bot puede banear al usuario
        if (!member.bannable) {
            return interaction.reply({
                content: `❌ No se pudo banear a **${target.tag}**. Comprueba la jerarquía de roles`,
                flags: 64
            });
        }

        // Crea los botones de confirmación
        const confirm = new ButtonBuilder()
            .setCustomId('confirm')
            .setLabel('Confirmar')
            .setStyle(ButtonStyle.Success);

        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancelar')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(cancel, confirm);

        // Muestra la confirmación
        await interaction.reply({
            content: `⚠️ ¿Quieres banear al usuario **${target.username}** por **${reason}**?`,
            components: [row],
            flags: 64
        });

        const collectorFilter = i => i.user.id === interaction.user.id;

        try {
            const confirmation = await interaction.channel.awaitMessageComponent({
                filter: collectorFilter,
                time: 60_000
            });

            if (confirmation.customId === 'confirm') {
                await confirmation.deferUpdate();

                try {
                    await target.send(`Has sido baneado de **${guild.name}** por **${reason}**`).catch(dmError => {
                        logger.warn(`Unable to send DM to **${target.tag}**: ${dmError.message}`);
                    });

                    await member.ban({ reason });
                    logger.info(`${interaction.user.tag} banned ${target.tag} from server ${guildId}`);

                    await configManager.addBannedUser(guildId, target.id);

                    await interaction.editReply({
                        content: `✅ El usuario **${target.tag}** ha sido baneado por **${reason}**`,
                        components: []
                    });
                } catch (banError) {
                    logger.error(`Error banning ${target.tag} from ${guildId} server: ${banError.message}`);
                    await interaction.editReply({
                        content: `❌ No se pudo banear a **${target.tag}** debido a un error.`,
                        components: []
                    });
                }
            } else if (confirmation.customId === 'cancel') {
                await confirmation.update({
                    content: '❌ Acción cancelada',
                    components: []
                });
            }
        } catch (error) {
            if (error.name === 'InteractionCollectorError') {
                logger.error(`Time-out for ban confirmation: ${error.message}`);
            } else if (error.message.includes('Unknown interaction')) {
                logger.error(`Unknown interaction: ${error.message}`);
            }else {
                logger.error(`Unexpected error in ban confirmation: ${error.message}`);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ Ocurrió un error inesperado al procesar esta acción',
                        flags: 64
                    });
                }
            }
        }
    }
};
