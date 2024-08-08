const {
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
  } = require("discord.js");
  
  module.exports = {
    async execute(interaction, client) {
      const modal = new ModalBuilder()
        .setTitle("Configure Host")
        .setCustomId("gw:host")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("host")
              .setLabel("Host")
              .setPlaceholder("Discord User ID")
              .setRequired(true)
              .setStyle(TextInputStyle.Short)
          )
        );
  
      await interaction.showModal(modal);
    },
  };
  