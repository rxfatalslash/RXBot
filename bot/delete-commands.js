const { REST, Routes } = require('discord.js');
require('dotenv').config();

const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;

// List of command names to delete
const commandsToDelete = []; // Replace with the names of commands to delete

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Fetching global commands...');
        const globalCommands = await rest.get(Routes.applicationCommands(clientId));

        // Delete specific global commands
        for (const command of globalCommands) {
            if (commandsToDelete.includes(command.name)) {
                console.log(`Deleting global command: ${command.name}`);
                await rest.delete(Routes.applicationCommand(clientId, command.id));
                console.log(`Successfully deleted global command: ${command.name}`);
            }
        }

        // If you want to handle guild-specific commands
        const guildIds = process.env.GUILD_IDS ? process.env.GUILD_IDS.split(',') : [];
        for (const guildId of guildIds) {
            console.log(`Fetching commands for guild: ${guildId}`);
            const guildCommands = await rest.get(Routes.applicationGuildCommands(clientId, guildId));

            for (const command of guildCommands) {
                if (commandsToDelete.includes(command.name)) {
                    console.log(`Deleting command ${command.name} in guild: ${guildId}`);
                    await rest.delete(Routes.applicationGuildCommand(clientId, guildId, command.id));
                    console.log(`Successfully deleted command ${command.name} in guild: ${guildId}`);
                }
            }
        }

        console.log('Specified commands deleted successfully.');
    } catch (error) {
        console.error('Error deleting commands:', error.message);
    }
})();
