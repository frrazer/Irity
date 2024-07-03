const embeds = require('../../util/embed');
const functions = require('../../util/functions');
const dropItem = require('../../util/dropItem');
const { getDatabase } = require('../../services/databaseService');

module.exports = {
    name: 'release_item',
    aliases: [],
    async execute(interaction, client) {
        if (interaction.user.id !== interaction.message.interaction.user.id)
            return embeds.errorEmbed(
                interaction,
                'You cannot use this modal.',
                null,
                true,
            );

        try {
            const name = interaction.fields.getTextInputValue('name');
            const description =
                interaction.fields.getTextInputValue('description');
            const quantity_or_duration =
                interaction.fields.getTextInputValue('quantity');
            const price = interaction.fields.getTextInputValue('price');
            const method =
                interaction.fields.getTextInputValue('method') || 'Later';
            const image = interaction.message.embeds[0].thumbnail.url;
            const item_id =
                interaction.message.embeds[0].footer.text.match(/\d+/)[0];
            const creator = interaction.message.embeds[0].fields[1].value.match(
                /\[([^\[\]]+?)(\s<:verified:\d+>)?\]\(https:\/\/www\.roblox\.com\/users\/\d+\/profile\)/,
            )[1];

            if (!['Now', 'Later'].includes(method))
                return embeds.errorEmbed(
                    interaction,
                    'Invalid drop method.',
                    null,
                    true,
                );

            let meta_data = {
                Name: name,
                Creator: { Name: creator },
                Description: description,
                Image: image,
            };

            if (method === 'Now') {
                if (Number(quantity_or_duration)) {
                    try {
                        await dropItem(
                            client,
                            Number(item_id),
                            {
                                price: price,
                                limited_type: 'unique',
                                quantity: Number(quantity_or_duration),
                            },
                            2,
                            meta_data,
                        );

                        return embeds.successEmbed(
                            interaction,
                            'Item dropped successfully.',
                            null,
                            false,
                        );
                    } catch (error) {
                        return embeds.errorEmbed(
                            interaction,
                            'Something went wrong while dropping the item. (Unique)',
                            null,
                            true,
                        );
                    }
                } else {
                    try {
                        functions.stringToDuration(quantity_or_duration);

                        await dropItem(
                            client,
                            Number(item_id),
                            {
                                price: price,
                                limited_type: 'limited',
                                date: quantity_or_duration,
                            },
                            2,
                            meta_data,
                        );

                        return embeds.successEmbed(
                            interaction,
                            'Item dropped successfully.',
                            null,
                            false,
                        );
                    } catch (error) {
                        return embeds.errorEmbed(
                            interaction,
                            'Something went wrong while dropping the item. (Limited)',
                            null,
                            true,
                        );
                    }
                }
            } else if (method === 'Later') {
                const auto_dropper = (
                    await getDatabase('ArcadeHaven')
                ).collection('auto_dropper');
                const find_result = await auto_dropper.findOne({
                    item_id: Number(item_id),
                });

                if (find_result)
                    return embeds.errorEmbed(
                        interaction,
                        'This item is already on our autodropper database. If you want to update the price or quantity, please remove the item and add it again.',
                        null,
                        true,
                    );

                let is_duration = false;
                try {
                    functions.stringToDuration(quantity_or_duration);
                    is_duration = true;
                } catch (error) {
                    is_duration = false;
                }

                const doc = {
                    item_id: Number(item_id),
                    limited_type: is_duration ? 'limited' : 'unique',
                    price: Number(price),
                    [is_duration ? 'date' : 'quantity']: is_duration
                        ? quantity_or_duration
                        : Number(quantity),
                    user: interaction.user.id,
                };

                auto_dropper.insertOne(doc);

                return embeds.successEmbed(
                    interaction,
                    'Item added to autodropper.',
                    null,
                    false,
                );
            }
        } catch (error) {
            console.error(error);
            return embeds.errorEmbed(
                interaction,
                'An unexpected error occurred.',
                null,
                true,
            );
        }
    },
};
