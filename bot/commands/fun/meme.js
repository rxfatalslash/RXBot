const { SlashCommandBuilder } = require('discord.js');
const logger = require('../../tools/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('😂 Muestra un meme aleatorio'),
    async execute(interaction) {
        try {
            const fetch = (await import('node-fetch')).default;

            const response = await fetch('https://www.reddit.com/r/memes/random/.json');
            if (!response.ok) {
                throw new Error(`Reddit API responded with status ${response.status}`);
            }

            const [postData] = await response.json();

            // Valida la API request
            if (!postData || !postData.data || !postData.data.children[0]) {
                return interaction.reply({
                    content: '⚠️ No se pudo obtener un meme en este momento',
                    ephemeral: true
                });
            }

            const meme = postData.data.children[0].data;

            // Valida el meme
            if (!meme || !meme.url || !meme.title) {
                return interaction.reply({
                    content: '⚠️ No se pudo obtener ningún meme válido en este momento',
                    ephemeral: true
                });
            }

            // Envía el meme
            await interaction.reply(`😄 **${meme.title}**\n${meme.url}`);
        } catch (error) {
            logger.error(`Error fetching meme: ${error.message}`);

            // Asegura que solo se envíe una respuesta
            if (!interaction.replied) {
                await interaction.reply({
                    content: '⚠️ Hubo un error al obtener un meme 😞',
                    ephemeral: true
                });
            }
        }
    }
}