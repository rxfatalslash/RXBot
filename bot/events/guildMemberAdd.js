const { Events } = require('discord.js');
const logger = require('../tools/logger');
const configManager = require('../tools/configManager');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const guildId = member.guild.id;

        // Recupera el autorol del servidor
        const autoRoleId = await configManager.getAutoRole(guildId);
        if (!autoRoleId) return;

        // Recupera el rol del servidor
        const role = member.guild.roles.cache.get(autoRoleId);
        if (!role) {
            logger.error(`AutoRole ${autoRoleId} not found on server ${guildId}`);
        }

        // Obtiene la información específica del servidor
        const config = await configManager.getConfig(guildId);
        if (!config.welcomeChannelId) {
            logger.error(`No welcome channel has been configured on server ${guildId}`);
            return;
        };

        const channel = member.guild.channels.cache.get(config.welcomeChannelId);
        if (!channel) {
            logger.error(`Channel ${config.welcomeChannelId} was not found on server ${guildId}`);
            return;
        };

        // Envía el mensaje de bienvenida
        const welcomeMessage = config.welcomeMessage || `Bienvenido al servidor, ${member}!`;
        const messageReplaced = welcomeMessage
            .replace('{user}', `<@${member.id}>`)
            .replace('{server}', member.guild.name);
        channel.send(messageReplaced);
    }
};