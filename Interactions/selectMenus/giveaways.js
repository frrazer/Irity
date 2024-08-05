const embeds = require("../../util/embed");

module.exports = {
  name: "giveaway-options",
  aliases: [
    "gw:prize",
    "gw:duration",
    "gw:winner-count",
    "gw:host",
    "gw:requirement",
    "gw:remove-requirement",
  ],
  async execute(interaction, client) {
    if (interaction.user.id !== interaction.message.interaction.user.id)
      return embeds.errorEmbed(
        interaction,
        "You cannot use this dropdown.",
        null,
        true
      );

    const customId = interaction.values[0];

    try {
      require(`../../util/giveaways/${customId}.js`).execute(
        interaction,
        client
      );
    } catch (error) {
      console.error(error);
      return embeds.errorEmbed(
        interaction,
        "This command is not implemented yet."
      );
    }
  },
};
