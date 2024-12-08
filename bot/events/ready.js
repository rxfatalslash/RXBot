const { Events, ActivityType } = require('discord.js');
const logger = require('../tools/logger');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        logger.info(`Ready! Logged in as ${client.user.tag}`);
        // console.log(`Ready! Logged in as ${client.user.tag}`);

        // Configuración bot
        // client.user.setUsername('BOT_USERNAME');
        // client.user.setAvatar('BOT_AVATAR_PATH');
        // client.user.setActivity('CUSTOM_ACTIVITY', { type: ActivityType.Custom });
    },
};