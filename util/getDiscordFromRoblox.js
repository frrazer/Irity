const axios = require("axios");
const databaseService = require("../services/databaseService");

module.exports = async function (roblox_id) {
  console.log(`Starting to get Discord ID for Roblox ID: ${roblox_id}`);
  const database = await databaseService.getDatabase("General");
  console.log("Database connection established.");
  const collection = database.collection("UserIDs");

  const CACHE_DURATION = 24 * 60 * 60 * 1000;

  try {
    console.log(`Checking cache for Roblox ID: ${roblox_id}`);
    const cachedData = await collection.findOne({ RobloxID: roblox_id });

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      console.log(`Cache hit for Roblox ID: ${roblox_id}`);
      return [true, cachedData.DiscordID];
    }

    console.log(`Cache miss for Roblox ID: ${roblox_id}. Fetching from API.`);
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