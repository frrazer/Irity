const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  async execute(interaction, client) {
    const roles = interaction.fields.getTextInputValue("roles");
    const role_ids = roles.replace(/\s/g, "").split(",");
    const role_mentions = role_ids.map((id) => `<@&${id}>`);

    if (role_ids[0] === "") {
      role_ids.shift();
    }

    const embed = EmbedBuilder.from(interaction.message.embeds[0]);
    const each_line = embed.data.description.split("\n");
    const requirements = each_line.splice(5);
    if (requirements[0].includes("No requirements")) {
      requirements.shift();
    }

    const line = requirements.find((l) => l.includes("Roles:"));
    const index = requirements.indexOf(line);

    if (line) {
      if (role_ids.length === 0) {
        requirements.splice(index, 1);
      } else {
        requirements[
          index
        ] = `<:bluedot:1267190531901882532> Roles: ${role_mentions.join(", ")}`;
      }
    } else if (role_ids.length > 0) {
      requirements.push(
        `<:bluedot:1267190531901882532> Roles: ${role_mentions.join(", ")}`
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
