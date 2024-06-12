const { cooldown, permissions } = require("../util/functions");
const { PREFIX: prefix } = require("../util/config.json");
const calculateLevel = require("../util/calculateLevel");
const databaseService = require("../services/databaseService");
const redisService = require("../services/redisService");

module.exports = {
  name: "messageCreate",
  once: false,
  async execute(message, client) {
    const isDevMode = process.argv.includes('dev');
    if (isDevMode && message.author.id !== "406163086978842625") return;

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
      handleRegularMessage(message, client);
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

async function handleRegularMessage(message, client) {
  checkMessageForLinks(message);

  const authorId = message.author.id;
  const CHANNEL_ID = "1057661334185054338";

  const levelRoles = [
    { level: 5, role: "1249484824406659214" },
    { level: 10, role: "1249484815195967559" },
    { level: 25, role: "1210321267257909339" },
    { level: 50, role: "1210321263763923005" },
    { level: 75, role: "1210321260765253652" },
    { level: 100, role: "1210321251453636638" },
  ];

  try {
    const database = await databaseService.getDatabase("DiscordServer");
    const collection = database.collection("CasinoEmpireLevelling");
    let document = await collection.findOne({ user_id: authorId });

    if (!document) {
      document = {
        user_id: authorId,
        tracking: {
          messages: 1,
          xp: 0,
          last_message: Date.now(),
        },
        settings: {
          level_up_notification: true,
        },
        cacheing: {
          last_updated: Date.now(),
          username: message.author.username,
        }
      };
      await collection.insertOne(document);
    }

    const { tracking } = document;
    const { messages, xp, last_message } = tracking;
    let xpToAdd = Math.floor(15 + Math.random() * 11);
    const newXp = xp + xpToAdd;
    const newMessages = messages + 1;

    const xp_multi_end = 1718136981000

    if (last_message + 60000 > Date.now()) return;

    // double xp event 
    if (xp_multi_end > Date.now()) {
      xpToAdd *= 2;
    }

    await collection.updateOne({ user_id: authorId }, {
      $set: {
        "tracking.messages": newMessages,
        "tracking.xp": newXp,
        "tracking.last_message": Date.now(),
        "cacheing.last_updated": Date.now(),
        "cacheing.username": message.author.username,
      }
    });

    const currentLevel = calculateLevel(xp).currentLevel;
    const newLevel = calculateLevel(newXp).currentLevel;

    if (newLevel > currentLevel) {
      const notifyChannel = await client.channels.fetch(CHANNEL_ID);
      let messageContent = `Congratulations, {{user}}! You have officially reached level **${newLevel}**! 🎉`;

      const member = await notifyChannel.guild.members.fetch(authorId);
      let highestRole = null;
      let roleUpdated = false;

      for (const levelRole of levelRoles) {
        if (newLevel >= levelRole.level) {
          highestRole = levelRole;
        }
      }

      if (highestRole) {
        const rolesToRemove = levelRoles.filter(role => role.level < highestRole.level && member.roles.cache.has(role.role));
        for (const role of rolesToRemove) {
          await member.roles.remove(role.role);
          roleUpdated = true;
        }

        if (!member.roles.cache.has(highestRole.role)) {
          await member.roles.add(highestRole.role);
          roleUpdated = true;
        }
      }

      if (roleUpdated && document.settings.level_up_notification || newLevel === 1) {
        messageContent += "\n\n> If you do not wish to be pinged for level ups, you can disable this notification by using the **/settings level-up-notification** command.";
      }

      messageContent = document.settings.level_up_notification ? messageContent.replace("{{user}}", `<@${authorId}>`) : messageContent.replace("{{user}}", member.user.username);

      notifyChannel.send({ content: messageContent });
    }
  } catch (error) {
    console.error('Error handling regular message:', error);
  }
}

async function checkMessageForLinks(message) {
  const levelRoles = [
    { level: 5, role: "1249484824406659214" },
    { level: 10, role: "1249484815195967559" },
    { level: 25, role: "1210321267257909339" },
    { level: 50, role: "1210321263763923005" },
    { level: 75, role: "1210321260765253652" },
    { level: 100, role: "1210321251453636638" },
  ];

  const whitelist = [
    "https://discord.com/channels/",
    "https://ptb.discord.com/channels/",
    "https://canary.discord.com/channels/",
    "https://discordapp.com/channels/",
    "https://www.roblox.com/groups/16592351/Casino-Empire",
    "https://www.roblox.com/games/13081529792/NEW-Arcade-Haven",
    "https://discord.gift/",
    "https://x.com/casinoempires",
  ];

  const ignoredCategories = ["1182029577736945734", "1182029534044884992", "1182029509239787590", "1182029466952806501", "1057312553358868531"];
  const ignoredRoles = ["1182048570216546395"];
  const linkRegex = /(https?:\/\/[^\s]+)/g;

  const member = message.member;
  const userRoles = member.roles.cache.map(role => role.id);
  const messageCategory = message.channel.parentId;

  if (ignoredCategories.includes(messageCategory)) {
    return;
  }

  if (ignoredRoles.some(role => userRoles.includes(role))) {
    return;
  }

  let userLevel = 0;
  for (const { level, role } of levelRoles) {
    if (userRoles.includes(role)) {
      userLevel = level;
    }
  }

  const links = message.content.match(linkRegex);
  if (links) {
    const isWhitelisted = links.every(link =>
      whitelist.some(whitelistedLink => link.startsWith(whitelistedLink))
    );

    if (isWhitelisted) return;

    let notificationMessage

    if (userLevel < 10 && linkRegex.test(message.content)) {
      await message.delete();
      notificationMessage = await message.channel.send(`<:tt_er:1187754755435548742> ${message.author} | You need to be at least level 10 to post links in this server.`);
    } else if (userLevel === 10 && linkRegex.test(message.content) && message.channel.id !== "1088174756676784160") {
      await message.delete();
      notificationMessage = await message.channel.send(`<:tt_er:1187754755435548742> ${message.author} | You need to be at least level 25 to post links in this channel. Please use <#1088174756676784160> instead.`);
    }

    if (notificationMessage) {
      setTimeout(() => notificationMessage.delete(), 5000);
    }
  }
}
