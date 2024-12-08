const { SlashCommandBuilder } = require('discord.js');
const logger = require('../../tools/logger');

module.exports = {
    data: new SlashCommandBuilder()
          .setName('ping')
        .setDescription('🛜 Muestra la latencia de la API de Discord'),
    async execute(interaction) {
        try {
            // REspuesta inicial
            const sent = await interaction.reply({
                content: '🏓 Calculando latencias...',
                ephemeral: true,
                fetchReply: true
            });

            // Cálculo de latencias
            const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
            const apiLatency = Math.round(interaction.client.ws.ping);

            logger.info(`Ping command executed by ${interaction.user.tag}: Bot Latency - ${botLatency}ms, API Latency - ${apiLatency}ms`);

            // Enviar la respuesta
            await interaction.editReply({
                content: `🏓 **Pong!**\n🔧 **Latencia del Bot:** \`${botLatency}ms\`\n🌐 **Latencia de la API:** \`${apiLatency}ms\``,
                ephemeral: true
            });
        } catch (error) {
            logger.error(`Error in ping command: ${error.message}`);
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ Ocurrió un error al calcular las latencias. Por favor, inténtalo nuevamente.',
                    ephemeral: true
                });
            }
        }
    }
}