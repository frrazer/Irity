const { cooldown, permissions } = require("../util/functions");
const { PREFIX: prefix } = require("../util/config.json");

const checkForLinks = require("../util/message-creation/checkForLinks")
const level = require("../util/message-creation/leveller")
const autodropFiller = require("../util/message-creation/autodropFiller")
const transactionMonitor = require("../util/message-creation/transactions")

module.exports = {
  name: "messageCreate",
  once: false,
  async execute(message, client) {
    if (message.from_server) {
      const channel = await client.channels.fetch(message.channelId);
      const real_message = await channel.messages.fetch(message.id);
      if (!real_message) return;

      real_message.content = message.content;
      real_message.embeds = message.embeds;
      real_message.attachments = message.attachments;
      real_message.components = message.components;

      message = real_message;
    }

    let commandPrefix = prefix;
    const mentionRegex = new RegExp(`^<@!?(${client.user.id})>`, "gi").exec(message.content);
    if (mentionRegex) commandPrefix = `${mentionRegex[0]} `;

    if (message.content.startsWith(commandPrefix)) {
      const args = message.content.slice(commandPrefix.length).trim().split(/ +/);
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
      // message.react("🍣")
      handleRegularMessage(message, client);
    } else {
      transactionMonitor(message);
    }
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

const WHITELISTED_GUILDS = ["932320416989610065"]

async function handleRegularMessage(message, client) {
  if (!WHITELISTED_GUILDS.includes(message.guild.id)) return;

  checkForLinks(message);
  level(message, client);
  autodropFiller.execute(message, client);
}