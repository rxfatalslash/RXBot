const { SlashCommandBuilder } = require('discord.js');
const logger = require('../../tools/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dog')
        .setDescription('🐶 Muestra una foto aleatoria de un perro'),
    async execute(interaction) {
        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch('https://dog.ceo/api/breeds/image/random');

            // Valida la respuesta API
            if (!response.ok) {
                throw new Error(`API responded with status ${response.status}`);
            }

            const data = await response.json();

            if (data.status !== 'success' || !data.message) {
                return interaction.reply({
                    content: '⚠️ No se pudo obtener una imagen de perro en este momento 🐕‍🦺',
                    flags: 64
                });
            }

            // Evía la imagen
            await interaction.reply({
                content: `**Guau** 🐶`,
                files: [data.message]
            });
        } catch (error) {
            logger.error(`Error fetching dog image: ${error.message}`);

            if (!interaction.replied) {
                await interaction.reply({
                    content: '⚠️ Hubo un error al obtener una imagen de perro 🐶. Por favor, inténtalo de nuevo más tarde',
                    flags: 64
                });
            }
        }
    }
};
