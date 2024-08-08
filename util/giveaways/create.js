const {
  EmbedBuilder,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
  StringSelectMenuOptionBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

module.exports = {
  async execute(interaction, client) {
    const initalEmbed = new EmbedBuilder()
      .setAuthor({
        iconURL:
          "https://cdn.discordapp.com/emojis/1267192501203107920.webp?size=56&quality=lossless",
        name: "Giveaway Reward",
      })
      .setDescription(
        `
        <:grey_dot:1264285450995105823> **1** Winner
        <:grey_dot:1264285450995105823> Ending {{86400}}
        <:grey_dot:1264285450995105823> Hosted by <@${interaction.user.id}>

        **Requirements:**
        <:bluedot:1267190531901882532> No requirements!
    `
      )
      .setColor("Blue");

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

    interaction.reply({
      embeds: [initalEmbed],
      components: [selectRow, actionRow],
    });
  },
};
