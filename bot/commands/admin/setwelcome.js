const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const configManager = require('../../tools/configManager');
const logger = require('../../tools/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setwelcome')
        .setDescription('Configura el mensaje de bienvenida y el canal por el que se enviarán los mensajes')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand.setName('channel')
                .setDescription('Selecciona el canal para los mensajes de bienvenida')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Canal de bienvenidas')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('message')
                .setDescription('Selecciona el mensaje de bienvenida personalizado')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Mensaje de bienvenida personalizado. Usa {user} para mencionar usuarios y {server} para el servidor')
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
                        ephemeral: true
                    });
                }

                await configManager.setConfig(guildId, { welcomeChannelId: channel.id });
                logger.info(`${interaction.user.tag} set a welcome channel on server ${guildId}`);

                const embed = new EmbedBuilder()
                    .setColor(0x0062ff)
                    .setTitle('✅ Canal de Bienvenida Configurado')
                    .setDescription(`Los mensajes de bienvenida se enviarán al canal <#${channel.id}>.`)
                    .setFooter({
                        text: 'RXBot by rxfatalslash',
                        iconURL: 'https://i.imgur.com/iiXUS2V.png'
                    })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], ephemeral: true }); // Envío respuesta correcta
            } else if (subcommand === 'message') {
                const message = interaction.options.getString('message');

                await configManager.setConfig(guildId, { welcomeMessage: message });
                logger.info(`${interaction.user.tag} set a custom welcome message on server ${guildId}`);

                const embed = new EmbedBuilder()
                    .setColor(0x0062ff)
                    .setTitle('✅ Mensaje de Bienvenida Configurado')
                    .setDescription(
                        `El mensaje de bienvenida ha sido configurado correctamente. Usa:\n` +
                        `- **{user}** para mencionar al usuario.\n` +
                        `- **{server}** para el nombre del servidor.`
                    )
                    .addFields({ name: 'Mensaje Configurado', value: message })
                    .setFooter({
                        text: 'RXBot by rxfatalslash',
                        iconURL: 'https://i.imgur.com/iiXUS2V.png'
                    })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            logger.error(`Error executing setwelcome command on server ${guildId}: ${error.message}`);

            const embed = new EmbedBuilder()
                .setColor(0x0062ff)
                .setTitle('⚠️ Error al Configurar Bienvenida')
                .setDescription('Hubo un error al configurar los ajustes de bienvenida. Por favor, inténtalo nuevamente.')
                .setFooter({
                    text: 'RXBot by rxfatalslash',
                    iconURL: 'https://i.imgur.com/iiXUS2V.png'
                })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true }); // Envío respuesta de error
        }
    }
}