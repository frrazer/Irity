const databaseService = require("../../services/databaseService");
const {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js");

/**
 * Monitors active giveaways.
 * @param {import('mongodb').Db} database - The database instance.
 * @param {import('mongodb').Collection} giveaways - The giveaways collection.
 * @param {import('mongodb').Collection} giveaway_entries - The giveaway entries collection.
 */

async function getWinners(giveaway_entries, message_id, total_winners) {
  const winners = await giveaway_entries
    .aggregate([
      { $match: { giveaway_id: message_id } },
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

async function giveawayMonitor(client, database, giveaways, giveaway_entries) {
  const activeGiveaways = await giveaways
    .find({
      started: true,
      ended: { $exists: false },
    })
    .toArray();

  activeGiveaways.forEach(async (giveaway) => {
    const end_time = giveaway.end_time;
    const message_id = giveaway.message_id;
    const total_entries = await giveaway_entries.countDocuments({
      giveaway_id: message_id,
    });

    const guild = client.guilds.cache.get(giveaway.guild_id);
    if (!guild) return;
    const channel = guild.channels.cache.get(giveaway.channel_id);
    if (!channel) return;
    let message = channel.messages.cache.get(message_id);

    if (!message) {
      await channel.messages
        .fetch(message_id)
        .then((msg) => {
          message = msg;
        })
        .catch(async () => {
          await giveaways.deleteOne({ message_id });
          console.log("Giveaway message not found, deleted giveaway.");
        });
    }

    const button = ButtonBuilder.from(message.components[0].components[0]);
    button.setLabel(`Participate (${total_entries})`);

    if (end_time <= Date.now() / 1000) {
      await giveaways.updateOne({ message_id }, { $set: { ended: true } });

      const winners = await getWinners(
        giveaway_entries,
        message_id,
        giveaway.data.total_winners
      );

      let winnerMentions = winners.map((winner) => `<@${winner}>`).join(", ");
      const current_description = message.embeds[0].description;
      const lines = current_description.split("\n");

      if (winners.length === 0) {
        winnerMentions = "No one";
      }

      const new_description = `
        ${lines[0]}
        ${lines[1].replace("Ending", "Ended")}
        ${lines[2]}
        ${lines[3]}
        <:green_dot:1264285521476190300> **Winners: ${winnerMentions}**
      `;

      button.setDisabled(true);
      message.components[0].components[0] = button;

      const embed = EmbedBuilder.from(message.embeds[0]);
      embed.setDescription(new_description);
      message.embeds[0] = embed;

      await message.edit({
        components: message.components,
        embeds: message.embeds,
      });

      await giveaways.updateOne({ message_id }, { $set: { ended: true } });

      if (winners.length > 0) {
        message.reply({
          content: `:tada: Congratulations ${winnerMentions}! You won the **${giveaway.data.reward}**!`,
        });
      } else {
        message.reply({
          content: `:cry: No one participated in the giveaway for **${giveaway.data.reward}**!`,
        });
      }
    } else {
      const current_amt = parseInt(
        message.components[0].components[0].label.match(/\d+/)[0]
      );
      const new_amt = total_entries;
      if (current_amt !== new_amt) {
        console.log("Updating button label...");
        message.components[0].components[0] = button;
        await message.edit({ components: message.components });
      }
    }
  });
}

module.exports = async function (client) {
  const database = await databaseService.getDatabase("DiscordServer");
  const giveaways = database.collection("IrityGiveaways");
  const giveaway_entries = database.collection("GiveawayEntries");

  setInterval(
    () => giveawayMonitor(client, database, giveaways, giveaway_entries),
    3000
  );
};
