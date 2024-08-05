const embeds = require('../../util/embed');
const { validateRoles } = require('../../util/functions');
const { getDatabase } = require('../../services/databaseService');
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');

module.exports = {
    name: '',
    aliases: ['approve_value', 'reject_value'],
    async execute(interaction, client) {
        if (
            !validateRoles(interaction.member, ['1069023487647301692'], 'one')
        ) {
            return embeds.errorEmbed(
                interaction,
                'You cannot use this button.',
                null,
                true,
            );
        }

        if (interaction.customId === 'approve_value') {
            const title = interaction.message.embeds[0].title;
            const item_name = title.substring(title.indexOf(': ') + 2);
            const new_value =
                interaction.message.embeds[0].fields[1].value.replace(/,/g, '');
            const image_url = interaction.message.embeds[0].thumbnail.url;
            const reason = {
                name: interaction.message.embeds[0].fields[2].name,
                value: interaction.message.embeds[0].fields[2].value,
            };
            const author = {
                name: interaction.message.embeds[0].author.name,
                iconURL: interaction.message.embeds[0].author.iconURL,
            };

            const database = await getDatabase('ArcadeHaven');
            const items = database.collection('items');
            const item = await items.findOne(
                { name: item_name },
                { projection: { itemId: 1, name: 1, value: 1 } },
            );

            if (!item) {
                return embeds.errorEmbed(
                    interaction,
                    'This item seems to have been deleted.',
                    'Delete this post if it is no longer needed.',
                );
            }

            const new_value_int = parseInt(new_value);
            if (isNaN(new_value_int)) {
                return embeds.errorEmbed(
                    interaction,
                    'I was unable to parse the new value.',
                    null,
                );
            }

            await interaction.update({
                components: [
                    new ActionRowBuilder().addComponents(
                        ButtonBuilder.from(
                            interaction.message.components[0].components[0],
                        )
                            .setDisabled(true)
                            .setLabel('Approved'),
                    ),
                ],
            });

            const processing_message = await interaction.channel.send({
                embeds: [
                    await embeds.neutralEmbed(
                        interaction,
                        'Processing...',
                        null,
                        false,
                        true,
                    ),
                ],
            });

            await items.updateOne(
                { itemId: item.itemId },
                {
                    $set: {
                        value: new_value_int,
                    },
                },
            );

            let fields = [
                {
                    name: 'Old Value',
                    value: item.value ? item.value.toLocaleString() : 'N/A',
                    inline: true,
                },
                {
                    name: 'New Value',
                    value: new_value_int.toLocaleString(),
                    inline: true,
                },
                reason,
            ];

            const embed = new EmbedBuilder()
                .setTitle(`${item.name}`)
                .setAuthor(author)
                .addFields(...fields)
                .setColor('Blue')
                .setThumbnail(image_url)
                .setFooter({
                    text: `Approved by ${interaction.user.username}`,
                    iconURL: interaction.member.displayAvatarURL(),
                });

            const public_channel = interaction.guild.channels.cache.get(
                '1139839306790346822',
            );
            await public_channel.send({
                embeds: [embed],
                content: `<@&1145352839317704754>`,
            });

            await processing_message.delete();

            await interaction.channel.send({
                embeds: [
                    await embeds.successEmbed(
                        interaction,
                        'The value has been approved.',
                        null,
                        false,
                        true,
                    ),
                ],
            });

            interaction.channel.edit({
                name: `Value Change: ${item_name}`,
                appliedTags: ['1258232753187717162'],
                reason: `Value approved by ${interaction.user.username}`,
                archived: true,
            });
        } else if (interaction.customId === 'reject_value') {
            const modal = new ModalBuilder()
                .setTitle('Value Rejection')
                .setCustomId('reject_value')
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('reason')
                            .setLabel('Reason')
                            .setPlaceholder(
                                'Why are you rejecting this value? This will help the Valuer understand what needs to be changed.',
                            )
                            .setRequired(false)
                            .setStyle(TextInputStyle.Paragraph),
                    ),
                );

            await interaction.showModal(modal);
        }
    },
};
