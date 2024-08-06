const {
    SlashCommandSubcommandBuilder,
    SlashCommandBuilder,
    EmbedBuilder,
} = require('discord.js');
const embeds = require('../../../../util/embed');
const { calculateClearance, getPermissions, permissionCheck } = require('../../../../util/calculateClearance');
const { permissions } = require('../../../../util/functions');

const settings = {
    check: new SlashCommandSubcommandBuilder()
        .setName('check')
        .setDescription('Check a user\'s clearance level.')
        .addUserOption(user => 
            user
                .setName('user')
                .setDescription('The user to check clearance for.')
                .setRequired(true)
        ),
    list: new SlashCommandSubcommandBuilder()
        .setName('list')
        .setDescription('List permissions for a clearance level.')
        .addStringOption((option) =>
            option
                .setName('level')
                .setDescription('The clearance level to list permissions for.')
                .setRequired(true),
        ),
    permissions: new SlashCommandSubcommandBuilder()
        .setName('permissions')
        .setDescription('Check a user\'s permissions.')
        .addUserOption(user => 
            user
                .setName('user')
                .setDescription('The user to check permissions for.')
                .setRequired(true)
        ),
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearance')
        .setDescription('Check clearance levels.')
        .addSubcommand(settings.check)
        .addSubcommand(settings.list)
        .addSubcommand(settings.permissions),
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();


        if (subcommand === 'check') {
            const user = interaction.options.getUser('user');
            
            try {
                const userClearance = await calculateClearance(user.id);
        
                const clearanceRoles = Array.isArray(userClearance) ? userClearance.join(', ') : userClearance;
        
                const embed = new EmbedBuilder()
                    .setTitle('User Clearance')
                    .setDescription(`Clearance level: ${clearanceRoles}`)
                    .setColor('Blue');
        
                await interaction.reply({ embeds: [embed], ephemeral: true });
            } catch (error) {
                console.error('Error calculating clearance:', error);
                await interaction.reply({ content: 'There was an error calculating the clearance level. Please try again later.', ephemeral: true });
            }
        }
        
        else if (subcommand === 'list') {
            const level = interaction.options.getString('level');
            const permissions = getPermissions(level);

            const embed = new EmbedBuilder()
                .setTitle('Permissions')
                .setDescription(permissions.join('\n'))
                .setColor('Blue');

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        else if (subcommand === 'permissions') {
            const user = interaction.options.getUser('user');
            const userPermissions = await permissionCheck(user.id);
            const description = userPermissions.length ? userPermissions.join('\n') : 'No permissions found for this user';

            const embed = new EmbedBuilder()
                .setTitle('User Permissions')
                .setDescription(description)
                .setColor('Blue');

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
