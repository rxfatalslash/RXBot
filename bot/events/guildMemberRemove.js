const { Events } = require('discord.js');
const logger = require('../tools/logger');
const configManager = require('../tools/configManager');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        const guildId = member.guild.id;

        // Obtiene la información específica del servidor
        const config = await configManager.getConfig(guildId);
        if (!config.goodbyeChannelId) {
            logger.error(`No goodbye channel has been configured on server ${guildId}`);
            return;
        };

        const channel = member.guild.channels.cache.get(config.goodbyeChannelId);
        if (!channel) {
            logger.error(`Channel ${config.goodbyeChannelId} not found on server ${guildId}`);
            return;
        };

        // Envía el mensaje de despedida
        const goodbyeMessage = config.goodbyeMessage || `${member.user.tag} se ha ido`;
        const messageReplaced = goodbyeMessage
            .replace('{user}', `${member.user.tag}`)
            .replace('{server}', member.guild.name);
        channel.send(messageReplaced);
    }
}