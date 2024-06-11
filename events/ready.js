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
    // channel.send(`⚡ 2x XP is now active! Ending <t:1718136981:R>`)

    usageMonitor(client);
  },
};
