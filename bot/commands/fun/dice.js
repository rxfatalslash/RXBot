const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('🎲 Lanza un dado con un número de caras específico')
        .addIntegerOption(option =>
            option.setName('caras')
                .setDescription('Número de caras del dado')
                .setMinValue(2)
                .setMaxValue(100)
                .setRequired(true)),
    async execute(interaction) {
        const caras = interaction.options.getInteger('caras');
        const result = Math.floor(Math.random() * caras) + 1;

        await interaction.reply(`${interaction.user} ha lanzado un 🎲 de ${caras} caras y ha salido **${result}**`)
    }
}