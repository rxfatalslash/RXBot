const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle
} = require('discord.js');
const configManager = require('../../tools/configManager');
const logger = require('../../tools/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('🕊️ Desbanea a un usuario.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Usuario a desbanear.')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const guildId = interaction.guild.id;

        try {
            // Comprueba la lista de baneados
            const bans = await interaction.guild.bans.fetch();
            const isBanned = bans.has(target.id);

            if (!isBanned) {
                return interaction.reply({
                    content: `❌ El usuario **${target.tag}** no está baneado`,
                    ephemeral: true
                });
            }

            // Crea los botones de confirmación
            const confirmButton = new ButtonBuilder()
                .setCustomId('confirm')
                .setLabel('Confirmar')
                .setStyle(ButtonStyle.Success);

            const cancelButton = new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(cancelButton, confirmButton);

            // Pregunta por la confirmación
            await interaction.reply({
                content: `⚠️ ¿Estás seguro que deseas desbanear a **${target.tag}**?`,
                components: [row],
                ephemeral: true
            });

            const collectorFilter = i => i.user.id === interaction.user.id;

            try {
                const confirmation = await interaction.channel.awaitMessageComponent({
                    filter: collectorFilter,
                    time: 60_000
                });

                if (confirmation.customId === 'confirm') {
                    try {
                        // Desbanea al usuario
                        await interaction.guild.members.unban(target);
                        logger.info(`${interaction.user.tag} unbanned ${target.tag} on server ${guildId}`);

                        // Elimina al usuario desbaneado del archivo de configuración
                        await configManager.removeBannedUser(guildId, target.id);

                        await confirmation.update({
                            content: `✅ El usuario **${target.tag}** ha sido desbaneado exitosamente`,
                            components: []
                        });
                    } catch (unbanError) {
                        logger.error(`Error unbanning ${target.tag} on ${guildId} server: ${unbanError.message}`);
                        await confirmation.update({
                            content: `❌ No se pudo desbanear a **${target.tag}** debido a un error`,
                            components: []
                        });
                    }
                } else if (confirmation.customId === 'cancel') {
                    await confirmation.update({
                        content: '❌ Acción cancelada',
                        components: []
                    });
                }
            } catch (timeoutError) {
                logger.warn(`Timeout to confirm unban of ${target.tag} on server ${guildId}: ${timeoutError.message}`);
                await interaction.editReply({
                    content: '⚠️ Tiempo agotado. No se realizó ninguna acción',
                    components: []
                });
            }
        } catch (error) {
            if (interaction.replied || interaction.deferred) {
                logger.error(`Error processing unban command for ${target.tag} on server ${guildId}: ${error.message}`);
                return;
            }

            await interaction.reply({
                content: `❌ Ocurrió un error al intentar desbanear a **${target.tag}**`,
                ephemeral: true
            });
        }
    }
};
