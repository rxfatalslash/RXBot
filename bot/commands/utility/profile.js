const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../tools/logger');

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('👤 Muestra información del perfil de un usuario')
        .addUserOption(option =>
            option.setName('target')
               .setDescription('Usuario del cual se quiere mostrar el perfil')),
    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('target') || interaction.user;
            const targetMember = interaction.guild.members.cache.get(targetUser.id);

            const presenceStatus = targetMember?.presence?.status || 'Unknown';
            const statusEmoji = {
                'online': '🟢',
                'idle': '🟠',
                'dnd': '🔴',
                'offline': '⚪'
            }[presenceStatus] || '❓';

            const roles = targetMember?.roles?.cache.filter(role => role.name !== '@everyone');
            const displayedRoles = roles?.map(role => role.name).slice(0, 5).join(', ') || 'No hay roles';
            const hasMoreRoles = roles?.size > 5 ? '...' : '';

            const joinedAt = targetMember?.joinedAt
                ? targetMember.joinedAt.toLocaleDateString()
                : 'Desconocido';
            const createdAt = targetUser.createdAt.toLocaleDateString();

            const embed = new EmbedBuilder()
                .setColor(0x0062ff)
                .setTitle('👤 Perfil de Usuario')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '🆔 Usuario', value: `${targetUser}`, inline: true },
                    { name: '📄 ID', value: targetUser.id, inline: true },
                    { name: '🟢 Estado', value: `${statusEmoji} ${capitalizeFirstLetter(presenceStatus)}`, inline: true },
                    {
                        name: '📜 Roles',
                        value: `${displayedRoles} ${hasMoreRoles}`,
                        inline: false
                    },
                    { name: '📅 Unión al server', value: joinedAt, inline: true },
                    { name: '⏳ Creación de la cuenta', value: createdAt, inline: true }
                )
                .setFooter({
                    text: 'RXBot by rxfatalslash',
                    iconURL: 'https://i.imgur.com/iiXUS2V.png'
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: 64 });
        } catch (error) {
            logger.error(`Error executing profile command: ${error.message}`);
            await interaction.reply({
                content: '❌ No se pudo recuperar la información del perfil.',
                flags: 64
            });
        }
    }
};