const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const configManager = require('../../tools/configManager');
const logger = require('../../tools/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupdate')
        .setDescription('Configura el mensaje de actualización y el canal por el que se enviarán los mensajes')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand.setName('channel')
                .setDescription('Selecciona el canal para los mensajes de actualización')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Canal de actualización')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('message')
                .setDescription('Selecciona el mensaje de actualización personalizado')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Mensaje de actualización personalizado. Usa {user} para mencionar usuarios')
                        .setRequired(true)
                )
        ),
        async execute(interaction) {
            const guildId = interaction.guild.id;

            try {
                const subcommand = interaction.options.getSubcommand();

                // Configuración de canal y mensaje
                if (subcommand === 'channel') {
                    const channel = interaction.options.getChannel('channel');

                    // Comprueba que sea un canal de texto
                    if (!channel.isTextBased()) {
                        return interaction.reply({
                            content: '❌ El canal seleccionado no es válido para mensajes de texto',
                            flags: 64
                        });
                    }

                    await configManager.setConfig(guildId, { updateChannelId: channel.id });
                    logger.info(`${interaction.user.tag} set a update channel on server ${guildId}`);

                    const embed = new EmbedBuilder()
                        .setColor(0x0062ff)
                        .setTitle('✅ Canal de Actualización Configurado')
                        .setDescription(`Los mensajes de actualización se enviarán al canal <#${channel.id}>`)
                        .setFooter({
                            text: 'RXBot by rxfatalslash',
                            iconURL: 'https://i.imgur.com/iiXUS2V.png'
                        })
                        .setTimestamp();

                    return interaction.reply({ embeds: [embed] });
                } else if (subcommand === 'message') {
                    const message = interaction.options.getSrting('message');

                    await configManager.setConfig(guildId, { updateMessage: message });
                    logger.info(`${interaction.user.tag} set a custom update message on server ${guildId}`);

                    const embed = new EmbedBuilder()
                        .setColor(0x0062ff)
                        .setTitle('✅ Mensaje de Actualización Configurado')
                        .setDescription(
                            `El mensaje de bienvenida ha sido configurado correctamente. Usa:\n` +
                            `- **{user}** para mencionar al usuario.\n` +
                            `- **{server}** para el nombre del servidor.`
                        )
                        .addFields({
                            name: 'Mensaje Configurado',
                            value: message
                        })
                        .setFooter({
                            text: 'RXBot by rxfatalslash',
                            iconURL: 'https://i.imgur.com/iiXUS2V.png'
                        })
                        .setTimestamp();

                    return interaction.reply({
                        embeds: [embed],
                        flags: 64
                    });
                }
            } catch (error) {
                logger.error(`Error executing setupdate command on server ${guildId}: ${error.message}`);

                const embed = new EmbedBuilder()
                    .setColor(0x0062ff)
                    .setTitle('⚠️ Error al Configurar Actualización')
                    .setDescription('Hubo un error al configurar los ajustes de actualización. Por favor, inténtalo nuevamente')
                    .setFooter({
                        text: 'RXBot by rxfatalslash',
                        iconURL: 'https://i.imgur.com/iiXUS2V.png'
                    })
                    .setTimestamp();

                return interaction.reply({
                    embeds: [embed],
                    flags: 64
                })
            }
        }
}