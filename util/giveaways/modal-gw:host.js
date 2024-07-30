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
    const host = interaction.fields.getTextInputValue("host");
    const guild = interaction.guild;
    let host_member;

    try {
      host_member = await guild.members.fetch(host);
    } catch (error) {
      return errorEmbed(
        interaction,
        "Invalid host, must be a valid Discord User ID.",
        null,
        true
      );
    }

    const embed = EmbedBuilder.from(interaction.message.embeds[0]);
    const each_line = embed.data.description.split("\n");
    each_line[2] = `<:grey_dot:1264285450995105823> Hosted by ${host_member}`;
    embed.setDescription(each_line.join("\n"));

    await interaction.update({
      embeds: [embed],
    });
  },
};
