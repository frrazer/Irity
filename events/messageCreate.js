const { cooldown, permissions } = require("../util/functions");
const { PREFIX: prefix } = require("../util/config.json");
const redis = require("redis");

const checkForLinks = require("../util/message-creation/checkForLinks");
const level = require("../util/message-creation/leveller");
const autodropFiller = require("../util/message-creation/autodropFiller");
const transactionMonitor = require("../util/message-creation/transactions");
const modlogChecker = require("../util/message-creation/modlogChecker");
const chatRewards = require("../util/message-creation/chatRewards");
const AIModerator = require("../util/message-creation/AIModerator");

const { promisify } = require("util");
const { createClient } = require("redis");
const setTimeoutPromise = promisify(setTimeout);

let isConnected = false;
const store = {};
const redisClient = redis.createClient();
const subscriber = redisClient.duplicate();

async function setupSubscriber() {
  if (!isConnected) {
    await subscriber.connect();
    isConnected = true;

    await subscriber.subscribe("irity-message-create", (message) => {
      const data = JSON.parse(message);
      const message_id = data.message_id;
      if (store[message_id]) return;

      store[message_id] = {
        content: data.content,
        embeds: data.embeds,
        attachments: data.attachments,
        components: data.components,
      };
    });
  }
}

async function getMessageFromStore(messageId) {
  const startTime = Date.now();
  const timeout = 5000; // 5 seconds

  while (Date.now() - startTime < timeout) {
    if (store[messageId]) return store[messageId];
    await setTimeoutPromise(100); // check every 100ms
  }

  return null;
}

module.exports = {
  name: "messageCreate",
  once: false,
  async execute(message, client) {
    if (!message.guild) return;

    if (message.guild.id === "932320416989610065") {
      await setupSubscriber();
      const messageData = await getMessageFromStore(message.id);
      if (messageData) {
        message.content = messageData.content;
        message.embeds = messageData.embeds;
        message.attachments = messageData.attachments;
        message.components = messageData.components;
      }
    }

    let commandPrefix = prefix;
    const mentionRegex = new RegExp(`^<@!?(${client.user.id})>`, "gi").exec(
      message.content
    );
    if (mentionRegex) commandPrefix = `${mentionRegex[0]} `;

    if (message.content.startsWith(commandPrefix)) {
      const args = message.content
        .slice(commandPrefix.length)
        .trim()
        .split(/ +/);
      const commandName = args.shift().toLowerCase();
      const command = findCommand(client, commandName);
      if (!command) return;

      if (command.permissions && !hasPermissions(message, command)) return;
      if (command.cooldown && isOnCooldown(message, command, client)) return;

      try {
        await command.execute(message, client, args, commandPrefix);
      } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        await message.reply({
          content: "An error occurred while executing this command.",
          ephemeral: true,
          allowedMentions: { repliedUser: false },
        });
      }
    } else if (!message.author.bot) {
      handleRegularMessage(message, client);
    } else {
      transactionMonitor(message);
    }
  },

  async updateMessageContent(message) {
    const messageData = await getMessageFromStore(message.id);
    if (messageData) {
      message.content = messageData.content;
      message.embeds = messageData.embeds;
      message.attachments = messageData.attachments;
      message.components = messageData.components;
    }

    return message;
  },
};

function findCommand(client, commandName) {
  return (
    client.commands.get(commandName) ||
    client.commands.find(
      (command) => command.aliases && command.aliases.includes(commandName)
    )
  );
}

function hasPermissions(message, command) {
  return !permissions(message, command);
}

function isOnCooldown(message, command, client) {
  return cooldown(message, command, message.author.id, client);
}

const WHITELISTED_GUILDS = ["932320416989610065"];

async function handleRegularMessage(message, client) {
  if (!WHITELISTED_GUILDS.includes(message.guild.id)) return;

  checkForLinks(message);
  level(message, client);
  autodropFiller.execute(message, client);
  modlogChecker(message);
  chatRewards(message);
  AIModerator(message);
}
