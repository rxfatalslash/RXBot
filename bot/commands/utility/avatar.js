const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../tools/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('📷 Muestra el avatar de un usuario')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Usuario del cual se quiere mostrar el avatar')),
    async execute(interaction) {
        try {
            // Obtener el usuario objetivo o recuperar el ejecutor del comando
            const user = interaction.options.getUser('target') || interaction.user;

            // Obtener URL de avatar
            const avatarURL = user.displayAvatarURL({
                dynamic: true,
                format: user.avatar?.startsWith('a_') ? 'gif' : 'png',
                size: 1024
            });

            // Contruir el embed
            const embed = new EmbedBuilder()
                .setColor(0x0062ff)
                .setTitle('Avatar de Usuario')
                .addFields({ name: 'Usuario', value: `${user}`, inline: true })
                .setImage(avatarURL)
                .setFooter({
                    text: 'RXBot by rxfatalslash',
                    iconURL: 'https://i.imgur.com/iiXUS2V.png'
                })
                .setTimestamp();

            // Enviar la respuesta
            await interaction.reply({ embeds: [embed], flags: 64 });
        } catch (error) {
            logger.error(`Error in avatar command: ${error.message}`);
            await interaction.reply({
                content: '❌ Ocurrió un error al intentar obtener el avatar del usuario.',
                flags: 64
            });
        }
    }
}