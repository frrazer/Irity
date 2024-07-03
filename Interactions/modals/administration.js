module.exports = {
    name: 'administration/lookup',
    aliases: [
        'administration/lookup/gameban',
        'administration/lookup/edit',
        'administration/lookup/unban',
        'administration/lookup/transfer',
        'administration/multiban',
    ],
    async execute(interaction, client) {
        if (interaction.message) {
            if (interaction.user.id !== interaction.message.interaction.user.id)
                return embeds.errorEmbed(
                    interaction,
                    'You cannot use this modal.',
                    null,
                    true,
                );
        }

        if (interaction.customId === 'administration/multiban') {
            require('../../util/administration/multiban').modal(
                interaction,
                client,
            );
            return;
        }

        return require('../../util/administration/lookup').modal(
            interaction,
            client,
        );
    },
};
