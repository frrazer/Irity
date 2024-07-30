const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require("discord.js");
const { errorEmbed } = require("../embed");

module.exports = {
  async execute(interaction, client) {
    let level = interaction.fields.getTextInputValue("level");
    if (isNaN(parseInt(level))) {
      return errorEmbed(
        interaction,
        "Invalid level, must be a number.",
        null,
        true
      );
    }

    level = parseInt(level);

    const embed = EmbedBuilder.from(interaction.message.embeds[0]);
    const each_line = embed.data.description.split("\n");
    const requirements = each_line.splice(5);
    if (requirements[0].includes("No requirements")) {
      requirements.shift();
    }

    const line = requirements.find((l) => l.includes("Be at least **Level"));
    const index = requirements.indexOf(line);

    if (line) {
      if (level > 0) {
        requirements[index] = `<:bluedot:1267190531901882532> Be at least **Level ${level}**`;
      } else {
        requirements.splice(index, 1);
      }
    } else {
      if (level > 0) {
        requirements.push(`<:bluedot:1267190531901882532> Be at least **Level ${level}**`);
      }
    }

    if (requirements.length === 0) {
      requirements.unshift("<:bluedot:1267190531901882532> No requirements!");
    }

    const new_description = each_line.concat(requirements).join("\n");
    embed.setDescription(new_description);

    await interaction.update({
      embeds: [embed],
    });
  },
};
