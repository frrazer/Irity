const { stringToDuration } = require("../functions")
const { getDatabase } = require("../../services/databaseService")
const axios = require("axios");

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

function roundToNearestSignificant(number) {
    if (number < 1000) {
        return Math.round(number / 100) * 1000;
    } else if (number < 10000) {
        return Math.round(number / 1000) * 1000;
    } else {
        return Math.round(number / 10000) * 10000;
    }
}

async function extract_details() {
    const html = (await axios.get("https://www.rolimons.com/itemtable")).data;
    const startString = "<script>var item_details = ";
    const endString = ";</script>";
    const startIndex = html.indexOf(startString);
    if (startIndex === -1) {
        return null;
    }
    const endIndex = html.indexOf(endString, startIndex);
    if (endIndex === -1) {
        return null;
    }
    const jsonString = html.substring(startIndex + startString.length, endIndex);
    const details = JSON.parse(jsonString);

    return details;
}

let details = null;

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
        if (Number(quantity) <= 25) {
            return message.reply("You don't have clearance to drop items with a quantity of 25 or less. Please double-check and try again.");
        } else if (Number(quantity) > 1000) {
            return message.reply("You don't have clearance to drop items with a quantity of 1,000 or more. Please double-check and try again.");
        }

        if (Number(quantity) <= 60) {
            const auto_dropper = (await getDatabase("ArcadeHaven")).collection("auto_dropper");
            const count = await auto_dropper.countDocuments({ quantity: { $lte: 50 }, dropped: { $ne: true } });
            const total = await auto_dropper.countDocuments({ dropped: { $ne: true } });
            const ratio = count / total;

            if (ratio > 0.07) {
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

    if (!details) {
        details = await extract_details();
    }

    const item_info = details[item_id];

    const doc = {
        item_id: Number(item_id),
        limited_type: is_duration ? "limited" : "unique",
        price: Number(price),
        [is_duration ? "date" : "quantity"]: is_duration ? quantity : Number(quantity),
        user: message.author.id,
    }

    auto_dropper.insertOne(doc);
    message.react("✅");


    // Add data to neural network training database
    const training_data = (await getDatabase("ArcadeHaven")).collection("autodrop_training_data");
    const real_quantity = item_info[11];
    const real_price = item_info[8];
    training_data.insertOne({
        item_id: Number(item_id),
        real_price: real_price,
        real_quantity: real_quantity,
        est_price: Number(price),
        est_quantity_or_date: is_duration ? stringToDuration(quantity) : Number(quantity),
        user: message.author.id,
        date: new Date()
    })
}

module.exports = {
    toggleTracking,
    execute
}