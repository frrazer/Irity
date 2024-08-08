const { EmbedBuilder } = require("discord.js");
const databaseService = require("../../services/databaseService");
const dropItem = require("../dropItem");
const embeds = require("../embed");

module.exports = async function (client) {
  const db = await databaseService.getDatabase("ArcadeHaven");
  const collection = db.collection("game_settings");
  const auto_dropper = db.collection("auto_dropper");

  const guild = client.guilds.cache.get("932320416989610065");
  const channel = guild.channels.cache.get("1250514631823200376");

  async function autodrop() {
    const doc = await collection.findOne({ next_autodrop: { $exists: true } });
    const next_autodrop = doc.next_autodrop;
    const now = new Date();

    if (now > next_autodrop) {
      const pipeline = [
        { $match: { dropped: { $ne: true } } },
        { $sample: { size: 1 } },
      ];
      const [doc] = await auto_dropper.aggregate(pipeline).toArray();

      if (!doc) {
        // set next autodrop to 5 minutes from now
        const next = new Date(now.getTime() + 300000);
        await collection.updateOne(
          { next_autodrop: { $exists: true } },
          { $set: { next_autodrop: next } }
        );

        return channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("Item Dropper Empty")
              .setDescription(
                `There are no items in the dropper, please add some items.`
              )
              .setColor("Red"),
          ],
        });
      }

      const items = db.collection("items");
      const find_res = await items.findOne(
        { itemId: Number(doc.item_id) },
        { projection: { itemId: 1 } }
      );
      if (find_res) {
        await auto_dropper.updateOne(
          { _id: doc._id },
          { $set: { dropped: true } }
        );
        return autodrop();
      }

      const random_intervals = [90, 110, 130, 150, 170, 180];
      const next = new Date(
        now.getTime() +
          60000 *
            random_intervals[
              Math.floor(Math.random() * random_intervals.length)
            ]
      );
      await collection.updateOne(
        { next_autodrop: { $exists: true } },
        { $set: { next_autodrop: next } }
      );
      await auto_dropper.updateOne(
        { _id: doc._id },
        { $set: { dropped: true } }
      );

      const log_message = await channel.send({
        embeds: [
          await embeds.neutralEmbed(
            null,
            "Dropping item...",
            null,
            false,
            true
          ),
        ],
      });

      try {
        const drop_result = await dropItem(client, doc.item_id, doc, 2);
        await log_message.edit({
          embeds: [
            await embeds.successEmbed(
              null,
              `Dropped **${drop_result.name}**! The next drop has been scheduled.`,
              null,
              false,
              true
            ),
          ],
        });
      } catch (error) {
        const next = new Date(now.getTime() + 120000);
        await collection.updateOne(
          { next_autodrop: { $exists: true } },
          { $set: { next_autodrop: next } }
        );
        await auto_dropper.updateOne(
          { _id: doc._id },
          { $set: { dropped: false } }
        );

        await log_message.edit({
          embeds: [
            await embeds.errorEmbed(
              null,
              `Failed to drop item:\n\n\`\`\`${error}\n\`\`\`\nRetrying <t:${Math.floor(
                next.getTime() / 1000
              )}:R>`,
              null,
              false,
              true
            ),
          ],
        });
      }
    }
  }

  autodrop();
  setInterval(autodrop, 5000);
};
