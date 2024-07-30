const databaseService = require("../../services/databaseService");
const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const embeds = require("../../util/embed");

module.exports = {
  async execute(interaction, client) {
    const user_id = interaction.user.id;
    const giveaway_id = interaction.message.reference.messageId;
    const database = await databaseService.getDatabase("DiscordServer");
    const collection = database.collection("GiveawayEntries");

    const entry = await collection.findOne({ user_id, giveaway_id });
    if (!entry) {
      return interaction.reply({
        embeds: [
          await embeds.errorEmbed(
            interaction,
            "You have not entered this giveaway yet!",
            null,
            true,
            true
          ),
        ],
        ephemeral: true,
      });
    }

    await collection.deleteOne({ user_id, giveaway_id });

    interaction.update({
      embeds: [
        await embeds.successEmbed(
          interaction,
          "You have left this giveaway.",
          null,
          true,
          true
        ),
      ],
      components: []
    });
  },
};
