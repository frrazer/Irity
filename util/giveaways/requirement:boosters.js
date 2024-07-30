const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  async execute(interaction, client) {
    const embed = EmbedBuilder.from(interaction.message.embeds[0]);
    const each_line = embed.data.description.split("\n");
    const requirements = each_line.splice(5);

    if (requirements[0].includes("No requirements")) {
      requirements.shift();
    }

    const line = requirements.find((l) =>
      l.includes("Must be server boosting")
    );

    if (line) {
      const index = requirements.indexOf(line);
      requirements.splice(index, 1);
    } else {
      requirements.unshift(
        "<:bluedot:1267190531901882532> *Must be server boosting!* <a:boosting:1267191928676548730>"
      );
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
