const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  async execute(interaction, client) {
    const modal = new ModalBuilder()
      .setTitle("Configure Role Requirement")
      .setCustomId("gw:role-requirement")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("roles")
            .setLabel("Role IDs")
            .setPlaceholder("Role IDs separated by commas")
            .setRequired(false)
            .setStyle(TextInputStyle.Short)
        )
      );

    await interaction.showModal(modal);
  },
};
