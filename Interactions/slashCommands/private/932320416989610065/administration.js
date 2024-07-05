const {
    SlashCommandBuilder,
    EmbedBuilder,
    SlashCommandSubcommandBuilder,
} = require('discord.js');
const databaseService = require('../../../../services/databaseService');
const embeds = require('../../../../util/embed');

const settings = {
    lookup: new SlashCommandSubcommandBuilder()
        .setName('lookup')
        .setDescription("Lookup a user's data.")
        .addStringOption((option) =>
            option
                .setName('username')
                .setDescription('The user to lookup.')
                .setRequired(true),
        ),
    case: new SlashCommandSubcommandBuilder()
        .setName('case')
        .setDescription('Lookup a case.')
        .addIntegerOption((option) =>
            option
                .setName('case')
                .setDescription('The case to lookup.')
                .setRequired(true),
        ),
    settings: new SlashCommandSubcommandBuilder()
        .setName('settings')
        .setDescription('Set Arcade Haven game settings.')
        .addStringOption((option) =>
            option
                .setName('setting')
                .setDescription('The setting to change.')
                .setRequired(true)
                .addChoices(
                    {
                        name: 'Tips',
                        value: 'tips_enabled',
                    },
                    {
                        name: 'Marketplace',
                        value: 'market_enabled',
                    },
                    {
                        name: 'Robux Marketplace',
                        value: 'robux_market',
                    },
                ),
        )
        .addBooleanOption((option) =>
            option
                .setName('enabled')
                .setDescription('The new value of the setting.')
                .setRequired(true),
        ),
    upload: new SlashCommandSubcommandBuilder()
        .setName('upload')
        .setDescription('Upload a file to the server.')
        .addAttachmentOption((option) =>
            option
                .setName('file')
                .setDescription('The file to upload.')
                .setRequired(true),
        ),

    multiban: new SlashCommandSubcommandBuilder()
        .setName('multiban')
        .setDescription('Ban multiple users.'),
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Administrative commands.')
        .addSubcommand(settings.lookup)
        .addSubcommand(settings.case)
        .addSubcommand(settings.settings)
        .addSubcommand(settings.upload)
        .addSubcommand(settings.multiban),
    roles: ['1182048570216546395'],
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        try {
            require(`../../../../util/administration/${subcommand}.js`).execute(
                interaction,
                client,
            );
        } catch (error) {
            console.error(error);
            return embeds.errorEmbed(
                interaction,
                'This command is not implemented yet.',
            );
        }
    },
};
