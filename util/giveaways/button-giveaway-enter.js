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
    const giveaway_id = interaction.message.id;
    const database = await databaseService.getDatabase("DiscordServer");
    const collection = database.collection("GiveawayEntries");

    const entry = await collection.findOne({ user_id, giveaway_id });
    if (entry) {
      return interaction.reply({
        embeds: [
          await embeds.errorEmbed(
            interaction,
            "You have already entered this giveaway!",
            null,
            true,
            true
          ),
        ],
        components: [
          new ActionRowBuilder().addComponents([
            new ButtonBuilder()
              .setCustomId("giveaway-leave")
              .setLabel("Leave Giveaway")
              .setEmoji("<:close:1252438815189241897>")
              .setStyle(ButtonStyle.Secondary),
          ]),
        ],
        ephemeral: true,
      });
    }

    await collection.insertOne({
      user_id,
      giveaway_id,
      timestamp: new Date(),
    });

    return embeds.successEmbed(
      interaction,
      "You have entered the giveaway, good luck!",
      null,
      true
    );
  },
};
