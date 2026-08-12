const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const logger = require('../../tools/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sendembed')
        .setDescription('Crea y envía un mensaje embed personalizado mencionando a un rol.')
        .addRoleOption(option => 
            option.setName('mention_role')
                .setDescription('El rol al que deseas mencionar (aparecerá arriba del embed)')
                .setRequired(false) // Cambia a true si quieres que sea obligatorio elegir uno siempre
        ),
        
    async execute(interaction) {
        try {
            // 1. Obtener el rol seleccionado ANTES de abrir el modal
            const role = interaction.options.getRole('mention_role');
            // Crear una cadena de mención si el rol existe, ej: <@&123456789>
            const mentionText = role ? `${role}` : ''; 

            // 2. Crear el formulario flotante (Modal)
            const modal = new ModalBuilder()
                .setCustomId(`embed_modal_${interaction.id}`)
                .setTitle('Configura tu Mensaje Embed');

            // Campos del Modal
            const tituloInput = new TextInputBuilder()
                .setCustomId('embed_title')
                .setLabel('Título del Embed')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Escribe un título llamativo...')
                .setRequired(true);

            const descInput = new TextInputBuilder()
                .setCustomId('embed_desc')
                .setLabel('Descripción / Contenido')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Puedes usar formato markdown tradicional aquí...')
                .setRequired(true);

            const colorInput = new TextInputBuilder()
                .setCustomId('embed_color')
                .setLabel('Color en HEX')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('#0062ff')
                .setRequired(false);

            const imageInput = new TextInputBuilder()
                .setCustomId('embed_image')
                .setLabel('Enlace de la imagen (URL)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('https://ejemplo.com/imagen.png')
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(tituloInput),
                new ActionRowBuilder().addComponents(descInput),
                new ActionRowBuilder().addComponents(colorInput),
                new ActionRowBuilder().addComponents(imageInput)
            );

            // Mostrar el formulario en la pantalla del usuario
            await interaction.showModal(modal);

            // 3. Esperar a que el usuario envíe el formulario (5 minutos)
            const submission = await interaction.awaitModalSubmit({
                time: 300000, 
                filter: i => i.customId === `embed_modal_${interaction.id}`
            });

            // Extraer las respuestas del formulario
            const title = submission.fields.getTextInputValue('embed_title');
            const description = submission.fields.getTextInputValue('embed_desc');
            let color = submission.fields.getTextInputValue('embed_color') || '#0062ff';
            const imageUrl = submission.fields.getTextInputValue('embed_image');

            if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
                color = '#0062ff';
            }

            // 4. Construir el embed del usuario
            const userEmbed = new EmbedBuilder()
                .setColor(color)
                .setTitle(title)
                .setDescription(description)
                .setFooter({
                    text: 'RXBot by rxfatalslash',
                    iconURL: 'https://i.imgur.com/iiXUS2V.png'
                })
                .setTimestamp();

            if (imageUrl && imageUrl.startsWith('http')) {
                userEmbed.setImage(imageUrl);
            }

            // 5. Enviar la respuesta combinada (Texto de mención + Embed)
            // Si el usuario no eligió rol, content estará vacío y solo mandará el embed.
            await submission.channel.send({ 
                content: mentionText, 
                embeds: [userEmbed] 
            });

            // Confirmación privada para el administrador
            await submission.reply({ content: '✅ ¡Mensaje enviado exitosamente con la mención!', flags: 64 });

        } catch (error) {
            if (error.code === 'InteractionCollectorError') {
                logger.warn(`El usuario tardó demasiado en rellenar el modal del embed.`);
            } else {
                logger.error(`Unexpected error in sendembed command: ${error.message}`);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: `❌ Ha ocurrido un error inesperado al procesar el embed.`,
                        flags: 64
                    });
                }
            }
        }
    }
};