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

const databaseService = require("../../services/databaseService");
const embeds = require("../embed");

module.exports = {
  async execute(interaction, client) {
    const embed = interaction.message.embeds[0];
    const description = embed.description;
    const lines = description.split("\n");

    const total_winners = lines[0].match(/\*\*(\d+)\*\*/)[1];
    const duration = lines[1].match(/\{\{(\d+)\}\}/)[1];
    const host_id = lines[2].match(/<@(\d+)>/)[1];
    const requirements = lines.slice(5);
    const parsed_requirements = {};

    for (const requirement of requirements) {
      if (requirement.includes("No requirements")) {
        parsed_requirements.none = true;
      } else if (requirement.includes("Must be server boosting")) {
        parsed_requirements.boosting = true;
      } else if (requirement.includes("Be at least **Level")) {
        const level = requirement.match(/Level\s+(\d+)/)[1];
        parsed_requirements.level = Number(level);
      } else if (requirement.includes("Roles:")) {
        parsed_requirements.roles = [...requirement.matchAll(/<@&(\d+)>/g)].map(
          (match) => match[1]
        );
      }
    }

    const database = await databaseService.getDatabase("DiscordServer");
    const collection = database.collection("IrityGiveaways");
    const code = Math.random().toString(36).substring(2, 6);

    await collection.insertOne({
      data: {
        total_winners: Number(total_winners),
        duration: Number(duration),
        requirements: parsed_requirements,
        host: host_id,
        reward: embed.author.name,
      },
      starter: interaction.user.id,
      code,
    });

    return interaction.update({
      embeds: [
        await embeds.successEmbed(
          interaction,
          `Giveaway created! The code is \`${code}\`.`,
          null,
          false,
          true
        ),
      ],
      components: [],
    });
  },
};
