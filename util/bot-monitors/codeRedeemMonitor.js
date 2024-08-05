const databaseService = require("../../services/databaseService");

module.exports = async function (client) {
  const db = await databaseService.getDatabase("ArcadeHaven");
  const collection = db.collection("redeem_logs");

  async function log() {
    try {
      const logs = await collection
        .find({
          logged: { $exists: false },
        })
        .sort({ date: 1 })
        .limit(1)
        .toArray();

      if (logs.length === 0) return;

      const channel = await client.channels.cache.get("1268169340780281907");
      if (!channel) return;

      let message = "";

      for (const log of logs) {
        const username = log.username;
        const date = log.date; // Date object
        const code = log.code;

        message += `\`${username}\` redeemed code **${code}** <t:${Math.floor(
          new Date(date).getTime() / 1000
        )}:R>\n`;
      }

      await channel.send({
        content: message,
      });

      await collection.updateMany(
        {
          _id: { $in: logs.map((log) => log._id) },
        },
        {
          $set: { logged: true },
        }
      );
    } catch (error) {
      console.error(error);
    }
  }

  log();
  setInterval(log, 5000);
};
