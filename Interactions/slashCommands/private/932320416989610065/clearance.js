const {
    SlashCommandSubcommandBuilder,
    SlashCommandBuilder,
    EmbedBuilder,
} = require('discord.js');
const embeds = require('../../../../util/embed');
const { calculateClearance, getPermissions, permissionCheck } = require('../../../../util/calculateClearance');

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
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearance')
        .setDescription('Check clearance levels.')
        .addSubcommand(settings.check)
        .addSubcommand(settings.list),
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'check') {
            const user = interaction.options.getUser('user');
            const userClearance = calculateClearance(user.id);

            const embed = new EmbedBuilder()
                .setTitle('User Clearance')
                .setDescription(`Clearance level: ${userClearance}`)
                .setColor('Blue');

            await interaction.reply({ embeds: [embed], ephemeral: true });
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
    }
};
