const { Events, ActivityType } = require('discord.js');
const logger = require('../tools/logger');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        logger.info(`Ready! Logged in as ${client.user.tag}`);
        // console.log(`Ready! Logged in as ${client.user.tag}`);

        // Configuración bot
        client.user.setUsername('RXBot');
        // client.user.setAvatar('https://i.imgur.com/iiXUS2V.png');
        client.user.setActivity('rxfatalslash.github.io | /help', { type: ActivityType.Custom });
    },
};