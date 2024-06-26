module.exports = {
    name: "administration/lookup",
    aliases: [
        "administration/lookup/gameban",
        "administration/lookup/edit",
        "administration/lookup/unban",
        "administration/lookup/transfer"
    ],
    async execute(interaction, client) {
        if (interaction.user.id !== interaction.message.interaction.user.id)
            return embeds.errorEmbed(interaction, "You cannot use this modal.", null, true);

        return require("../../util/administration/lookup").modal(interaction, client);
    }
}