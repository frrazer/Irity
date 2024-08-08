const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  async execute(interaction, client) {
    const modal = new ModalBuilder()
      .setTitle("Configure Winner Count")
      .setCustomId("gw:winner-count")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("winner-count")
            .setLabel("Winner Count")
            .setPlaceholder("ie. 2")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
        )
      );

    await interaction.showModal(modal);
  },
};
