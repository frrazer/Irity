const embeds = require('../../util/embed');
const functions = require('../../util/functions');
const { getDatabase } = require('../../services/databaseService');
const { calculateExpression, validateRoles } = require('../../util/functions');
const {
    EmbedBuilder,
    ActionRow,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const { getThumbnails } = require('noblox.js');
const getAiMessage = require('../../util/runAi');

module.exports = {
    name: 'edit_value',
    aliases: ['reject_value'],
    async execute(interaction, client) {
        if (interaction.customId === 'reject_value') {
            return rejectValue(client, interaction);
        }

        try {
            const new_value = calculateExpression(
                interaction.fields.getTextInputValue('value'),
            );
            const reason =
                interaction.fields.getTextInputValue('reason') ||
                'No reason provided.';
            const proof =
                interaction.fields.getTextInputValue('proof') ||
                'No proof provided.';

            // const has_three_links = ((s) => {
            //     const pattern =
            //         /https:\/\/discord\.com\/channels\/\d+\/\d+\/\d+/g;
            //     const matches = s.match(pattern);
            //     return matches && matches.length === 3;
            // })(proof);
            const has_three_links = true;

            if (new_value >= 5000000 && !has_three_links)
                return embeds.errorEmbed(
                    interaction,
                    'Since the value is greater than 5,000,000, you must provide three links as proof.',
                    null,
                    true,
                );

            const db = await getDatabase('ArcadeHaven');
            const items = db.collection('items');
            const item = await items.findOne(
                { name: interaction.message.embeds[0].title },
                { projection: { value: 1, itemId: 1, name: 1 } },
            );
            if (!item)
                return embeds.errorEmbed(
                    interaction,
                    'Item not found.',
                    null,
                    true,
                );

            let requires_approval =
                (item.value === 0 && new_value >= 25000000) ||
                (item.value > 0 &&
                    (new_value >= 25000000 || new_value >= item.value * 2));

            if (requires_approval) {
                interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Value Request Submitted')
                            .setDescription(
                                'Because the value you provided is more than double the current value, or the new value is greater than 25,000,000, this request will be sent to the administration team for approval.',
                            )
                            .setColor('Blue'),
                    ],
                });

                const ai_reason = await getAiMessage(
                    `Item Name: ${item.name}\nCurrent Value: ${
                        item.value === 0 ? 'Unvalued' : item.value
                    }\nRequested Value: ${new_value}\nReason: ${reason}`,
                    'asst_sJa9UQOburmNQNLgN2KUhHLl',
                );

                const embed = new EmbedBuilder()
                    .setTitle(`Value Request: ${item.name}`)
                    .setAuthor({
                        name: `Requested by ${interaction.user.username}`,
                        iconURL: interaction.member.displayAvatarURL(),
                    })
                    .addFields(
                        {
                            name: 'Current Value',
                            value: item.value
                                ? item.value.toLocaleString()
                                : 'N/A',
                            inline: true,
                        },
                        {
                            name: 'New Value',
                            value: new_value.toLocaleString(),
                            inline: true,
                        },
                        {
                            name: `Reason${ai_reason ? ' (AI)' : ''}`,
                            value: ai_reason || reason,
                        },
                        {
                            name: 'Proof',
                            value: proof,
                        },
                    )
                    .setColor('Blue')
                    .setThumbnail(
                        (
                            await getThumbnails([
                                {
                                    type: 'Asset',
                                    size: '150x150',
                                    targetId: Number(item.itemId),
                                    format: 'png',
                                },
                            ])
                        )[0].imageUrl,
                    )
                    .setFooter({
                        text: btoa(interaction.member.id),
                    });

                const logistics_channel = interaction.guild.channels.cache.get(
                    '1254462446102511828',
                );
                logistics_channel.threads.create({
                    name: `Value Request: ${item.name}`,
                    appliedTags: ['1258168183538323527'],
                    reason: `Requested by ${interaction.user.username}`,
                    message: {
                        content:
                            '<@&1069023487647301692> <@&1213276024020934666>',
                        embeds: [embed],
                        components: [
                            new ActionRowBuilder().addComponents([
                                new ButtonBuilder()
                                    .setLabel('Approve')
                                    .setStyle(ButtonStyle.Success)
                                    .setCustomId('approve_value'),
                                new ButtonBuilder()
                                    .setLabel('Reject')
                                    .setStyle(ButtonStyle.Danger)
                                    .setCustomId('reject_value'),
                            ]),
                        ],
                    },
                });
            } else {
                interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Value Changed')
                            .setDescription(
                                'Your value change is now being processed by the system and will be updated shortly.',
                            )
                            .setColor('Blue'),
                    ],
                });

                const ai_reason = await getAiMessage(
                    `Item Name: ${item.name}\nCurrent Value: ${
                        item.value === 0 ? 'Unvalued' : item.value
                    }\nNew Value: ${new_value}\nReason: ${reason}`,
                    'asst_sJa9UQOburmNQNLgN2KUhHLl',
                );

                let fields = [
                    {
                        name: 'Old Value',
                        value: item.value ? item.value.toLocaleString() : 'N/A',
                        inline: true,
                    },
                    {
                        name: 'New Value',
                        value: new_value.toLocaleString(),
                        inline: true,
                    },
                    {
                        name: `Reason${ai_reason ? ' (AI)' : ''}`,
                        value: ai_reason || reason,
                    },
                ];

                const embed = new EmbedBuilder()
                    .setTitle(`${item.name}`)
                    .setAuthor({
                        name: `Changed by ${interaction.user.username}`,
                        iconURL: interaction.member.displayAvatarURL(),
                    })
                    .addFields(...fields)
                    .setColor('Blue')
                    .setThumbnail(
                        (
                            await getThumbnails([
                                {
                                    type: 'Asset',
                                    size: '150x150',
                                    targetId: Number(item.itemId),
                                    format: 'png',
                                },
                            ])
                        )[0].imageUrl,
                    );

                const public_channel = interaction.guild.channels.cache.get(
                    '1139839306790346822',
                );
                await public_channel.send({
                    embeds: [embed],
                    content: '<@&1145352839317704754>',
                });

                fields.push({
                    name: 'Proof',
                    value: proof,
                });
                embed.setTitle(`Value Changed: ${item.name}`);
                embed.setFields(...fields);

                const logistics_channel = interaction.guild.channels.cache.get(
                    '1254462446102511828',
                );

                logistics_channel.threads.create({
                    name: `Value Change: ${item.name}`,
                    appliedTags: ['1258185189218324580'],
                    reason: `Changed by ${interaction.user.username}`,
                    message: {
                        embeds: [embed],
                    },
                });

                return items.updateOne(
                    { name: item.name },
                    {
                        $set: {
                            value: new_value,
                        },
                    },
                );
            }
        } catch (error) {
            console.error(error);
            if (error.message === 'Invalid expression')
                return embeds.errorEmbed(
                    interaction,
                    'Invalid value provided.',
                    null,
                    true,
                );
            else
                return embeds.errorEmbed(
                    interaction,
                    'An error occurred.',
                    error.message,
                    true,
                );
        }
    },
};

