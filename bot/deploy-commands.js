const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');

const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildIds = process.env.GUILD_IDS ? process.env.GUILD_IDS.split(',') : [];
const ignoredCommands = []; // Add commands to skip here

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            if (ignoredCommands.includes(command.data.name)) {
                console.log(`[INFO] Skipping command: ${command.data.name}`);
                continue;
            }
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property`);
        }
    }
}

const rest = new REST({ version: '10' }).setToken(token);

// Helper function to handle rate limits
async function safeApiCall(apiCall) {
    try {
        return await apiCall();
    } catch (error) {
        if (error.status === 429) {
            const retryAfter = parseInt(error.response?.headers['retry-after'] || '1', 10);
            console.warn(`[RATE LIMIT] Reintentando en ${retryAfter} segundos...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            return await safeApiCall(apiCall); // Reintenta
        } else {
            console.error('[ERROR] Fallo en la API:', error.message);
            if (error.response) {
                console.error('Detalles del error:', JSON.stringify(error.response.data, null, 2));
            }
            throw error;
        }
    }
}

(async () => {
    try {
        console.log('Starting deployment of commands...');

        // Clear commands
        if (guildIds.length === 0) {
            console.log('Clearing global commands...');
            await safeApiCall(() =>
                rest.put(Routes.applicationCommands(clientId), { body: [] })
            );
            console.log('Global commands cleared.');
        } else {
            for (const guildId of guildIds) {
                console.log(`Clearing commands for guild: ${guildId}`);
                await safeApiCall(() =>
                    rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
                );
                console.log(`Commands cleared for guild: ${guildId}`);
            }
        }

        // Register commands
        if (guildIds.length === 0) {
            console.log('Deploying commands globally...');
            const data = await safeApiCall(() =>
                rest.put(Routes.applicationCommands(clientId), { body: commands })
            );
            console.log(`Successfully registered ${data.length} global commands.`);
        } else {
            for (const guildId of guildIds) {
                console.log(`Deploying commands to guild: ${guildId}`);
                const data = await safeApiCall(() =>
                    rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
                );
                console.log(`Successfully registered ${data.length} commands in guild: ${guildId}`);
            }
        }

        console.log('Commands deployed successfully.');
    } catch (error) {
        console.error('[ERROR] Error deploying commands:', error.message);
        if (error.response && error.response.data) {
            console.error('API Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
})();
