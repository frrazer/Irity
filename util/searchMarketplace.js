const databaseService = require("../services/databaseService");

async function findItems(itemName) {
    console.log(itemName);
    const database = await databaseService.getDatabase("ArcadeHaven");

    const result = await database
        .collection("items")
        .find(
            { name: { $regex: itemName, $options: "i" } },
            { projection: { name: 1 } }
        )
        .limit(24)
        .toArray();

    console.log(result);
    return result;
}

async function findItem(itemName) {
    let query;
    const database = await databaseService.getDatabase("ArcadeHaven");
    const collection = database.collection("items");

    if (/^["“”]|["“”]$/.test(itemName)) {
        query = { name: itemName.slice(1, -1) };
    } else {
        query = {
            name: { $regex: new RegExp(itemName.toLowerCase()), $options: "i" },
        };
    }

    return await collection.findOne(query, {
        projection: { ["serials.h"]: 0 },
    });
}

module.exports = { findItems, findItem };