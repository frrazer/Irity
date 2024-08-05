const {
  EmbedBuilder,
  AttachmentBuilder,
  ActivityType,
  AuditLogEvent,
  ChannelType,
} = require("discord.js");
const config = require("../util/config.json");
const { convertTime } = require("../util/functions");
const os = require("os");
const axios = require("axios");

const databaseService = require("../services/databaseService");
const usageMonitor = require("../util/bot-monitors/usageMonitor");
const addCashMonitor = require("../util/bot-monitors/addCashMonitor");
const robuxMarketMonitor = require("../util/bot-monitors/robuxMarketMonitor");
const activeCodeMonitor = require("../util/bot-monitors/activeCodeMonitor");
const autodropMonitor = require("../util/bot-monitors/autodropMonitor");
const messageServer = require("../util/bot-monitors/messageServer");
const offsaleItemMonitor = require("../util/bot-monitors/offsaleItemMonitor");
const giveawayMonitor = require("../util/bot-monitors/giveawayMonitor");
const codeRedeemMonitor = require("../util/bot-monitors/codeRedeemMonitor");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    client.startTimestamp = Date.now();
    console.log(
      `\x1b[38;2;87;117;144m[Client] \x1b[32m${client.user.username} \u001b[37mis online!`
    );

    client.user.setPresence({
      activities: [
        {
          name: `Arcade Haven |⚡${client.shard.ids[0] + 1}/${
            client.shard.count
          }`,
          type: ActivityType.Playing,
        },
      ],
      status: "idle",
    });

    const guild = client.guilds.cache.get("932320416989610065");
    const channel = guild.channels.cache.get("1089320905395667045");
    // channel.send(`<@&1057310687937953884>`);

    usageMonitor(client);
    messageServer(client);

    const isDevMode = process.argv.includes("dev");
    if (!isDevMode) {
      addCashMonitor(client);
      robuxMarketMonitor(client);
      activeCodeMonitor(client);
      autodropMonitor(client);
      offsaleItemMonitor(client);
      codeRedeemMonitor(client);
      giveawayMonitor(client);
    }
  },
};
