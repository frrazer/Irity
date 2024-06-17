const {
  EmbedBuilder,
  AttachmentBuilder,
  ActivityType,
  AuditLogEvent,
} = require("discord.js");
const config = require("../util/config.json");
const { convertTime } = require("../util/functions");
const os = require("os");
const databaseService = require("../services/databaseService");
const usageMonitor = require("../util/bot_monitors/usageMonitor");
const addCashMonitor = require("../util/bot_monitors/addCashMonitor");
const robuxMarketMonitor = require("../util/bot_monitors/robuxMarketMonitor");
const { joinVoiceChannel } = require("@discordjs/voice")

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    client.startTimestamp = Date.now();
    console.log(
      `\x1b[38;2;87;117;144m[Client] \x1b[32m${client.user.username} \u001b[37mis online!`
    );

    client.user.setActivity({
      name: `Arcade Haven |⚡${client.shard.ids[0] + 1}/${client.shard.count}`,
      type: ActivityType.Playing,
    });

    const channel = client.channels.cache.get("1089320905395667045");
    // channel.send(`⚡ 2x XP is now active! Ending <t:1718468400:R>`);

    const dbs = (await require("../services/databaseService").getDatabase("DiscordServer")).collection("CasinoEmpireLevelling");
    // const items_dbs = (await require("../services/databaseService").getDatabase("ArcadeHaven")).collection("items");
    const top25 = await dbs.find({}).sort({ "tracking.xp": -1 }).limit(21).toArray();

    let str = "";
    for (const user of top25) {
      if (user.user_id === "406163086978842625") continue;
      str += `<@${user.user_id}> `;
    }

    console.log(str);

    usageMonitor(client);
    addCashMonitor(client);
    robuxMarketMonitor(client);
  },
};
