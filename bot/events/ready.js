const { Events, ActivityType } = require('discord.js');
const logger = require('../tools/logger');

module.exports = {
    name: Events.ClientReady,
    once: false,
    async execute(client) {
        logger.info(`Ready! Logged in as ${client.user.tag}`);

        // Configuración bot
        client.user.setUsername('<NOMBRE_BOT>'); // Solo primer arranque, después comentar
        client.user.setAvatar('<URL/PATH_AVATAR_BOT>'); // Solo primer arranque, después comentar

        // Estado custom
        const setBotStatus = () => {
            try {
                client.user.setPresence({
                    activities: [{
                        name: 'custom',
                        state: '<ESTADO_DESEADO>',
                        type: ActivityType.Custom
                    }],
                    status: 'online',
                });
            } catch (error) {
                logger.error(`Error al actualizar estado: ${error.message}`);
            }
        };

        setBotStatus();

        // Refresco cada 15 mins
        if (!client.statusInterval) {
            client.statusInterval = setInterval(setBotStatus, 15 * 60 * 1000);
        }

        // Registro de comandos solo en caso necesario
        const payload = [...client.commands.values()].map(c => c.data.toJSON());

        try {
            await client.application.commands.set(payload);
            logger.info('[Commands] Registrados como GLOBALS');
        } catch (e) {
            logger.error(`[Commands] Error registrando globales: ${e.message}`);
        }
    },
};
