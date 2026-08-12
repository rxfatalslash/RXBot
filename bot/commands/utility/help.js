const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ComponentType,
    MessageFlags
} = require('discord.js');

const path = require('node:path');
const fs = require('node:fs');
const logger = require('../../tools/logger');

const COMMANDS_PATH = path.join(__dirname, '../../commands');

const CATEGORY_NAMES = {
    admin: 'Administración',
    fun: 'Diversión',
    mod: 'Moderación',
    utility: 'Utilidades'
};

/**
 * Devuelve el nombre visible de una categoría.
 * Si la categoría no está en el mapa, capitaliza su nombre original.
 */
const getCategoryName = category => {
    const normalizedCategory = category.toLowerCase();

    return (
        CATEGORY_NAMES[normalizedCategory]
        ?? category.charAt(0).toUpperCase() + category.slice(1)
    );
};

/**
 * Devuelve el texto singular o plural correspondiente.
 */
const getCommandCountText = count =>
    count === 1 ? '1 comando' : `${count} comandos`;

/**
 * Carga automáticamente los comandos organizados por carpetas.
 */
const loadCommands = () => {
    const commandsByCategory = {};

    let categories;

    try {
        categories = fs.readdirSync(COMMANDS_PATH).sort();
    } catch (error) {
        logger.error(
            `Error leyendo el directorio de comandos: ${error.message}`
        );

        return commandsByCategory;
    }

    for (const category of categories) {
        const categoryPath = path.join(COMMANDS_PATH, category);

        try {
            if (!fs.lstatSync(categoryPath).isDirectory()) {
                logger.warn(`Skipping non-directory: ${categoryPath}`);
                continue;
            }

            const commandFiles = fs
                .readdirSync(categoryPath)
                .filter(file => file.endsWith('.js'))
                .sort();

            const commands = [];

            for (const file of commandFiles) {
                const filePath = path.join(categoryPath, file);

                try {
                    const command = require(filePath);

                    if (
                        command.data
                        && command.data.name
                        && command.data.description
                    ) {
                        commands.push({
                            name: command.data.name,
                            description: command.data.description,
                            options: command.data.options ?? []
                        });
                    } else {
                        logger.warn(
                            `Invalid command in ${filePath}: `
                            + 'Missing "data", "name" or "description"'
                        );
                    }
                } catch (error) {
                    logger.error(
                        `Error loading command from ${filePath}: `
                        + error.message
                    );
                }
            }

            if (commands.length > 0) {
                commandsByCategory[category] = commands;
            }
        } catch (error) {
            logger.error(
                `Error processing category ${categoryPath}: `
                + error.message
            );
        }
    }

    return commandsByCategory;
};

/**
 * Pie estándar de los embeds.
 */
const createFooter = client => ({
    text: 'RXBot by rxfatalslash',
    iconURL:
        client.user?.displayAvatarURL()
        ?? 'https://i.imgur.com/iiXUS2V.png'
});

/**
 * Crea el embed principal de ayuda.
 */
const createHomeEmbed = (client, commandsByCategory) => {
    const categoryList = Object.entries(commandsByCategory)
        .sort(([categoryA], [categoryB]) =>
            getCategoryName(categoryA).localeCompare(
                getCategoryName(categoryB),
                'es'
            )
        )
        .map(([category, commands]) =>
            `**${getCategoryName(category)}** — `
            + getCommandCountText(commands.length)
        )
        .join('\n');

    return new EmbedBuilder()
        .setColor(0x0062ff)
        .setTitle('❓ Ayuda de RXBot')
        .setDescription(
            [
                'Selecciona una categoría para consultar sus comandos.',
                '',
                categoryList
            ].join('\n')
        )
        .setTimestamp()
        .setFooter(createFooter(client));
};

/**
 * Crea el embed de una categoría concreta.
 */
const createCategoryEmbed = (client, category, commands) => {
    const commandList = [...commands]
        .sort((commandA, commandB) =>
            commandA.name.localeCompare(commandB.name, 'es')
        )
        .map(command =>
            `**/${command.name}** — ${command.description}`
        )
        .join('\n');

    return new EmbedBuilder()
        .setColor(0x0062ff)
        .setTitle(
            `${getCategoryName(category)} `
            + `(${getCommandCountText(commands.length)})`
        )
        .setDescription(commandList)
        .setTimestamp()
        .setFooter({
            text: 'Selecciona otra categoría para cambiar de sección',
            iconURL:
                client.user?.displayAvatarURL()
                ?? 'https://i.imgur.com/iiXUS2V.png'
        });
};

/**
 * Crea el embed con los detalles de un comando.
 */
const createCommandEmbed = (client, command) => {
    const embed = new EmbedBuilder()
        .setColor(0x0062ff)
        .setTitle(`/${command.name}`)
        .setDescription(command.description)
        .setTimestamp()
        .setFooter(createFooter(client));

    if (command.options?.length > 0) {
        const optionFields = command.options.map(option => {
            const requiredText = option.required
                ? 'Obligatoria'
                : 'Opcional';

            return {
                name: `${option.name} · ${requiredText}`,
                value: option.description || 'Sin descripción',
                inline: false
            };
        });

        embed.addFields(optionFields);
    }

    return embed;
};

