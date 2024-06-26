const embeds = require("../../util/embed")

module.exports = {
  name: "administration/lookup",
  aliases: [
    "administration/lookup/gameban",
    "administration/lookup/edit",
    "administration/lookup/history",
    "administration/lookup/history/previous",
    "administration/lookup/history/next",
    "administration/lookup/history/previous-far",
    "administration/lookup/history/next-far",
    "administration/lookup/history/close",
    "administration/lookup/unban",
    "administration/lookup/getraw",
    "administration/lookup/transfer",
  ],
  async execute(interaction, client) {
    if (interaction.user.id !== interaction.message.interaction.user.id)
      return embeds.errorEmbed(interaction, "You cannot use this button.", null, true);

    return require("../../util/administration/lookup").button(interaction, client);
  },
};
