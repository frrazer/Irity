const embeds = require("../../util/embed");
const {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  name: "release_item",
  aliases: [],
  async execute(interaction, client) {
    if (interaction.user.id !== interaction.message.interaction.user.id)
      return embeds.errorEmbed(
        interaction,
        "You cannot use this button.",
        null,
        true
      );

    const description = interaction.message.embeds[0].description;
    const name = interaction.message.embeds[0].title;
    const modal = new ModalBuilder()
      .setTitle(`Drop Item`)
      .setCustomId("release_item")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setLabel("Item Name")
            .setPlaceholder("Enter the name of the item")
            .setCustomId("name")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setValue(name)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setLabel("Description")
            .setPlaceholder("Enter a description of the item")
            .setCustomId("description")
            .setRequired(true)
            .setStyle(TextInputStyle.Paragraph)
            .setValue(description)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setLabel("Quantity or Duration")
            .setPlaceholder("Enter the quantity or duration of the item")
            .setCustomId("quantity")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setLabel("Price")
            .setPlaceholder("Enter the Price of the item")
            .setCustomId("price")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setLabel("Drop Method")
            .setPlaceholder('Either "Now" or "Later"')
            .setCustomId("method")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        )
      );

    interaction.showModal(modal);
  },
};
