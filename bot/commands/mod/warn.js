const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../../tools/logger');

// Ruta al archivo config.json
const configFilePath = path.join(__dirname, '../../config.json');

// Carga el archivo config.json
function loadConfig() {
    if (!fs.existsSync(configFilePath)) return {};
    return JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
}

// Guarda el archivo config.json
function saveConfig(config) {
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('⚠️ Gestiona advertencias de usuarios')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Añade una advertencia a un usuario')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('El usuario al que quieres advertir')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Razón de la advertencia')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('delete')
                .setDescription('Elimina todas las advertencias de un usuario')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('El usuario cuyas advertencias deseas eliminar')
                        .setRequired(true))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand(); // Determina el subcomando utilizado
        const user = interaction.options.getUser('user');
        const guildId = interaction.guild.id;
        const guildName = interaction.guild.name;

        const config = loadConfig();

        // Asegurarse de que el servidor tenga un objeto de advertencias
        if (!config[guildId]) config[guildId] = {};
        if (!config[guildId].warnings) config[guildId].warnings = {};

        const warnings = config[guildId].warnings;

        if (subcommand === 'add') {
            const reason = interaction.options.getString('reason');
            const moderator = interaction.user;

            // Verifica si el usuario es advertible
            if (user.bot) {
                return await interaction.reply({
                    content: '❌ No puedes advertir a un bot',
                    flags: 64,
                });
            }

            // Añade advertencia
            if (!warnings[user.id]) warnings[user.id] = [];

            warnings[user.id].push({
                reason,
                moderator: moderator.tag,
                timestamp: new Date().toISOString(),
            });

            saveConfig(config);

            const serverEmbed = new EmbedBuilder()
                .setTitle('⚠️ Advertencia emitida')
                .setColor('#FFA500')
                .setDescription(`El usuario ${user} ha sido advertido.`)
                .addFields(
                    { name: 'Razón', value: reason },
                    { name: 'Moderador', value: moderator.tag }
                )
                .setTimestamp();

            logger.info(`Moderator ${moderator.tag} warned ${user.tag}`);
            await interaction.reply({ embeds: [serverEmbed] });

            // Envío de DM
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Has recibido una advertencia')
                    .setColor('#FF0000')
                    .setDescription(`Has sido advertido en el servidor **${guildName}**.`)
                    .addFields(
                        { name: 'Razón', value: reason },
                        { name: 'Moderador', value: moderator.tag }
                    )
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] }); // Enviar DM al usuario
            } catch (error) {
                logger.error(`Error sending DM to ${user.tag}: ${error.message}`);
            }
        } else if (subcommand === 'delete') {
            // Eliminar advertencias
            if (!warnings[user.id] || warnings[user.id].length === 0) {
                return await interaction.reply({
                    content: '❌ Este usuario no tiene advertencias registradas.',
                    flags: 64,
                });
            }

            delete warnings[user.id];
            saveConfig(config);

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Advertencias eliminadas')
                .setColor('#FF0000')
                .setDescription(`Todas las advertencias de ${user} han sido eliminadas.`)
                .setTimestamp();

            logger.info(`Moderator ${interaction.user.tag} deleted warnings for ${user.tag}`);
            await interaction.reply({ embeds: [embed] });
        }
    },
};