const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const configManager = require('../../tools/configManager');
const logger = require('../../tools/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setautorole')
        .setDescription('Define el autorol asignado a los nuevos usuarios')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('El rol que se asignará a los nuevos usuarios')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    async execute(interaction) {
        try {
            const role = interaction.options.getRole('role');
            const guild = interaction.guild;

            // Comprueba que se ejecuta en un servidor
            if (!guild) {
                return interaction.reply({
                    content: '⚠️ Este comando solo puede ser usado dentro de un servidor',
                    flags: 64
                });
            }

            const botMember = guild.members.me;
            if (!botMember) {
                return interaction.reply({
                    content: '⚠️ No se pudieron verificar los privilegios del bot',
                    flags: 64
                });
            }

            // Verifica la jerarquía de roles
            if (botMember.roles.highest.position <= role.position) {
                return interaction.reply({
                    content: `⚠️ No se puede asignar el rol **${role.name}** si el bot tiene menos privilegios`,
                    flags: 64
                });
            }

            // Guarda la configuración
            await configManager.setAutoRole(guild.id, role.id);
            logger.info(`${interaction.user.tag} set an autorole on server ${guild.id}`);

            // Envío de respuesta correcta
            const embed = new EmbedBuilder()
                .setColor(0x0062ff)
                .setTitle('✅ Autorol Definido')
                .setDescription(`Se ha configurado el rol **${role.name}** como autorol para nuevos usuarios.`)
                .setFooter({
                    text: 'RXBot by rxfatalslash',
                    iconURL: 'https://i.imgur.com/iiXUS2V.png'
                })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            logger.error(`Error setting an autorole on server ${interaction.guild.id}: ${error.message}`);

            // Envío de respuesta de error
            const embed = new EmbedBuilder()
                .setColor(0x0062ff)
                .setTitle('⚠️ Error al Definir Autorol')
                .setDescription('Ocurrió un error al intentar configurar el autorol. Por favor, revisa los permisos del bot y vuelve a intentarlo.')
                .setFooter({
                    text: 'RXBot by rxfatalslash',
                    iconURL: 'https://i.imgur.com/iiXUS2V.png'
                })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: 64 });
        }
    }
}