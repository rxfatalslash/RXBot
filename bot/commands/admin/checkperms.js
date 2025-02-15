const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../../tools/logger');

// Traducción de permisos
const permissionTranslations = {
    CreateInstantInvite: 'Crear Invitación Instantánea',
    KickMembers: 'Expulsar Miembros',
    BanMembers: 'Banear Miembros',
    Administrator: 'Administrador',
    ManageChannels: 'Gestionar Canales',
    ManageGuild: 'Gestionar Servidor',
    AddReactions: 'Añadir Reacciones',
    ViewAuditLog: 'Ver Registro de Auditoría',
    PrioritySpeaker: 'Prioridad de Habla',
    Stream: 'Transmitir',
    ViewChannel: 'Ver Canales',
    SendMessages: 'Enviar Mensajes',
    SendTTSMessages: 'Enviar Mensajes TTS',
    ManageMessages: 'Gestionar Mensajes',
    EmbedLinks: 'Insertar Enlaces',
    AttachFiles: 'Adjuntar Archivos',
    ReadMessageHistory: 'Leer Historial de Mensajes',
    MentionEveryone: 'Mencionar @everyone',
    UseExternalEmojis: 'Usar Emojis Externos',
    ViewGuildInsights: 'Ver Insights del Servidor',
    Connect: 'Conectar',
    Speak: 'Hablar',
    MuteMembers: 'Silenciar Miembros',
    DeafenMembers: 'Ensordecer Miembros',
    MoveMembers: 'Mover Miembros',
    UseVAD: 'Usar Detección de Voz',
    ChangeNickname: 'Cambiar Apodo',
    ManageNicknames: 'Gestionar Apodos',
    ManageRoles: 'Gestionar Roles',
    ManageWebhooks: 'Gestionar Webhooks',
    ManageEmojisAndStickers: 'Gestionar Emojis y Stickers',
    UseApplicationCommands: 'Usar Comandos de Aplicaciones',
    RequestToSpeak: 'Solicitar Hablar',
    ManageEvents: 'Gestionar Eventos',
    ManageThreads: 'Gestionar Hilos',
    CreatePublicThreads: 'Crear Hilos Públicos',
    CreatePrivateThreads: 'Crear Hilos Privados',
    UseExternalStickers: 'Usar Stickers Externos',
    SendMessagesInThreads: 'Enviar Mensajes en Hilos',
    StartEmbeddedActivities: 'Iniciar Actividades Integradas',
    ModerateMembers: 'Moderar Miembros'
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkperms')
        .setDescription('Comprueba los permisos de un usuario en este servidor.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('El usuario cuyos permisos quieres revisar.')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        try {
            // Obtener el usuario objetivo o recuperar el ejecutor del comando
            const targetUser = interaction.options.getUser('target') || interaction.user;

            //Obtener el miembro
            let member;
            try {
                member = await interaction.guild.members.fetch(targetUser.id);
                if (!member) throw new Error('El usuario no es miembro de este servidor.');
            } catch (error) {
                logger.error(`Failed to fetch member: ${error.message}`);
                return interaction.reply({
                    content: `❌ No se pudo encontrar al usuario en el servidor`,
                    flags: 64
                });
            }

            // Recuperar roles (excluyendo @everyone)
            const roles = member.roles.cache
                .filter(role => role.name !== '@everyone')
                .map(role => role.name)
                .join(', ') || 'No tiene roles asignados.';

            // Recuperar permisos
            const permissionsArray = member.permissions.toArray();
            const translatedPermissions = permissionsArray
                .map(perm => permissionTranslations[perm] || perm)
                .join('\n') || 'No tiene permisos especiales.';

            // Construir el embed
            const embed = new EmbedBuilder()
                .setColor(0x0062ff)
                .setTitle('🔍 Permisos del Usuario')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '👤 Usuario', value: `${targetUser}`, inline: true },
                    { name: '📜 Roles', value: roles, inline: false },
                    { name: '⚙️ Permisos', value: translatedPermissions, inline: false }
                )
                .setFooter({
                    text: 'RXBot by rxfatalslash',
                    iconURL: 'https://i.imgur.com/iiXUS2V.png'
                })
                .setTimestamp();

            // Enviar la respuesta
            await interaction.reply({ embeds: [embed], flags: 64 });
        } catch (error) {
            logger.error(`Unexpected error in checkperms command: ${error.message}`);
            if (!interaction.replied) {
                await interaction.reply({
                    content: `❌ Ha ocurrido un error inesperado`,
                    flags: 64
                });
            }
        }
    }
};
