const {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
} = require("discord.js");
const databaseService = require("../../services/databaseService");
const embeds = require("../../util/embed");

async function getWinners(giveaway_entries, message_id, total_winners) {
  const winners = await giveaway_entries
    .aggregate([
      { $match: { giveaway_id: message_id, won: { $ne: true } } },
      { $sample: { size: total_winners } },
    ])
    .toArray();

  await giveaway_entries.updateMany(
    {
      giveaway_id: message_id,
      user_id: { $in: winners.map((entry) => entry.user_id) },
    },
    { $set: { won: true } }
  );

  return winners.map((entry) => entry.user_id);
}

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName("Reroll Giveaway")
    .setType(ApplicationCommandType.Message),
  roles: ["1254848251253882930"],
  execute: async function (interaction, client) {
    const message = interaction.targetMessage;
    const database = await databaseService.getDatabase("DiscordServer");
    const giveaways = database.collection("IrityGiveaways");
    const giveaway_entries = database.collection("GiveawayEntries");
    const giveaway = await giveaways.findOne({ message_id: message.id });

    if (!giveaway) {
      return embeds.errorEmbed(
        interaction,
        "This message is not an Irity Giveaway.",
        null,
        true
      );
    }

    const new_winner = await getWinners(giveaway_entries, message.id, 1);
    const winner = new_winner[0];
    
    if (!winner) {
      return embeds.errorEmbed(
        interaction,
        "Another winner could not be determined.",
        null,
        true
      );
    }

    interaction.reply({
      content: `:arrows_counterclockwise: Giveaway Rerolled! Congratulations <@${winner}>! [↗](${message.url})`,
    });
  },
};
