const embeds = require("../../util/embed");

module.exports = {
  name: "giveaways",
  aliases: [
    "giveaway-confirm",
    "giveaway-cancel",
    "gw:requirements-back",
    "giveaway-enter",
    "giveaway-leave",
  ],
  async execute(interaction, client) {
    if (
      interaction.message.interaction &&
      interaction.user.id !== interaction.message.interaction.user.id
    )
      return embeds.errorEmbed(
        interaction,
        "You cannot use this button.",
        null,
        true
      );

    const customId = interaction.customId;

    try {
      require(`../../util/giveaways/button-${customId}.js`).execute(
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
