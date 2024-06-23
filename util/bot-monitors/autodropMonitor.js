const { EmbedBuilder } = require('discord.js');
const databaseService = require('../../services/databaseService');
const dropItem = require("../dropItem")

module.exports = async function (client) {
    const db = await databaseService.getDatabase("ArcadeHaven");
    const collection = db.collection("game_settings");
    const auto_dropper = db.collection("auto_dropper");

    const guild = client.guilds.cache.get("932320416989610065");
    const channel = guild.channels.cache.get("1250514631823200376");

    async function autodrop() {
        const doc = await collection.findOne({ next_autodrop: { $exists: true } });
        const next_autodrop = doc.next_autodrop;
        const now = new Date()

        if (now > next_autodrop) {
            const pipeline = [
                { $match: { dropped: { $ne: true } } },
                { $sample: { size: 1 } }
            ];
            const [doc] = await auto_dropper.aggregate(pipeline).toArray();

            if (!doc) {
                return channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Item Dropper Empty")
                            .setDescription("There are no items in the dropper. Please add some items.")
                            .setColor("Red")
                    ]
                })
            }

            // check if the item exists in the items database
            const items = db.collection("items");
            const find_res = await items.findOne({ itemId: Number(doc.item_id) }, { projection: { itemId: 1 } })
            if (find_res) {
                await auto_dropper.updateOne({ _id: doc._id }, { $set: { dropped: true } })
                return autodrop()
            }

            const random_intervals = [50, 60, 70, 80]
            const next = new Date(now.getTime() + 60000 * random_intervals[Math.floor(Math.random() * random_intervals.length)])
            await collection.updateOne({ next_autodrop: { $exists: true } }, { $set: { next_autodrop: next } })
            await auto_dropper.updateOne({ _id: doc._id }, { $set: { dropped: true } })

            dropItem(client, doc.item_id, doc)
        }
    }


    autodrop()
    setInterval(autodrop, 5000);
}