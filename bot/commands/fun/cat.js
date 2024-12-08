const { SlashCommandBuilder } = require('discord.js');
const logger = require('../../tools/logger');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cat')
        .setDescription('😺 Muestra una foto aleatoria de un gatito'),
    async execute(interaction) {
        try {
            const fetch = (await import('node-fetch')).default;

            // API request
            const response = await fetch('https://api.thecatapi.com/v1/images/search', {
                headers: {
                    'x-api-key': process.env.CAT_API_KEY
                }
            });

            // Comprueba errores en la petición
            if (!response.ok) {
                throw new Error(`API responded with status ${response.status}`);
            }

            const data = await response.json();

            // Valida la respuesta de la API
            if (!Array.isArray(data) || data.length === 0 || !data[0].url) {
                return interaction.reply({
                    content: '⚠️ No se pudo obtener una imagen de gatito en este momento 😿',
                    ephemeral: true
                });
            }

            // Envía la imagen
            await interaction.reply({
                content: `**Miau** 😺`,
                files: [data[0].url]
            });
        } catch (error) {
            logger.error(`Error obtaining the cat image: ${error.message}`);

            if (!interaction.replied) {
                await interaction.reply({
                    content: '⚠️ Hubo un error al obtener una imagen de gatito 😿. Por favor, inténtalo de nuevo más tarde',
                    ephemeral: true
                });
            }
        }
    }
};
