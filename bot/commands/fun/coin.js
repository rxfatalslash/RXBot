const { SlashCommandBuilder } = require('discord.js');
const logger = require('../../tools/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coin')
        .setDescription('🪙 Lanza una moneda al aire'),
    async execute(interaction) {
        try {
            const outcomes = {
                cara: 'Cara 🪙',
                cruz: 'Cruz 🪙'
            };

            // Resultado aleatorio
            const result = Math.random() < 0.5 ? 'cara' : 'cruz';

            // Responde al usuario
            await interaction.reply(`🎉 ${interaction.user} lanzó una moneda y salió **${outcomes[result]}**`);
        } catch (error) {
            logger.error(`Error in coin command: ${error.message}`);
            await interaction.reply({
                content: '❌ Ocurrió un error al lanzar la moneda. Por favor, inténtalo nuevamente',
                ephemeral: true
            });
        }
    }
};
