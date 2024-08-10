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

async function extract_details() {
  const html = (await axios.get("https://www.rolimons.com/itemtable")).data;
  const startString = "<script>var item_details = ";
  const endString = ";</script>";
  const startIndex = html.indexOf(startString);
  if (startIndex === -1) {
    return null;
  }
  const endIndex = html.indexOf(endString, startIndex);
  if (endIndex === -1) {
    return null;
  }
  const jsonString = html.substring(startIndex + startString.length, endIndex);
  const details = JSON.parse(jsonString);

  return details;
}

function prettifyNumber(number) {
  // Get the length of the number by converting it to a string
  const numLength = number.toString().length;
  const roundingFactor = Math.pow(10, numLength - 2); // -2 to keep 2 significant figures
  const roundedNumber = Math.round(number / roundingFactor) * roundingFactor;

  return roundedNumber;
}

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
