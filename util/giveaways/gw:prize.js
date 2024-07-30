const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  async execute(interaction, client) {
    const modal = new ModalBuilder()
      .setTitle("Configure Prize")
      .setCustomId("gw:prize")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("prize")
            .setLabel("Prize")
            .setPlaceholder("ie. 180,000,000 Value")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
        )
      );

    await interaction.showModal(modal);
  },
};
