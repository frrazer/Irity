const { expandNumber } = require("../functions");
const databaseService = require("../../services/databaseService");

function getTradeValues(str) {
    const regex = /(\d+(\.\d+)?[MK])/g;
    const matches = str.match(regex);
    if (matches) {
        return matches.map(expandNumber);
    } else {
        return [];
    }
}

function extractItemQuantities(input) {
    const lines = input.split('\n');
    let itemQuantities = {};

    lines.forEach(line => {
        const amount = parseInt(line.match(/\d+/)[0]);
        const name = line.match(/"([^"]+)"/)[1];
        itemQuantities[name] = amount;
    });

    return itemQuantities;
}

module.exports = async function (message) {
    const embed = message.embeds[0];
    if (!embed) return;

    const player1 = embed.fields[0];
    const player2 = embed.fields[1];
    const player1_id = player1.name.split(" ")[1].slice(1, -2);
    const player2_id = player2.name.split(" ")[1].slice(1, -2);
    const [player1_value, player2_value] = [player1.value, player2.value].map(getTradeValues);
    const player1_items = extractItemQuantities(player1.value);
    const player2_items = extractItemQuantities(player2.value);
    let item_ids = {};

    const database = await databaseService.getDatabase("ArcadeHaven");
    const collection = database.collection("items");

    for (const item in { ...player1_items, ...player2_items }) {
        if (item_ids[item]) continue;

        const item_id = await collection.findOne({ name: item }, { projection: { itemId: 1 } });
        if (!item_id) continue;

        item_ids[item] = item_id.itemId;
    }


    const trade = {
        player1: {
            id: player1_id,
            value: player1_value.reduce((a, b) => a + b, 0),
            items: Object.keys(player1_items).reduce((acc, itemName) => {
                const itemID = item_ids[itemName];
                if (itemID) {
                    acc[itemID] = player1_items[itemName];
                }
                return acc;
            }, {})
        },
        player2: {
            id: player2_id,
            value: player2_value.reduce((a, b) => a + b, 0),
            items: Object.keys(player2_items).reduce((acc, itemName) => {
                const itemID = item_ids[itemName];
                if (itemID) {
                    acc[itemID] = player2_items[itemName];
                }
                return acc;
            }, {})
        },
        trade_time: new Date()
    };

    const tradesCollection = database.collection("trade_logs");
    await tradesCollection.insertOne(trade);
}
