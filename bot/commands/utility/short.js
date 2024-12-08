const { SlashCommandBuilder } = require('discord.js');
const logger = require('../../tools/logger');
require('dotenv').config();

function isValidUrl(url) {
    const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    return urlPattern.test(url);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('short')
        .setDescription('🔗 Acorta una URL')
        .addStringOption(option =>
            option.setName('url')
               .setDescription('La URL a acortar')
               .setRequired(true)
        ),
    async execute(interaction) {
        try {
            const fetch = (await import('node-fetch')).default;
            const url = interaction.options.getString('url');
            const token = process.env.CUTTLY_API_KEY;

            // Comprueba si la URL es válida
            if (!isValidUrl(url)) {
                return await interaction.reply({
                    content: '⚠️ La URL no es válida',
                    ephemeral: true
                });
            }

            // Configuración y solicitud a la API de Cuttly
            const response = await fetch(`https://cutt.ly/api/api.php?key=${token}&short=${url}`);

            // Verifica la solicitud
            if (!response.ok) {
                throw new Error(`API responded with ${response.status}`);
            }

            const data = await response.json();

            // Envía el enlace acortado
            await interaction.reply(`🔗 URL acortada: ${data.url.shortLink}`);
        } catch (error) {
            logger.error(`Error shortening URL: ${error.message}`);

            // Envía el error
            await interaction.reply({
                content: '⚠️ Error al acortar la URL',
                ephemeral: true
            });
        }
    }
}