const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../tools/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Administra los roles del servidor')
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Asigna un rol a un usuario')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('El usuario al que asignar el rol')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('El rol que se quiere asignar')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setDescription('Elimina el rol de un usuario')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('El usuario del que se quiere eliminar el rol')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('El rol a eliminar')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('removeall')
                .setDescription('Elimina todos los roles de un usuario')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('Usuario del que se quieren eliminar los roles')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('color')
                .setDescription('Cambia el color de un rol')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Rol al que se le quiere cambiar el color')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription('Color que se quiere establecer en hexadecimal (ej: #FFFFFF)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('name')
                .setDescription('Cambia el nombre de un rol')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Rol al que se le quiere cambiar el nombre')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Nombre que se quiere establecer')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('multiple')
                .setDescription('Añade o elimina varios usuarios de un rol')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Acción a realizar')
                        .addChoices(
                            { name: 'Añadir', value: 'add' },
                            { name: 'Eliminar', value: 'remove' }
                        )
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Rol que se quiera asignar o eliminar')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('targets')
                        .setDescription('Usuarios objetivo')
                        .addChoices(
                            { name: 'Todos', value: 'all' },
                            { name: 'Bots', value: 'bots' },
                            { name: 'Humanos', value: 'humans' }
                        )
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const role = interaction.options.getRole('role');
        const user = interaction.options.getUser('target');

        try {
            if (subcommand === 'add') {
                const member = await interaction.guild.members.fetch(user.id);
                await member.roles.add(role);
                logger.info(`Role ${role.name} added to ${user.tag} by ${interaction.user.tag}`);
                return interaction.reply(`✅ Rol **${role.name}** asignado a <@${user.id}>`);
            }

            if (subcommand === 'remove') {
                const member = await interaction.guild.members.fetch(user.id);
                await member.roles.remove(role);
                logger.info(`Role ${role.name} removed from ${user.tag} by ${interaction.user.tag}`);
                return interaction.reply(`✅ Rol **${role.name}** eliminado de <@${user.id}>`);
            }

            if (subcommand === 'removeall') {
                const member = await interaction.guild.members.fetch(user.id);
                const roles = member.roles.cache.filter(r => r.name !== '@everyone');

                if (roles.size === 0) {
                    return interaction.reply(`⚠️ El usuario <@${user.id}> no tiene roles asignados`);
                }

                await member.roles.set([]);
                logger.info(`All roles removed from ${user.tag} by ${interaction.user.tag}`);
                return interaction.reply(`✅ Todos los roles de <@${user.id}> han sido eliminados`);
            }

            if (subcommand === 'color') {
                const color = interaction.options.getString('color');
                await role.setColor(color);
                logger.info(`Color of role ${role.name} changed to ${color} by ${interaction.user.tag}`);
                return interaction.reply(`✅ El color del rol **${role.name}** se ha cambiado a ${color}`);
            }

            if (subcommand === 'name') {
                const newName = interaction.options.getString('name');
                await role.setName(newName);
                logger.info(`Name of role ${role.name} changed to ${newName} by ${interaction.user.tag}`);
                return interaction.reply(`✅ El nombre del rol se ha cambiado a **${newName}**`);
            }

            if (subcommand === 'multiple') {
                const action = interaction.options.getString('action');
                const targets = interaction.options.getString('targets');
                const members = await interaction.guild.members.fetch();

                const filteredMembers = members.filter(member => {
                    if (targets === 'all') return true;
                    if (targets === 'bots') return member.user.bot;
                    if (targets === 'humans') return !member.user.bot;
                });

                for (const member of filteredMembers.values()) {
                    if (action === 'add') {
                        await member.roles.add(role);
                        logger.info(`Role ${role.name} added to ${member.user.tag} by ${interaction.user.tag}`);
                    } else if (action === 'remove') {
                        await member.roles.remove(role);
                        logger.info(`Role ${role.name} removed from ${member.user.tag} by ${interaction.user.tag}`);
                    }
                }

                return interaction.reply(
                    `✅ Acción **${action}** realizada para el rol **${role.name}** en los usuarios especificados`
                );
            }
        } catch (error) {
            logger.error(`Error executing role command: ${error.message}`);
            return interaction.reply({ content: '❌ Ocurrió un error al procesar el comando.', flags: 64 });
        }
    }
};