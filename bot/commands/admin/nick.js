const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../../tools/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nick')
        .setDescription('Gestiona los nicknames')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Establece un nickname personalizado')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('El usuario cuyo nickname deseas cambiar')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('nickname')
                        .setDescription('El nuevo nickname')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Restablece el nickname al predeterminado (nombre de usuario)')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('El usuario cuyo nickname deseas restablecer')
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ChangeNickname),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const target = interaction.options.getMember('target');
        const user = interaction.options.getUser('target');
        const botMember = interaction.guild.members.me;

        try {
            // Comprueba los permisos del bot
            if (!botMember.permissions.has(PermissionFlagsBits.ManageNicknames)) {
                return interaction.reply({
                    content: '❌ El bot no tiene permisos para gestionar nicknames',
                    flags: 64
                });
            }

            // Comprueba que el rol del bot sea superior al del usuario
            if (botMember.roles.highest.position <= target.roles.highest.position) {
                return interaction.reply({
                    content: `❌ No se puede cambiar el nickname de **${target.user.username}** porque tiene un rol superior o igual al bot`,
                    flags: 64
                });
            }

            // Comprueba si el usuario es el dueño del servidor
            if (target.id === interaction.guild.ownerId) {
                await interaction.reply({
                    content: '❌ No se puede cambiar el nickname del dueño del servidor',
                    flags: 64
                });
                return;
            }

            if (subcommand === 'set') {
                const nick = interaction.options.getString('nickname');

                // Intenta cambiar el nickname
                await target.setNickname(nick);
                logger.info(`${interaction.user.tag} changed the nickname of ${user.tag} on the server ${interaction.guild.id}`);

                const embed = new EmbedBuilder()
                    .setColor(0x0062ff)
                    .setTitle('✅ Nickname cambiado')
                    .setDescription(`El nickname de **${user.tag}** se ha cambiado a **${nick}**`)
                    .setFooter({
                        text: 'RXBot by rxfatalslash',
                        iconURL: 'https://i.imgur.com/iiXUS2V.png'
                    })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            } else if (subcommand === 'reset') {
                // Intenta resetear el nickname
                await target.setNickname(null);
                logger.info(`${interaction.user.tag} reset the nickname of ${user.tag} on the server ${interaction.guild.id}`);

                const embed = new EmbedBuilder()
                    .setColor(0x0062ff)
                    .setTitle('✅ Nickname restablecido')
                    .setDescription(`El nickname de **${user.tag}** se ha restablecido al predeterminado`)
                    .setFooter({
                        text: 'RXBot by rxfatalslash',
                        iconURL: 'https://i.imgur.com/iiXUS2V.png'
                    })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            logger.error(`Error changing the nickname: ${error.message}`);

            const embed = new EmbedBuilder()
                .setColor(0x0062ff)
                .setTitle('❌ Error al cambiar el nickname')
                .setDescription('Hubo un error al intentar cambiar el nickname. Asegúrate de que el bot tiene los permisos adecuados')
                .setFooter({
                    text: 'RXBot by rxfatalslash',
                    iconURL: 'https://i.imgur.com/iiXUS2V.png'
                })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: 64 });
        }
    }
};