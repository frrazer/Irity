const { getThumbnails } = require("noblox.js");
const databaseService = require("../../services/databaseService");
const { EmbedBuilder } = require("discord.js");

module.exports = async function (client) {
  const database = await databaseService.getDatabase("ArcadeHaven");
  const items = database.collection("items");

  async function updateTradeableItems() {
    try {
      const currentTime = Date.now() / 1000;
      const filter = {
        type: "limited",
        tradeable: false,
        offsaleTime: { $lte: currentTime },
      };
      const update = { $set: { tradeable: true } };
      await items.updateMany(filter, update);
    } catch (error) {
      console.error("Error updating tradeable items:", error);
      throw error;
    }
  }

  // run every 5 seconds
  setInterval(async () => {
    try {
      await updateTradeableItems();
    } catch (error) {
      console.error("Error updating tradeable items:", error);
    }
  }, 5000);
};
