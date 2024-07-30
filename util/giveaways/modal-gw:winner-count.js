const { convertToSeconds } = require("../functions");
const { errorEmbed } = require("../embed");

const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  async execute(interaction, client) {
    let winnerCount = interaction.fields.getTextInputValue("winner-count");

    try {
      winnerCount = parseInt(winnerCount);
    } catch (error) {
      return errorEmbed(
        interaction,
        "Invalid winner count, must be a number.",
        null,
        true
      );
    }

    if (winnerCount > 50) {
      return errorEmbed(
        interaction,
        "Winner count cannot exceed 50.",
        null,
        true
      );
    }

    const embed = EmbedBuilder.from(interaction.message.embeds[0]);
    const each_line = embed.data.description.split("\n");
    each_line[0] = `<:grey_dot:1264285450995105823> **${winnerCount}** Winner${winnerCount > 1 ? "s" : ""}`;
    embed.setDescription(each_line.join("\n"));

    await interaction.update({
      embeds: [embed],
    });
  },
};
