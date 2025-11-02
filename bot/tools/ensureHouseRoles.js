const { PermissionsBitField } = require('discord.js');
const logger = require('./logger');

/**
 * 
 * @param {import('discord.js').Guild} guild 
 * @param {{ enforceColor?: boolean }} [opts] 
 * @returns {Promise<{
 *  roles: Record<'gryffindor'|'slytherin'|'ravenclaw'|'hufflepuff', import('discord.js').Role>,
 *  created: Array<'gryffindor'|'slytherin'|'ravenclaw'|'hufflepuff'>
 * }>}
 */

async function ensureHouseRoles(guild, opts = {}) {
    const { enforceColor = true } = opts;

    /** @type {Record<'gryffindor'|'slytherin'|'ravenclaw'|'hufflepuff', { name: string, color: `#${string}` }>} */
    const HOUSES = {
        gryffindor: { name: "Gryffindor", color: "#AE0001" },
        slytherin: { name: "Slytherin", color: "#2A623D" },
        ravenclaw: { name: "Ravenclaw", color: "#0E1A40" },
        hufflepuff: {name: "Hufflepuff" , color: "#FFD800" }
    };

    // Permisos
    const me = guild.members.me || await guild.members.fetchMe().catch(() => null);
    if (!me || !me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        throw new Error('El bot no tiene permiso "Manage Roles" en este servidor');
    }

    // Asegura cache de roles
    await guild.roles.fetch();

    /** @type {Record<'gryffindor'|'slytherin'|'ravenclaw'|'hufflepuff', import('discord.js').Role>} */
    const roles = /** @type any */ ({});
    /** @type {Array<'gryffindor'|'slytherin'|'ravenclaw'|'hufflepuff'>} */
    const created = [];

    for (const [key, meta] of Object.entries(HOUSES)) {
        let role = guild.roles.cache.find( r => r.name.toLowerCase() === meta.name.toLowerCase());

        if (!role) {
            try {
                role = await guild.roles.create({
                    name: meta.name,
                    color: meta.color,
                    hoist: true,
                    mentionable: false,
                    reason: 'Setup automático de roles de casas de Hogwarts'
                });
                created.push(/** @type any */ (key));
                logger.info(`[Houses] Rol creado: ${meta.name} (${role.id})`);
            } catch(e) {
                logger.error(`[Houses] Error creando rol ${meta.name}: ${e.message}`);
                throw e;
            }
        } else if (enforceColor && role.hexColor?.toLowerCase() !== meta.color.toLowerCase()) {
            try {
                await role.setColor(meta.color, 'Ajuste de color de casa');
                logger.info(`[Houses] Color ajustado: ${role.name} -> ${meta.color}`);
            } catch(e) {
                logger.warn(`[Houses] No se pudo ajustar color de ${role.name}: ${e.message}`);
            }
        }

        roles[/** @type any */ (key)] = role;
    }

    return { roles, created };
}

module.exports = { ensureHouseRoles };
