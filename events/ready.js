const {
  EmbedBuilder,
  AttachmentBuilder,
  ActivityType,
  AuditLogEvent,
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

    usageMonitor(client);

    const isDevMode = process.argv.includes('dev');
    if (!isDevMode) {
      addCashMonitor(client);
      robuxMarketMonitor(client);
      activeCodeMonitor(client);
      autodropMonitor(client);
      messageServer(client);
    }

    const uid = 2400309165
    const database = await databaseService.getDatabase("ArcadeHaven")
    const items_collection = database.collection("items")

    const docs = await items_collection
      .find(
        { "serials.u": Number(uid) },
        {
          projection: {
            "serials.u": 1,
            "serials._id": 1,
            itemId: 1,
            value: 1,
            rap: 1,
          },
        }
      )
      .toArray();

    let new_inventory = {};
    let total_item_value = 0;
    docs.forEach(function (item) {
      const serials = item.serials;
      serials.forEach(function (serial_info, serial) {
        if (!serial_info) return;
        const owner_id = serial_info.u;
        if (owner_id === Number(uid)) {
          if (!new_inventory[String(item.itemId)]) {
            new_inventory[String(item.itemId)] = [];
          }

          if (!item.value || item.value === 0) return

          total_item_value += item.value || item.rap;
          new_inventory[String(item.itemId)].push(String(serial + 1));
        }
      });
    });

    console.log(total_item_value)
  },
};
