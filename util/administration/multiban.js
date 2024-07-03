const {
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder,
} = require('discord.js');
const databaseService = require('../../services/databaseService');
const robloxService = require('../../services/robloxService');
const embeds = require('../../util/embed');
const { getIdFromUsername } = require('noblox.js');

async function createCase(data) {
    const database = await databaseService.getDatabase('ArcadeHaven');
    const collection = database.collection('ModerationCases');
    const caseId = (await collection.countDocuments()) + 1;
    const doc = {
        caseId,
        ...data,
    };

    console.log(doc);

    await collection.insertOne(doc);

    return caseId;
}

async function logAction(client, data, case_id) {
    let guild = client.guilds.cache.get('932320416989610065');

    if (!guild) {
        try {
            guild = await client.guilds.fetch('932320416989610065');
        } catch (error) {
            guild = null;
        }
    }

    const channel = guild.channels.cache.get('1118861387704320030');
    const message = channel.send(data);

    const database = await databaseService.getDatabase('ArcadeHaven');
    const collection = database.collection('ModerationCases');
    collection.updateOne({ caseId: case_id }, { $set: { message: data } });
}

module.exports = {
    async execute(interaction, client) {
        const modal = new ModalBuilder()
            .setTitle(`Multi-Ban`)
            .setCustomId('administration/multiban')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setLabel('Usernames')
                        .setPlaceholder('Username1\nUsername2\nUsername3\n...')
                        .setCustomId('usernames')
                        .setRequired(true)
                        .setStyle(TextInputStyle.Paragraph),
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setLabel('Rule Violation')
                        .setPlaceholder(
                            'Which rule number did the users break?',
                        )
                        .setCustomId('reason')
                        .setRequired(true)
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(1)
                        .setMaxLength(2),
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setLabel('Duration')
                        .setPlaceholder('Enter the duration of the bans')
                        .setCustomId('duration')
                        .setRequired(true)
                        .setStyle(TextInputStyle.Short),
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setLabel('Proof')
                        .setPlaceholder('Paste each link on a new line')
                        .setCustomId('proof')
                        .setRequired(true)
                        .setStyle(TextInputStyle.Paragraph),
                ),
            );

        await interaction.showModal(modal);
    },

    modal: async (interaction, client) => {
        const usernames = interaction.fields
            .getTextInputValue('usernames')
            .split('\n');
        const reason = interaction.fields.getTextInputValue('reason');
        const duration = interaction.fields.getTextInputValue('duration');
        const proof = interaction.fields.getTextInputValue('proof');

        interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .addFields(
                        {
                            name: 'Successes',
                            value: `\`0/${usernames.length}\``,
                            inline: true,
                        },
                        {
                            name: 'Failures',
                            value: '**0**',
                            inline: true,
                        },
                    )
                    .setColor('Blue')
                    .setDescription('Banning users...'),
            ],
        });

        const bans = [];
        let successes = [];
        let failures = [];

        for (const username of usernames) {
            try {
                const userId = await getIdFromUsername(username);
                await robloxService.gameBan(
                    `MAIN_${userId}`,
                    reason,
                    duration,
                    true,
                );

                successes.push(username);

                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .addFields(
                                {
                                    name: 'Successes',
                                    value: `\`${successes.length}/${usernames.length}\``,
                                    inline: true,
                                },
                                {
                                    name: 'Failures',
                                    value: `**${failures.length}**`,
                                    inline: true,
                                },
                            )
                            .setColor('Blue')
                            .setDescription('Banning users...'),
                    ],
                });

                const case_id = await createCase({
                    type: 'Multi-Ban',
                    target: userId,
                    reason,
                    moderator: interaction.user.id,
                    proof,
                    timestamp: Date.now(),
                });

                logAction(
                    client,
                    {
                        embeds: [
                            new EmbedBuilder()
                                .addFields(
                                    {
                                        name: 'Case',
                                        value: `\`${case_id}\``,
                                        inline: true,
                                    },
                                    {
                                        name: 'Type',
                                        value: '`Multi-Ban`',
                                        inline: true,
                                    },
                                    {
                                        name: 'Moderator',
                                        value: `\`${interaction.user.username}\``,
                                        inline: true,
                                    },
                                    {
                                        name: 'Target',
                                        value: `<:singleright:1252703372998611085> [\`@${username}\`](https://www.roblox.com/users/${userId}/profile)`,
                                        inline: true,
                                    },
                                    {
                                        name: 'Rule Violation',
                                        value: reason,
                                        inline: true,
                                    },
                                    {
                                        name: 'Proof',
                                        value: proof,
                                    },
                                )
                                .setTimestamp(new Date())
                                .setColor('Red'),
                        ],
                    },
                    case_id,
                );
            } catch (error) {
                if (successes.findIndex((u) => u === username) === -1) {
                    failures.push(username);
                }
            }

            // wait 2 seconds before banning the next user
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .addFields(
                        {
                            name: 'Successes',
                            value: `\`${successes.length}/${usernames.length}\``,
                            inline: true,
                        },
                        {
                            name: 'Failures',
                            value: `**${failures.length}**`,
                            inline: true,
                        },
                    )
                    .setColor('Green')
                    .setDescription(
                        '<:tt_ys:1187754951171125249> Bans Complete!',
                    ),
            ],
        });
    },
};
