const embeds = require("../../util/embed");

module.exports = {
  name: "",
  aliases: [
    "gw:prize",
    "gw:duration",
    "gw:winner-count",
    "gw:host",
    "gw:requirement",
    "gw:remove-requirement",
    "gw:role-requirement",
    "gw:level-requirement"
  ],
  async execute(interaction, client) {
    const customId = interaction.customId

    try {
      require(`../../util/giveaways/modal-${customId}.js`).execute(
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
