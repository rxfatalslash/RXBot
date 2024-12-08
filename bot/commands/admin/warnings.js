const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Ruta al archivo config.json
const configFilePath = path.join(__dirname, '../../config.json');

// Cargar configuración desde config.json
function loadConfig() {
    if (!fs.existsSync(configFilePath)) return {};
    return JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('🔍 Ver advertencias de un usuario')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('El usuario cuyas advertencias deseas ver')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const guildId = interaction.guild.id;

        // Cargar advertencias desde config.json
        const config = loadConfig();

        // Asegurarse de que el servidor tenga un objeto de advertencias
        if (!config[guildId]) config[guildId] = {};
        if (!config[guildId].warnings) config[guildId].warnings = {};

        const warnings = config[guildId].warnings;
        const userWarnings = warnings[user.id] || [];

        // Crear embed para mostrar advertencias
        const embed = new EmbedBuilder()
            .setTitle(`🔍 Advertencias para ${user.tag}`)
            .setColor(userWarnings.length > 0 ? 0xff0000 : 0x00ff00) // Rojo si hay advertencias, verde si no
            .setTimestamp()
            .setFooter({
                text: 'RXBot by rxfatalslash',
                iconURL: 'https://i.imgur.com/iiXUS2V.png',
            });

        if (userWarnings.length === 0) {
            // Sin advertencias
            embed.setDescription('Este usuario no tiene advertencias.');
        } else {
            // Mostrar todas las advertencias
            userWarnings.forEach((warning, index) => {
                embed.addFields({
                    name: `Advertencia #${index + 1}`,
                    value: `**Razón:** ${warning.reason}\n**Moderador:** ${warning.moderator}\n**Fecha:** ${new Date(warning.timestamp).toLocaleString()}`,
                    inline: false,
                });
            });
        }

        // Enviar respuesta con el embed
        await interaction.reply({ embeds: [embed] });
    },
};