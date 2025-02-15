const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require('discord.js');
const logger = require('../../tools/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('👢 Expulsión de usuario')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Usuario a expulsar')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Razón de la expulsión')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');
        const guild = interaction.guild;

        // Comprobar los permisos del bot
        if (!guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({
                content: '❌ Permisos insuficientes',
                flags: 64
            });
        }

        // Asegurarse de que el usuario es un miembro válido
        const member = await guild.members.fetch(target.id).catch(() => null);
        if (!member) {
            return interaction.reply({
                content: '❌ No se pudo encontrar al usuario en este servidor',
                flags: 64
            });
        }

        // Comprueba si el bot puede expulsar al usuario
        if (!member.kickable) {
            return interaction.reply({
                content: `❌ No se pudo expulsar a **${target.tag}**. Comprueba la jerarquía de roles`,
                flags: 64
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

        // Muestra la confirmación
        await interaction.reply({
            content: `⚠️ ¿Quieres expulsar al usuario **${target.username}** por **${reason}**?`,
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
                try {
                    // Evnía el DM
                    await target.send(`Has sido expulsado del servidor **${guild.name}** por **${reason}**`).catch(dmError => {
                        logger.warn(`Unable to send DM to **${target.tag}**: ${dmError.message}`);
                    });

                    // Expulsa al usuario
                    await member.kick(reason);
                    logger.info(`${interaction.user.tag} kicked ${target.tag} off the server ${guild.id}`);

                    // Actualiza el mensaje de confirmación
                    await confirmation.update({
                        content: `✅ El usuario **${target.tag}** ha sido expulsado por **${reason}**`,
                        components: []
                    });
                } catch (kickError) {
                    logger.error(`Error kicking ${target.tag} from ${guild.id} server: ${kickError.message}`);
                    await confirmation.update({
                        content: `❌ No se pudo expulsar a **${target.tag}** debido a un error`,
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
            if (interaction.replied || interaction.deferred) {
                logger.error(`Time-out for kick confirmation: ${timeoutError.message}`);
                return;
            }
            
            await interaction.editReply({
                content: '⚠️ Tiempo de espera agotado. No se realizó ninguna acción',
                components: []
            });
        }
    }
};
