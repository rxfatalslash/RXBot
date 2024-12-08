const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('node:path');
const fs = require('node:fs');
const logger = require('../../tools/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('❓ Listado de comandos disponibles')
        .addStringOption(option =>
                option.setName('command')
                    .setDescription('Muestra información sobre el comando')
                    .setRequired(false)
        ),
    async execute(interaction) {
        const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

        const loadCommands = () => {
            const commandsPath = path.join(__dirname, '../../commands');
            const categories = fs.readdirSync(commandsPath).sort();
            const commandsByCategory = {};

            for (const category of categories) {
                const categoryPath = path.join(commandsPath, category);

                if (!fs.lstatSync(categoryPath).isDirectory()) {
                    logger.warn(`Skipping non-directory: ${categoryPath}`);
                    continue;
                }

                const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
                commandsByCategory[category] = commandFiles.map(file => {
                    try {
                        const filePath = path.join(categoryPath, file);
                        delete require.cache[require.resolve(filePath)];
                        const command = require(filePath);

                        if (command.data && command.data.name && command.data.description) {
                            return {
                                name: command.data.name,
                                description: command.data.description,
                                options: command.data.options || []
                            };
                        } else {
                            logger.warn(`Invalid command in ${filePath}: Missing "data" or "description"`);
                        }
                    } catch (error) {
                        logger.error(`Error loading command from ${file}: ${error.message}`);
                    }
                }).filter(cmd => cmd);
            }

            return commandsByCategory;
        }

        const commandsByCategory = loadCommands();
        const specificCommand = interaction.options.getString('command');

        if (specificCommand) {
            const allCommands = Object.values(commandsByCategory).flat();
            const command = allCommands.find(cmd => cmd.name === specificCommand);

            if (command) {
                const embed = new EmbedBuilder()
                    .setColor(0x0062ff)
                    .setTitle(`/${specificCommand}`)
                    .setDescription(command.description)
                    .setTimestamp()
                    .setFooter({
                        text: 'RXBot by rxfatalslash',
                        iconURL: 'https://i.imgur.com/iiXUS2V.png'
                    });

                if (command.options?.length > 0) {
                    embed.addFields(
                        command.options.map(option => ({
                            name: `/${command.name} ${option.name}`,
                            value: option.description || 'Sin descripción',
                            inline: false
                        }))
                    );
                }

                return interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                return interaction.reply({
                    content: `❌ El comando **/${specificCommand}** no existe. Utiliza el comando **/help** para ver la lista de comandos disponibles`,
                    ephemeral: true
                });
            }
        }

        const embed = new EmbedBuilder()
            .setColor(0x0062ff)
            .setTitle('Help')
            .setDescription('Listado de comandos disponibles por categorías')
            .setTimestamp()
            .setFooter({
                text: 'RXBot by rxfatalslash',
                iconURL: 'https://i.imgur.com/iiXUS2V.png'
            });

        Object.keys(commandsByCategory).sort().forEach(category => {
            if (commandsByCategory[category] && commandsByCategory[category].length > 0) {
                const commandList = commandsByCategory[category]
                    .map(cmd => `**/${cmd.name}** - ${cmd.description}`)
                    .join('\n');

                embed.addFields({
                    name: `${capitalize(category)} (${commandsByCategory[category].length} Comandos)`,
                    value: commandList,
                    inline: false
                });

            }
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}