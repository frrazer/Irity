const axios = require("axios");
module.exports = async function getDiscordFromRoblox(client, roblox_id) {
  try {
    const url = `https://api.blox.link/v4/public/guilds/932320416989610065/roblox-to-discord/` + roblox_id;
    const response = await axios.get(url, {
      headers: {
        Authorization: process.env.BLOXLINK_API_KEY,
      },
    });

    return [true, response.data.discordIDs[0]];
  } catch (error) {
    return [false, null];
  }
}