const { stringToDuration } = require("../functions")
const { getDatabase } = require("../../services/databaseService")

let tracking_ids = []

async function toggleTracking(user_id, channel_id) {
    const index = tracking_ids.findIndex(item => item.user_id === user_id);
    if (index !== -1) {
        tracking_ids.splice(index, 1);
        return false;
    } else {
        tracking_ids.push({ user_id, channel_id });
        return true;
    }
}
async function execute(message, client) {
    const index = tracking_ids.findIndex(item => item.user_id === message.author.id && item.channel_id === message.channel.id);
    if (index === -1) return;

    const content = message.content;
    const parts = content.split(" ");
    if (parts.length < 3) return;
    const item_id = parts[0];
    const price = parts[1];
    const quantity = parts[2];
    let is_duration = false;

    if (Number(price) <= 0 || Number(price) > 1000000) {
        let replyMessage = Number(price) > 1000000
            ? "Sorry, but the price you entered is too high. Please enter a price lower than $1,000,000."
            : "The price you entered seems incorrect. Please double-check and try again.";
        return message.reply(replyMessage);
    } else if (isNaN(Number(price))) {
        return message.reply("The price must be a number. Please double-check and try again.");
    }

    if (Number(quantity)) {
        if (Number(quantity) <= 10) {
            return message.reply("You don't have clearance to drop items with a quantity of 10 or less. Please double-check and try again.");
        } else if (Number(quantity) > 1000) {
            return message.reply("You don't have clearance to drop items with a quantity of 1,000 or more. Please double-check and try again.");
        }

        if (Number(quantity) <= 50) {
            // we need to check the ratio of how many other documents have less than 50
            // if the ratio is too high, we need to reject the request to prevent too many rare items
            const auto_dropper = (await getDatabase("ArcadeHaven")).collection("auto_dropper");
            const count = await auto_dropper.countDocuments({ quantity: { $lte: 50 }, dropped: { $ne: true } });
            const total = await auto_dropper.countDocuments({ dropped: { $ne: true } });
            const ratio = count / total;

            if (ratio > 0.08) { // 1 rare every ~12 items
                return message.reply("There are too many rare items in the autodropper. Please try adding this again later.");
            }
        }
    } else {
        try {
            stringToDuration(quantity);
        } catch (error) {
            message.reply("The last part of your message seems incorrect. Could you double-check and try again?");
        }

        is_duration = true;
    }

    const db = await getDatabase("FortuneFrenzy");
    const item = await db.collection("Items").findOne({ ItemId: Number(item_id) });

    if (!item) {
        return message.reply("I couldn't find that item on our limiteds database, are you sure you entered the correct or a valid item ID?");
    }

    const auto_dropper = (await getDatabase("ArcadeHaven")).collection("auto_dropper");
    const find_result = await auto_dropper.findOne({ item_id: Number(item_id) })

    if (find_result) {
        return message.reply("This item is already on our autodropper database. If you want to update the price or quantity, please remove the item and add it again.");
    }

    const doc = {
        item_id: Number(item_id),
        limited_type: is_duration ? "limited" : "unique",
        price: Number(price),
        [is_duration ? "date" : "quantity"]: is_duration ? quantity : Number(quantity)
    }

    auto_dropper.insertOne(doc);
    message.react("✅");
}

module.exports = {
    toggleTracking,
    execute
}