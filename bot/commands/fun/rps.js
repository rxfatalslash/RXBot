const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rps')
        .setDescription('Juega a 🤜 piedra, 🖐️ papel o ✌️ tijeras con el bot'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const choices = ['🪨', '📜', '✂️'];

        // Botones del juego
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('🪨').setLabel('🪨').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('📜').setLabel('📜').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('✂️').setLabel('✂️').setStyle(ButtonStyle.Primary)
        );

        const message = await interaction.reply({
            content: 'Elige una opción:',
            components: [row],
        });

        // Recolector de interacciones
        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === userId,
            time: 15000,
        });

        collector.on('collect', async i => {
            const userChoice = i.customId;
            const botChoice = choices[Math.floor(Math.random() * choices.length)];
            let result;

            if (userChoice === botChoice) result = 'Empate 🤝';
            else if (
                (userChoice === '🪨' && botChoice === '✂️') ||
                (userChoice === '📜' && botChoice === '🪨') ||
                (userChoice === '✂️' && botChoice === '📜')
            ) result = 'Victoria 🎉';
            else result = 'Derrota 💔';

            let embedColor = result.includes('Derrota') ? '#FF0000' : result.includes('Victoria') ? '#00FF00' : '#FFA500';

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: interaction.user.username,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setColor(embedColor)
                .setDescription(`**Resultado:** ${result}`)
                .addFields(
                    { name: 'Tu elección', value: userChoice, inline: true },
                    { name: 'Elección del bot', value: botChoice, inline: true }
                )
                .setTimestamp()
                .setFooter({
                    text: 'RXBot by rxfatalslash',
                    iconURL: 'https://i.imgur.com/iiXUS2V.png',
                });

            await i.update({ content: 'Partida terminada', embeds: [embed], components: [] });
            collector.stop();
        });

        collector.on('end', async () => {
            if (!collector.ended) {
                await interaction.editReply({
                    content: '⏰ Se acabó el tiempo',
                    components: [],
                });
            }
        });
    },
};