/**
 * Crea el selector de categorías.
 */
const createCategoryMenu = (
    commandsByCategory,
    selectedCategory = null,
    disabled = false
) => {
    const options = Object.entries(commandsByCategory)
        .sort(([categoryA], [categoryB]) =>
            getCategoryName(categoryA).localeCompare(
                getCategoryName(categoryB),
                'es'
            )
        )
        .map(([category, commands]) => ({
            label: getCategoryName(category),
            description: `${getCommandCountText(commands.length)} disponibles`,
            value: category,
            default: category === selectedCategory
        }));

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('help-category')
        .setPlaceholder('Selecciona una categoría')
        .setDisabled(disabled)
        .addOptions(options);

    return new ActionRowBuilder().addComponents(selectMenu);
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('❓ Listado de comandos disponibles')
        .addStringOption(option =>
            option
                .setName('command')
                .setDescription('Muestra información sobre un comando')
                .setRequired(false)
                .setAutocomplete(true)
        ),

    /**
     * Autocompletado de la opción "command".
     */
    async autocomplete(interaction) {
        try {
            const commandsByCategory = loadCommands();

            const focusedValue = interaction.options
                .getFocused()
                .toLowerCase();

            const choices = Object.values(commandsByCategory)
                .flat()
                .filter(command =>
                    command.name.toLowerCase().includes(focusedValue)
                    || command.description
                        .toLowerCase()
                        .includes(focusedValue)
                )
                .sort((commandA, commandB) =>
                    commandA.name.localeCompare(commandB.name, 'es')
                )
                .slice(0, 25)
                .map(command => ({
                    name: `/${command.name} — ${command.description}`
                        .slice(0, 100),
                    value: command.name
                }));

            await interaction.respond(choices);
        } catch (error) {
            logger.error(
                `Error en el autocompletado de /help: ${error.message}`
            );

            await interaction.respond([]).catch(() => {});
        }
    },

    async execute(interaction) {
        const commandsByCategory = loadCommands();

        if (Object.keys(commandsByCategory).length === 0) {
            return interaction.reply({
                content:
                    '❌ No se ha podido cargar la lista de comandos.',
                flags: MessageFlags.Ephemeral
            });
        }

        const specificCommand =
            interaction.options.getString('command');

        /*
         * Ayuda de un comando específico:
         * /help command:ban
         */
        if (specificCommand) {
            const command = Object.values(commandsByCategory)
                .flat()
                .find(currentCommand =>
                    currentCommand.name.toLowerCase()
                    === specificCommand.toLowerCase()
                );

            if (!command) {
                return interaction.reply({
                    content:
                        `❌ El comando **/${specificCommand}** no existe. `
                        + 'Utiliza **/help** para consultar los comandos '
                        + 'disponibles.',
                    flags: MessageFlags.Ephemeral
                });
            }

            return interaction.reply({
                embeds: [
                    createCommandEmbed(interaction.client, command)
                ],
                flags: MessageFlags.Ephemeral
            });
        }

        /*
         * Ayuda general con selector de categorías.
         */
        const homeEmbed = createHomeEmbed(
            interaction.client,
            commandsByCategory
        );

        const categoryMenu = createCategoryMenu(
            commandsByCategory
        );

        await interaction.reply({
            embeds: [homeEmbed],
            components: [categoryMenu],
            flags: MessageFlags.Ephemeral
        });

        const responseMessage = await interaction.fetchReply();

        const collector =
            responseMessage.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 120_000
            });

        collector.on('collect', async menuInteraction => {
            try {
                if (
                    menuInteraction.user.id
                    !== interaction.user.id
                ) {
                    return menuInteraction.reply({
                        content:
                            '❌ Este menú pertenece a otro usuario.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                const selectedCategory =
                    menuInteraction.values[0];

                const commands =
                    commandsByCategory[selectedCategory];

                if (!commands) {
                    return menuInteraction.update({
                        embeds: [homeEmbed],
                        components: [
                            createCategoryMenu(commandsByCategory)
                        ]
                    });
                }

                const categoryEmbed = createCategoryEmbed(
                    interaction.client,
                    selectedCategory,
                    commands
                );

                const updatedMenu = createCategoryMenu(
                    commandsByCategory,
                    selectedCategory
                );

                await menuInteraction.update({
                    embeds: [categoryEmbed],
                    components: [updatedMenu]
                });
            } catch (error) {
                logger.error(
                    `Error procesando el selector de /help: `
                    + error.message
                );
            }
        });

        collector.on('end', async () => {
            const disabledMenu = createCategoryMenu(
                commandsByCategory,
                null,
                true
            );

            await interaction.editReply({
                components: [disabledMenu]
            }).catch(error => {
                logger.warn(
                    `No se ha podido desactivar el menú de /help: `
                    + error.message
                );
            });
        });
    }
};