const databaseService = require("../services/databaseService");
const clearance_levels = {
  DEFAULT: [1, ["DEFAULT"]],
  DJ: [2, ["DJ"]],
  GIVEAWAY_HOST: [3, ["GIVEAWAY_HOST"], ["DJ"]],
  TRIAL_VALUE_COUNCIL: [
    4,
    ["REQUEST_EDIT_VALUE"], // Permissions
    ["DJ"], // Inherit permissions from these roles
    ["1139471373383782450"], // Required Roles for clearance
  ],
  VALUE_COUNCIL: [5, ["EDIT_VALUE"], ["DJ"], ["1139471373383782450"]],
  QUEUE_FILLER: [6, ["QUEUE_ITEMS"], ["DJ"]],
  ITEM_MANAGER: [
    7,
    ["DROP_ITEMS"],
    ["QUEUE_FILLER", "VALUE_COUNCIL"],
    ["1100065512903417916"],
  ],
  TRIAL_MODERATOR: [8, ["ROBLOX_BAN", "ROBLOX_VIEW_HISTORY"], ["DJ"]],
  MODERATOR: [
    9,
    ["ROBLOX_DOWNLOAD"],
    ["TRIAL_MODERATOR"],
    ["1057310687937953884"],
  ],
  DEVELOPER: [10, ["DEVELOPER"], ["MODERATOR"], ["1113868122311639050"]],
  ADMINISTRATOR: [
    11,
    ["ROBLOX_TRANSFER", "ROBLOX_EDIT_CASH"],
    ["MODERATOR"],
    ["1069023487647301692"],
  ],
  MANAGER: [12, [".all"], [], ["1180090434744229988"]],
  OWNER: [13, [".all"], []],
};

async function calculateClearance(user_id) {
  const database = await databaseService.getDatabase("DiscordServer");
  const collection = database.collection("CasinoEmpireLevelling");

  const result = await collection.findOne({ user_id: user_id });

  if (result && result.clearance) {
    return result.clearance.level;
  } else {
    return "DEFAULT";
  }
}

async function permissionCheck(user_id) {
  const userClearance = await calculateClearance(user_id);
  if (!userClearance) return [];

  const permissions = getPermissions(userClearance);
  return permissions;
}

function getPermissions(level) {
  const levelData = clearance_levels[level];
  if (!levelData) return [];

  const directPermissions = levelData[1];
  const inheritedLevels = levelData[2] || [];

  if (directPermissions.includes(".all")) {
    let allPermissions = new Set();
    for (let key in clearance_levels) {
      clearance_levels[key][1].forEach((permission) =>
        allPermissions.add(permission)
      );
    }
    return Array.from(allPermissions);
  }

  let allPermissions = new Set(directPermissions);

  inheritedLevels.forEach((inheritedLevel) => {
    getPermissions(inheritedLevel).forEach((permission) =>
      allPermissions.add(permission)
    );
  });

  return Array.from(allPermissions);
}

async function checkPermission(user, permission) {
  const userClearance = await calculateClearance(user.id);
  const permissions = getPermissions(userClearance);

  console.log(user, permission, userClearance, permissions);

  const requiredRoles = clearance_levels[userClearance][3] || [];
  const hasRequiredRole = requiredRoles.some((role) =>
    user.roles.cache.has(role)
  );

  if (!hasRequiredRole) return false;
  return permissions.includes(permission);
}

module.exports = {
  calculateClearance,
  permissionCheck,
  getPermissions,
  checkPermission,
  clearance_levels,
};
