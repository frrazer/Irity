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
    const duration = interaction.fields.getTextInputValue("duration");
    let seconds;

    try {
      seconds = convertToSeconds(duration);
    } catch (error) {
      return errorEmbed(
        interaction,
        "Invalid duration format. Use a valid format like `1 day`.",
        null,
        true
      );
    }

    if (seconds < 30) {
      return errorEmbed(
        interaction,
        "Duration must be at least 30 seconds.",
        null,
        true
      );
    }

    const embed = EmbedBuilder.from(interaction.message.embeds[0]);
    const each_line = embed.data.description.split("\n");
    each_line[1] = `<:grey_dot:1264285450995105823> Ending {{${seconds}}}`;
    embed.setDescription(each_line.join("\n"));

    await interaction.update({
      embeds: [embed],
    });
  },
};
