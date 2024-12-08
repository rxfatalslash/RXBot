const { Events, EmbedBuilder } = require('discord.js');
const logger = require('../tools/logger');
const configManager = require('../tools/configManager');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        const guildId = oldMember.guild.id;

        const config = await configManager.getConfig(guildId);
        if (!config.updateChannelId) {
            logger.error(`No update channel has been configured on server ${guildId}`);
            return;
        }

        const channel = oldMember.guild.channels.cache.get(config.updateChannelId);
        if (!channel) {
            logger.error(`Channel ${config.updateChannelId} not found on server ${guildId}`);
            return;
        }

        const updateMessage = config.updateMessage || `${newMember.user} ha actualizado su perfil`;
        const messageReplaced = updateMessage
            .replace('{user}', `<@${newMember.id}>`);

        const embed = new EmbedBuilder()
            .setColor(0x0062ff)
            .setAuthor({
                name: oldMember.user?.username || 'Usuario desconocido',
                iconURL: oldMember.user?.displayAvatarURL({ dynamic: true }) || null
            })
            .setDescription(messageReplaced)
            .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
            .setFooter({
                text: 'RXBot by rxfatalslash',
                iconURL: 'https://i.imgur.com/iiXUS2V.png'
            })
            .setTimestamp();

        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            logger.error(`Failed to send update message: ${error.message}`);
        }
    }
}