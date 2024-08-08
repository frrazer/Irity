const axios = require("axios");
const databaseService = require("../services/databaseService");

module.exports = async function (roblox_id) {
  const database = await databaseService.getDatabase("General");
  const collection = database.collection("UserIDs");

  const CACHE_DURATION = 24 * 60 * 60 * 1000 * 7; // 1 week

  try {
    const cachedData = await collection.findOne({ RobloxID: roblox_id });

    if (
      (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) ||
      cachedData.DontOverwrite
    ) {
      return [true, cachedData.DiscordID];
    }
    const url =
      `https://api.blox.link/v4/public/guilds/932320416989610065/roblox-to-discord/` +
      roblox_id;
    const response = await axios.get(url, {
      headers: {
        Authorization: process.env.BLOXLINK_API_KEY,
      },
    });

    const discordID = response.data.discordIDs[0];
    await collection.updateOne(
      { RobloxID: roblox_id },
      {
        $set: {
          DiscordID: discordID,
          RobloxID: roblox_id,
          timestamp: Date.now(),
        },
      },
      { upsert: true }
    );

    return [true, discordID];
  } catch (error) {
    return [false, null];
  }
};
