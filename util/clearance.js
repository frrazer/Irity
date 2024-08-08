const databaseService = require("../services/databaseService");

const clearance_levels = {
  DEFAULT: [1, ["DEFAULT"]],
  DJ: [2, ["DJ"]],
  GIVEAWAY_HOST: [3, ["GIVEAWAY_HOST"], ["DJ"]],
  TRIAL_VALUE_COUNCIL: [4, ["REQUEST_EDIT_VALUE"], ["DJ"]],
  VALUE_COUNCIL: [5, ["EDIT_VALUE"], ["DJ"]],
  QUEUE_FILLER: [6, ["QUEUE_ITEMS"], ["DJ"]],
  ITEM_MANAGER: [7, ["DROP_ITEMS"], ["QUEUE_FILLER", "VALUE_COUNCIL"]],
  TRIAL_MODERATOR: [8, ["ROBLOX_BAN", "ROBLOX_VIEW_HISTORY"], ["DJ"]],
  MODERATOR: [9, ["ROBLOX_DOWNLOAD"], ["TRIAL_MODERATOR"]],
  DEVELOPER: [10, ["DEVELOPER"], ["MODERATOR"]],
  ADMINISTRATOR: [11, ["ROBLOX_TRANSFER", "ROBLOX_EDIT_CASH"], ["MODERATOR"]],
  MANAGER: [12, [".all"], []],
  OWNER: [13, [".all"], []],
};

function getPermissions(level) {
  const levelData = clearance_levels[level];
  if (!levelData) return [];

  const directPermissions = levelData[1];
  const inheritedLevels = levelData[2] || [];

  let allPermissions = new Set(directPermissions);

  inheritedLevels.forEach((inheritedLevel) => {
    getPermissions(inheritedLevel).forEach((permission) =>
      allPermissions.add(permission)
    );
  });

  return Array.from(allPermissions);
}

function getAllPermissions(clearance_levels) {
  const permissions = {};
  for (const level in clearance_levels) {
    permissions[level] = getPermissions(level);
  }
  return permissions;
}

module.exports = {
  hasClearance: async function (userId) {},
  getClearance: async function (userId) {},
};
