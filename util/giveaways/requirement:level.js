const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  async execute(interaction, client) {
    const modal = new ModalBuilder()
      .setTitle("Configure Level Requirement")
      .setCustomId("gw:level-requirement")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("level")
            .setLabel("Minimum Level")
            .setPlaceholder("ie. 10")
            .setRequired(false)
            .setStyle(TextInputStyle.Short)
        )
      );

    await interaction.showModal(modal);
  },
};
