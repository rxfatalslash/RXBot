const { Events } = require('discord.js');
const logger = require('../tools/logger');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		const client = interaction.client;

		try {
			if (interaction.isChatInputCommand()) {
				const command = interaction.client.commands.get(interaction.commandName);

				if (!command) {
					logger.error(`No command matching ${interaction.commandName} was found`);
					return;
				}

				try {
					await command.execute(interaction);
				} catch (error) {
					logger.error(error.message);
					if (interaction.replied || interaction.deferred) {
						await interaction.followUp({
							content: 'There was an error while executing this command!',
							ephemeral: true,
						});
					} else {
						await interaction.reply({
							content: 'There was an error while executing this command!',
							ephemeral: true,
						});
					}
				}
			}
		} catch (error) {
			logger.error(`Unexpected error in interactionCreate: ${error.message}`);
			if (!interaction.replied) {
				await interaction.reply({
					content: 'An unexpected error occurred while processing your interaction',
					ephemeral: true,
				});
			}
		}
	},
};