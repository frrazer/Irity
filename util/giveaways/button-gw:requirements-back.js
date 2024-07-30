const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  EmbedBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");

module.exports = {
  async execute(interaction, client) {
    const buttons = [
      new ButtonBuilder()
        .setLabel("Confirm")
        .setStyle(ButtonStyle.Success)
        .setCustomId("giveaway-confirm"),
      new ButtonBuilder()
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Danger)
        .setCustomId("giveaway-cancel"),
    ];

    const options = [
      new StringSelectMenuOptionBuilder()
        .setEmoji(`<:bluedot:1267190531901882532>`)
        .setLabel("Set Prize")
        .setValue("gw:prize"),
      new StringSelectMenuOptionBuilder()
        .setEmoji(`<:bluedot:1267190531901882532>`)
        .setLabel("Set Duration")
        .setValue("gw:duration"),
      new StringSelectMenuOptionBuilder()
        .setEmoji(`<:bluedot:1267190531901882532>`)
        .setLabel("Set Winner Count")
        .setValue("gw:winner-count"),
      new StringSelectMenuOptionBuilder()
        .setEmoji(`<:bluedot:1267190531901882532>`)
        .setLabel("Set Host")
        .setValue("gw:host"),
      new StringSelectMenuOptionBuilder()
        .setEmoji(`<:bluedot:1267190531901882532>`)
        .setLabel("Add Requirement")
        .setValue("gw:requirement"),
    ];

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("giveaway-options")
      .setPlaceholder("Configure your giveaway")
      .addOptions(options);

    const actionRow = new ActionRowBuilder().addComponents(buttons);
    const selectRow = new ActionRowBuilder().addComponents([selectMenu]);

    interaction.update({
      components: [selectRow, actionRow],
    });
  },
};