async function rejectValue(client, interaction) {
    const reason = interaction.fields.getTextInputValue('reason');
    const requester_id = atob(interaction.message.embeds[0].footer.text);
    const member = await interaction.guild.members.fetch(requester_id);
    const item_name = interaction.message.embeds[0].title.split(': ')[1];

    const embed = new EmbedBuilder()
        .setTitle('Value Change Rejected')
        .setDescription(
            `Your value change request for **${item_name}** has been rejected.`,
        )
        .addFields(
            {
                name: 'Reason',
                value: reason,
            },
            {
                name: 'Requested Value',
                value: interaction.message.embeds[0].fields[1].value,
            },
        )
        .setColor('Red')
        .setFooter({
            text: `Rejected by ${interaction.user.username}`,
            iconURL: interaction.member.displayAvatarURL(),
        })
        .setThumbnail(interaction.message.embeds[0].thumbnail.url);

    const public_channel = interaction.guild.channels.cache.get(
        '1143600212145872998',
    );
    await public_channel.send({ embeds: [embed], content: `<@${member.id}>` });

    await interaction.update({
        components: [
            new ActionRowBuilder().addComponents(
                ButtonBuilder.from(
                    interaction.message.components[0].components[1],
                )
                    .setDisabled(true)
                    .setLabel('Rejected'),
            ),
        ],
    });

    await interaction.channel.send({
        embeds: [
            await embeds.errorEmbed(
                interaction,
                'The value has been rejected.',
                null,
                false,
                true,
            ),
        ],
    });

    return interaction.channel.edit({
        name: `Value Rejected: ${item_name}`,
        appliedTags: ['1258239698393104435'],
        reason: `Rejected by ${interaction.user.username}`,
        archived: true,
    });
}
