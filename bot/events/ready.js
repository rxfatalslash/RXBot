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
        // client.user.setAvatar('PATH_TO_AVATAR');
        // client.user.setActivity('CUSTOM_TEXT, { type: ActivityType.Custom });
    },
};