const { SlashCommandBuilder } = require('discord.js');
const logger = require('../../tools/logger');

// Respuestas en inglés y español
const responses = {
    en: [
        { text: 'It is certain.', category: 'positive' },
        { text: 'Without a doubt.', category: 'positive' },
        { text: 'You may rely on it.', category: 'positive' },
        { text: 'Yes, definitely.', category: 'positive' },
        { text: 'Most likely.', category: 'positive' },
        { text: 'Ask again later.', category: 'neutral' },
        { text: 'Cannot predict now.', category: 'neutral' },
        { text: 'Concentrate and ask again.', category: 'neutral' },
        { text: 'Don’t count on it.', category: 'negative' },
        { text: 'Outlook not so good.', category: 'negative' },
    ],
    es: [
        { text: 'Es cierto.', category: 'positive' },
        { text: 'Sin duda.', category: 'positive' },
        { text: 'Confía en ello.', category: 'positive' },
        { text: 'Sí, definitivamente.', category: 'positive' },
        { text: 'Es muy probable.', category: 'positive' },
        { text: 'Pregunta más tarde.', category: 'neutral' },
        { text: 'No puedo predecirlo ahora.', category: 'neutral' },
        { text: 'Concéntrate y pregunta de nuevo.', category: 'neutral' },
        { text: 'No cuentes con ello.', category: 'negative' },
        { text: 'El panorama no es bueno.', category: 'negative' },
    ],
};

// Emojis para las reacciones
const emojis = ['✅', '🤔', '❌'];

function shuffleArray(array) {
    const shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('🎱 Haz una pregunta a la bola 8')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('Tu pregunta a la bola 8')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            const question = interaction.options.getString('question');
            const userLanguage = interaction.locale.startsWith('es') ? 'es' : 'en'; // Idiomas
            const availableResponses = responses[userLanguage] || responses.en;
            const randomIndex = Math.floor(Math.random() * availableResponses.length); // Respuesta aleatoria
            const response = availableResponses[randomIndex];

            // Envía la respuesta
            const reply = await interaction.reply({
                content: `> **${interaction.user}:** ${question}\n\n🎱 ${response.text}`,
                fetchReply: true
            });

            const shuffledEmojis = shuffleArray(emojis);

            for (const emoji of shuffledEmojis) {
                try {
                    await reply.react(emoji);
                } catch (error) {
                    logger.error(`Failed to react with emoji: ${error.message}`);
                }
            }
        } catch (error) {
            logger.error(`Error in 8ball command: ${error.message}`);
            await interaction.reply({
                content: '❌ Ha ocurrido un error. Prueba más tarde',
                ephemeral: true
            });
        }
    }
}