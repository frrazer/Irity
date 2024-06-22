const { readdirSync } = require("fs");
const { PermissionFlagsBits } = require("discord.js");
const { errorEmbed, customEmbed } = require(`./embed`);
const { COLOURS } = require(`./config.json`);
const fs = require("fs");
const path = require("path");

//? Fetch all JS files function.
const getFiles = function (dir, files_) {
  files_ = files_ || [];
  const files = fs.readdirSync(dir);
  for (const i in files) {
    const name = dir + "/" + files[i];
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files_);
    } else {
      files_.push(path.resolve(name)); // resolve to absolute path
    }
  }
  return files_;
};
//? Command cooldown function.
function cooldown(interaction, collection, userID, client) {
  if (client.cooldowns.has(userID)) {
    let timeWord;
    let cooldownTime;
    if (collection.cooldown >= 60000) {
      if (collection.cooldown == 60000) timeWord = "minute";
      else timeWord = "minutes";
      cooldownTime = collection.cooldown / 60000;
    } else {
      if (collection.cooldown == 1000) timeWord = "second";
      else timeWord = "seconds";
      cooldownTime = collection.cooldown / 1000;
    }
    errorEmbed(
      interaction,
      `You are on a \`${cooldownTime}\` ${timeWord} cooldown.`,
      null,
      true
    );
    return true;
  } else {
    client.cooldowns.set(userID);
    setTimeout(() => {
      client.cooldowns.delete(userID);
    }, collection.cooldown);
  }
}
//? Command permissions function.
function permissions(interaction, collection) {
  if (collection.permissions && collection.permissions.length) {
    let invalidPermissionsFlags = [];
    for (let permission of collection.permissions) {
      // make the permission flag lowercase but keep the first letter uppercase
      permission =
        permission.charAt(0).toUpperCase() + permission.slice(1).toLowerCase();
      if (
        !interaction.member.permissions.has(PermissionFlagsBits[permission])
      ) {
        invalidPermissionsFlags.push(permission);
      } else {
        return false;
      }
    }
    errorEmbed(
      interaction,
      `You do not have the \`${invalidPermissionsFlags}\` permission(s).`,
      null,
      true
    );
    return true;
  }
}

function roles(interaction, collection) {
  if (collection.roles && collection.roles.length) {
    let invalidRoles = [];
    for (const role of collection.roles) {
      if (!interaction.member.roles.cache.has(role)) {
        invalidRoles.push(`<@&${role}>`);
      } else {
        return false;
      }
    }

    const roleString = invalidRoles.join(", ");
    errorEmbed(
      interaction,
      `You are missing one or more roles: ${roleString}`,
      null,
      true
    );
    return true;
  }
}
function convertTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days + "d"; // Return days if there are any
  } else if (hours > 0) {
    return hours + "h"; // Return hours if there are no days
  } else if (minutes > 0) {
    return minutes + "m"; // Return minutes if there are no hours
  } else {
    return seconds + "s"; // Return seconds if there are no minutes
  }
}
function abbreviateNumber(num) {
  let isNegative = num < 0; // Check if the number is negative
  let absNum = Math.abs(num); // Work with the absolute value for abbreviation

  if (absNum < 1000) {
    return (isNegative ? "-" : "") + absNum.toFixed(2); // Prepend minus if negative
  }

  let abbreviations = [
    { limit: 1e3, suffix: "K" },
    { limit: 1e6, suffix: "M" },
    { limit: 1e9, suffix: "B" },
    { limit: 1e12, suffix: "T" },
    { limit: 1e15, suffix: "Q" },
    { limit: 1e18, suffix: "Qu" }
  ];

  for (let i = abbreviations.length - 1; i >= 0; i--) {
    let { limit, suffix } = abbreviations[i];
    if (absNum >= limit) {
      return (isNegative ? "-" : "") + (absNum / limit).toFixed(2) + suffix; // Prepend minus if negative
    }
  }
}

function expandNumber(abbreviated) {
  if (abbreviated === "∞") {
    return Infinity;
  }

  const suffixes = ["", "K", "M", "B", "T", "QA", "QI", "SX", "SP", "OC", "NO", "DC", "UD", "DD", "TD", "QAD", "QID", "SXD", "SPD", "OCD", "NOD", "VG", "UVG"];
  const suffixRegex = /([A-Za-z]+)/;
  const numberRegex = /([+-]?[0-9]*\.?[0-9]+)/;

  const suffixMatch = abbreviated.match(suffixRegex);
  const numberMatch = abbreviated.match(numberRegex);

  if (!numberMatch) {
    return NaN;
  }

  const number = parseFloat(numberMatch[0]);
  const suffix = suffixMatch ? suffixMatch[0] : "";

  const suffixIndex = suffixes.indexOf(suffix);

  if (suffixIndex === -1) {
    return NaN;
  }

  return number * Math.pow(1000, suffixIndex);
}

function stringToDuration(timeString) {
  const timeRegex = /^(\d+[ywdhmsM])+$/;
  if (!timeRegex.test(timeString)) {
    throw new Error("Invalid time format");
  }

  const matches = Array.from(timeString.matchAll(/(\d+)([ywdhmsM])/g));
  let duration = 0;

  const unitToSeconds = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
    M: 2592000,
    y: 31536000,
  };

  for (const match of matches) {
    const amount = parseInt(match[1], 10);
    const unit = match[2];

    if (isNaN(amount) || !unitToSeconds[unit]) {
      throw new Error("Invalid time amount or unit");
    }

    duration += amount * unitToSeconds[unit];
  }

  return duration;
}

function calculateExpression(expression) {
  expression = expression.replace(/(\d+(\.\d+)?)(k)/gi, (match, p1) => (parseFloat(p1) * 1000).toString());
  expression = expression.replace(/(\d+(\.\d+)?)(m)/gi, (match, p1) => (parseFloat(p1) * 1000000).toString());
  expression = expression.replace(/(\d+(\.\d+)?)(b)/gi, (match, p1) => (parseFloat(p1) * 1000000000).toString());
  expression = expression.replace(/(\d+(\.\d+)?)(t)/gi, (match, p1) => (parseFloat(p1) * 1000000000000).toString());
  expression = expression.replace(/,/g, '');

  try {
    const result = require("mathjs").evaluate(expression);
    return result;
  } catch (error) {
    console.error(error);
    return "Invalid expression";
  }
}


module.exports = { getFiles, cooldown, permissions, roles, convertTime, abbreviateNumber, stringToDuration, calculateExpression, expandNumber };
