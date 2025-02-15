const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../tools/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('📜 Información sobre el servidor'),
    async execute(interaction) {
        try {
            const server = interaction.guild;
            const members = await interaction.guild.members.fetch();
            let ownerId = 'Unknown';
            
            try {
                const owner = await server.fetchOwner();
                ownerId = owner.user.id;
            } catch (ownerError) {
                logger.warn(`Failed to fetch owner for server ${server.id}: ${ownerError.message}`);
            }

            const textChannels = server.channels.cache.filter(ch => ch.type === 0).size;
            const voiceChannels = server.channels.cache.filter(ch => ch.type === 2).size;
            const totalChannels = server.channels.cache.size;
            const totalRoles = server.roles.cache.size;
            const bots = members.filter(member => member.user.bot).size;
            const humans = members.filter(member => !member.user.bot).size;

            const embed = new EmbedBuilder()
                .setColor(0x0062ff)
                .setTitle('📜 Información del servidor')
                .setThumbnail(server.iconURL({ dynamic: true }) || null)
                .setDescription(`Servidor **${server.name}**`)
                .addFields(
                    { name: '🌐 Server ID', value: server.id, inline: false },
                    { name: '👑 Dueño', value: `<@${ownerId}>`, inline: true },
                    { name: '📅 Creación', value: `${server.createdAt.toLocaleDateString()}`, inline: true },
                    {
                        name: '👥 Miembros',
                        value: `**Humanos:** ${humans}\n**Bots:** ${bots}\n**Total:** ${server.memberCount}`,
                        inline: false
                    },
                    {
                        name: '📁 Canales',
                        value: `**Texto:** ${textChannels}\n**Voz:** ${voiceChannels}\n**Total:** ${totalChannels}`,
                        inline: true
                    },
                    { name: '🏷️ Roles', value: `${totalRoles}`, inline: true }
                    
                )
                .setTimestamp()
                .setFooter({
                    text: 'RXBot by rxfatalslash',
                    iconURL: 'https://i.imgur.com/iiXUS2V.png'
                });
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            logger.error(`Serverinfo command failed: ${error.message}`);
            await interaction.reply({
                content: '❌ Error al recuperar la información del servidor',
                flags: 64
            });
        }
    }
};