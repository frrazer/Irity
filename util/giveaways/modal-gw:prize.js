const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  async execute(interaction, client) {
    const prize = interaction.fields.getTextInputValue("prize");
    const embed = EmbedBuilder.from(interaction.message.embeds[0]);
    embed.setAuthor({
      name: prize,
      iconURL:
        "https://cdn.discordapp.com/emojis/1267192501203107920.webp?size=56&quality=lossless",
    });

    await interaction.update({
      embeds: [embed],
    });
  },
};
