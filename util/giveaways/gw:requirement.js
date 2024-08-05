const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  StringSelectMenuOptionBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  async execute(interaction, client) {
    const options = [
      new StringSelectMenuOptionBuilder()
        .setEmoji(`<a:boosting:1267191928676548730>`)
        .setLabel("Toggle Boosters Only")
        .setValue("requirement:boosters"),
      new StringSelectMenuOptionBuilder()
        .setEmoji(`<:bluedot:1267190531901882532>`)
        .setLabel("Add Role Requirement")
        .setValue("requirement:role"),
      new StringSelectMenuOptionBuilder()
        .setEmoji(`<:bluedot:1267190531901882532>`)
        .setLabel("Add Level Requirement")
        .setValue("requirement:level"),
    ];

    const buttons = [
      new ButtonBuilder()
        .setLabel("Back")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("<:singleleft:1252703411431014503>")
        .setCustomId("gw:requirements-back"),
    ];

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("giveaway-options")
      .setPlaceholder("Select a requirement")
      .addOptions(options);

    await interaction.update({
      components: [
        new ActionRowBuilder().addComponents(selectMenu),
        new ActionRowBuilder().addComponents(buttons),
      ],
    });
  },
};
