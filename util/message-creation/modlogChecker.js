function parseModActionString(input) {
  const result = {
    userId: "",
    modAction: "",
    duration: "",
    reason: "",
  };

  const userIdPattern = /\| (\d+)/;
  const modActionPattern = /Mod-A: ([^\(\n]+)(\(([^\)]+)\))?/;
  const reasonPattern = /Reason: (.+)/;

  const userIdMatch = input.match(userIdPattern);
  const modActionMatch = input.match(modActionPattern);
  const reasonMatch = input.match(reasonPattern);

  if (userIdMatch) {
    result.userId = userIdMatch[1];
  }

  if (modActionMatch) {
    result.modAction = modActionMatch[1].trim();
    if (modActionMatch[3]) {
      result.duration = modActionMatch[3];
    }
  }

  if (reasonMatch) {
    result.reason = reasonMatch[1];
  }

  return result;
}

module.exports = async function (message) {
  if (message.channel.id !== "1182035992996229161") return;

  const log = parseModActionString(message.content);
  const reactions = {
    ban: "🚫",
    kick: "⛔",
    mute: "🔇",
    warn: "⚠️",
    other: "❔",
    error: "❌",
    no_duration_error: "⏰",
    validated: "✅",
  };

  const reasons = {
    mute: ["mute", "timeout", "time out"],
    ban: ["ban"],
    kick: ["kick"],
    warn: ["warn"],
  };

  log.modAction = log.modAction.toLowerCase();
  if (!["mute", "ban", "kick", "warn"].includes(log.modAction)) {
    for (const [key, value] of Object.entries(reasons)) {
      if (value.includes(log.modAction)) {
        log.modAction = key;
        break;
      }
    }
  }

  if (!["mute", "ban", "kick", "warn"].includes(log.modAction)) {
    log.modAction = "other";
  }

  if (log.modAction === "mute" && !log.duration) {
    await message.react(reactions.no_duration_error);
    await message.reply(
      "Mute action detected without a specified duration. Please provide a duration for the mute action.\n-# You can delete this message after you have fixed your mistake."
    );
  } else if (log.modAction === "other" && !log.reason) {
    await message.react(reactions.error);
    await message.reply(
      "An unknown moderation action was detected without a reason. Please provide a valid reason.\n-# You can delete this message after you have fixed your mistake."
    );
  } else {
    await message.react(reactions[log.modAction]);
    await message.react(reactions.validated);
  }
};
