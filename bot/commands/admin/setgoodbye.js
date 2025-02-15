const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const configManager = require('../../tools/configManager');
const logger = require('../../tools/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setgoodbye')
        .setDescription('Configura el mensaje de despedida y el canal por el que se enviarán los mensajes')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand.setName('channel')
                .setDescription('Selecciona el canal para los mensajes de despedida')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Canal de despedidas')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('message')
                .setDescription('Selecciona el mensaje de despedida personalizado')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Mensaje de despedida personalizado. Usa {user} para mencionar usuarios y {server} para el servidor')
                        .setRequired(true)
                )
        ),
        async execute(interaction) {
            const guildId = interaction.guild.id;

            try {
                const subcommand = interaction.options.getSubcommand();

                // Configuración de canal y mensaje
                if(subcommand === 'channel') {
                    const channel = interaction.options.getChannel('channel');

                    // Comprueba que sea un canal de texto
                    if (!channel.isTextBased()) {
                        return interaction.reply({
                            content: '❌ El canal seleccionado no es válido para mensajes de texto',
                            flags: 64
                        });
                    }

                    await configManager.setConfig(guildId, { goodbyeChannelId: channel.id });
                    logger.info(`${interaction.user.tag} set a welcome channel on server ${guildId}`);
                    
                    const embed = new EmbedBuilder()
                        .setColor(0x0062ff)
                        .setTitle('✅ Canal de Despedida Configurado')
                        .setDescription(`Los mensajes de despedida se enviarán al canal <#${channel.id}>.`)
                        .setFooter({
                            text: 'RXBot by rxfatalslash',
                            iconURL: 'https://i.imgur.com/iiXUS2V.png'
                        })
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed], flags: 64 }); // Envío respuesta correcta
                } else if (subcommand === 'message') {
                    const message = interaction.options.getString('message');
                    
                    await configManager.setConfig(guildId, { goodbyeMessage: message });
                    logger.info(`${interaction.user.tag} set a custom welcome message on server ${guildId}`);

                    const embed = new EmbedBuilder()
                        .setColor(0x0062ff)
                        .setTitle('✅ Mensaje de Despedida Configurado')
                        .setDescription(
                            `El mensaje de despedida ha sido configurado correctamente. Usa:\n` +
                            `- **{user}** para mencionar al usuario que se despide.\n` +
                            `- **{server}** para el nombre del servidor.`
                        )
                        .addFields({ name: 'Mensaje Configurado', value: message })
                        .setFooter({
                            text: 'RXBot by rxfatalslash',
                            iconURL: 'https://i.imgur.com/iiXUS2V.png'
                        })
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed], flags: 64 }); // Envío respuesta correcta
                }
            } catch (error) {
                logger.error(`Error executing setgoodbye command on server ${guildId}: ${error.message}`);

                const embed = new EmbedBuilder()
                    .setColor(0x0062ff)
                    .setTitle('⚠️ Error al Configurar Despedida')
                    .setDescription('Hubo un error al configurar los ajustes de despedida. Por favor, inténtalo nuevamente.')
                    .setTimestamp()
                    .setFooter({
                        text: `Error reportado por ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                    });

                await interaction.reply({ embeds: [embed], flags: 64 }); // Envío respuesta de error
            }
        }
}