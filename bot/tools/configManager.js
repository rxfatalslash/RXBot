const fs = require('node:fs');
const path = require('node:path');
const logger = require('./logger');
const configPath = path.resolve(__dirname, '../config.json');

function readConfig() {
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, '{}', 'utf-8');
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function writeConfig(data) {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 4));
}

module.exports = {
    // Añade usuarios baneados
    async addBannedUser(guildId, userId) {
        try {
            let data = readConfig();
            if (fs.existsSync(configPath)) {
                data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            }

            if (!data[guildId]) {
                data[guildId] = { bannedUsers: [] };
            }

            if (!data[guildId].bannedUsers) {
                data[guildId].bannedUsers = [];
            }

            if (!data[guildId].bannedUsers.includes(userId)) {
                data[guildId].bannedUsers.push(userId);
            }

            writeConfig(data);
        } catch (error) {
            logger.error(`Error adding banned user: ${error.message}`)
        }
    },

    // Elimina usuarios baneados
    async removeBannedUser(guildId, userId) {
        try {
            let data = readConfig();

            if (data[guildId] && data[guildId].bannedUsers) {
                data[guildId].bannedUsers = data[guildId].bannedUsers.filter(id => id != userId);
                writeConfig(data);
            }
        } catch (error) {
            logger.error(`Error deleting the banned user from server ${guildId}: ${error.message}`);
        }
    },

    // Obtiene la información de un servidor
    async getConfig(guildId) {
        try {
            let data = readConfig();
            return data[guildId] || {};
        } catch (error) {
            logger.error(`Error fetching configuration from server ${guildId}: ${error.message}`);
            return {};
        }
    },

    // Actualiza o añade configuración
    async setConfig(guildId, newConfig) {
        try {
            let data = readConfig();
            data[guildId] = { ...(data[guildId] || {}), ...newConfig };
            writeConfig(data);
            logger.info(`Configuration updated for server ${guildId}`);
        } catch (error) {
            logger.error(`Error adding parameters to the server configuration on server ${guildId}: ${error.message}`);
        }
    },

    // Elimina un valor específico para un servidor
    async deleteConfigValue(guildId, key) {
        try {
            let data = readConfig();

            if (data[guildId] && key in data[guildId]) {
                delete data[guildId][key];
                writeConfig(data);
                logger.info(`Value **${key}** deleted on server ${guildId}`);
            } else {
                logger.error(`The value **${key}** was not found on server ${guildId}`);
            }
        } catch (error) {
            logger.error(`Error when deleting configuration value from server ${guildId}: ${error.message}`);
        }
    },

    // Define el autorol
    async setAutoRole(guildId, roleId) {
        try {
            let data = readConfig();
            if (!data[guildId]) {
                data[guildId] = {};
            }
            data[guildId].autoRoleId = roleId;
            writeConfig(data);
        } catch (error) {
            logger.error(`Error setting autorole on server ${guildId}: ${error.message}`);
        }
    },

    // Recupera el autorol de la configuración del servidor
    async getAutoRole(guildId) {
        try {
            let data = readConfig();
            return data[guildId]?.autoRoleId || null;
        } catch (error) {
            logger.error(`Error fetching the autorole from server ${guildId}: ${error.message}`);
            return null;
        }
    }
}