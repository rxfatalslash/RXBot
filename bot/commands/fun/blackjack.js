const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const logger = require('../../tools/logger');

// Mapa para rastrear las partidas activas
const games = new Map();

// Crear el mazo barajado
function createDeck() {
    const suits = ['♠️', '♥️', '♦️', '♣️'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ rank, suit });
        }
    }
    return deck.sort(() => Math.random() - 0.5); // Mezclar cartas
}

// Calcular el valor de la mano
function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;

    for (const card of hand) {
        if (['J', 'Q', 'K'].includes(card.rank)) value += 10; // Figuras valen 10
        else if (card.rank === 'A') {
            value += 11; // As inicia como 11
            aces += 1;
        } else value += parseInt(card.rank);
    }

    // Ajustar Ases si el valor supera 21
    while (value > 21 && aces > 0) {
        value -= 10;
        aces -= 1;
    }

    return value;
}

// Formatear la mano como texto
function formatHand(hand) {
    return hand.map(card => `${card.rank}${card.suit}`).join(' ');
}

// Crear el embed del juego
function createGameEmbed(interaction, playerHand, dealerHand, playerValue, dealerValue, result = 'Partida en proceso', remainingCards = 0) {
    let embedColor = '#0099FF'; // Color por defecto

    if (result.includes('Bust') || result.includes('Derrota')) embedColor = '#FF0000'; // Derrota
    if (result.includes('Victoria')) embedColor = '#00FF00'; // Victoria
    if (result.includes('Empate')) embedColor = '#FFA500'; // Empate

    return new EmbedBuilder()
        .setColor(embedColor)
        .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setDescription(`**Resultado:** ${result}`)
        .addFields(
            {
                name: `**Tu mano**`,
                value: `${formatHand(playerHand)}\n**Valor:** ${playerValue}`,
                inline: true
            },
            {
                name: `**Mano crupier**`,
                value: `${formatHand(dealerHand)}\n**Valor:** ${dealerValue || '?'}`,
                inline: true
            }
        )
        .setFooter({ text: `Cartas restantes: ${remainingCards}` });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('♦️ Juega una partida de Blackjack'),
    async execute(interaction) {
        const userId = interaction.user.id;

        if (games.has(userId)) {
            return interaction.reply({
                content: '❌ Ya tienes un juego en curso. Usa los botones para continuar',
                ephemeral: true
            });
        }

        // Configuración inicial del juego
        const deck = createDeck();
        const playerHand = [deck.pop(), deck.pop()];
        const dealerHand = [deck.pop(), deck.pop()];
        const playerValue = calculateHandValue(playerHand);
        const dealerValue = calculateHandValue(dealerHand);

        // Verificar si hay 21 al inicio
        if (playerValue === 21 || dealerValue === 21) {
            const result = playerValue === 21 && dealerValue === 21 ? 'Empate 🤝'
                : playerValue === 21 ? 'Victoria 🎉'
                    : 'Derrota 💀';

            const embed = createGameEmbed(interaction, playerHand, dealerHand, playerValue, dealerValue, result, deck.length);
            return interaction.reply({ embeds: [embed], components: [] });
        }

        games.set(userId, { deck, playerHand, dealerHand });

        // Crear botones de acción
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('hit').setLabel('Pedir').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('stand').setLabel('Plantarse').setStyle(ButtonStyle.Danger)
        );

        const embed = createGameEmbed(interaction, playerHand, [dealerHand[0]], playerValue, dealerValue, 'Partida en proceso', deck.length);

        const message = await interaction.reply({ embeds: [embed], components: [row] });

        // Recolector para manejar interacciones con botones
        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === userId,
            time: 60000
        });

        collector.on('collect', async i => {
            const game = games.get(userId);
            if (!game) return;

            if (i.customId === 'hit') {
                // El jugador pide una carta
                const playerCard = game.deck.pop();
                game.playerHand.push(playerCard);

                // Recalcula los valores
                const playerValue = calculateHandValue(game.playerHand);
                let dealerValue = calculateHandValue(game.dealerHand);

                // El crupier debe pedir
                if (dealerValue < 17 || (dealerValue >= 17 && Math.random() < 0.5)) {
                    const dealerCard = game.deck.pop();
                    game.dealerHand.push(dealerCard);
                    dealerValue = calculateHandValue(game.dealerHand);
                }

                // Comprueba si el jugador o el crupier superan el valor de 21
                if (playerValue >= 21 || dealerValue >= 21) {
                    const result = playerValue > 21
                        ? 'Bust 💔'
                        : dealerValue > 21
                            ? 'Victoria 🎉'
                            : playerValue === dealerValue
                                ? 'Empate 🤝'
                                : playerValue === 21
                                    ? 'Victoria 🎉'
                                    : 'Derrota 💀';

                    const embed = createGameEmbed(
                        interaction,
                        game.playerHand,
                        game.dealerHand,
                        playerValue,
                        dealerValue,
                        result,
                        game.deck.length
                    );

                    games.delete(userId); // Finaliza la partida
                    await i.update({ embeds: [embed], components: [] });
                    collector.stop();
                    return;
                }

                // Actualiza el embed
                const embed = createGameEmbed(
                    interaction,
                    game.playerHand,
                    [game.dealerHand[0]],
                    playerValue,
                    dealerValue,
                    'Partida en proceso',
                    game.deck.length
                );

                await i.update({ embeds: [embed] });
            } else if (i.customId === 'stand') {
                let dealerValue = calculateHandValue(game.dealerHand);

                while (dealerValue < 17 || (dealerValue >= 17 && Math.random() < 0.5)) {
                    game.dealerHand.push(game.deck.pop());
                    dealerValue = calculateHandValue(game.dealerHand);

                    // Comprueba el valor de la mano del crupier
                    if (dealerValue >= 21) {
                        const playerValue = calculateHandValue(game.playerHand);
                        const result = dealerValue > 21
                            ? 'Victoria 🎉'
                            : playerValue === dealerValue
                                ? 'Empate 🤝'
                                : 'Derrota 💀';

                        const embed = createGameEmbed(
                            interaction,
                            game.playerHand,
                            game.dealerHand,
                            playerValue,
                            dealerValue,
                            result,
                            game.deck.length
                        );

                        games.delete(userId); // Finaliza la partida
                        await i.update({ embeds: [embed], components: [] });
                        collector.stop();
                        return;
                    }
                }

                // Resultado final
                const playerValue = calculateHandValue(game.playerHand);
                const result = dealerValue > 21 || playerValue > dealerValue
                    ? 'Victoria 🎉'
                    : playerValue === dealerValue
                        ? 'Empate 🤝'
                        : 'Derrota 💀';

                const embed = createGameEmbed(
                    interaction,
                    game.playerHand,
                    game.dealerHand,
                    playerValue,
                    dealerValue,
                    result,
                    game.deck.length
                );

                games.delete(userId); // Finaliza la partida
                await i.update({ embeds: [embed], components: [] });
                collector.stop();
            }
        });

        collector.on('end', async () => {
            if (games.has(userId)) {
                games.delete(userId);
                await interaction.editReply({ content: '❌ Tiempo agotado. La partida ha finalizado.', components: [] });
            }
        });
    },
};
