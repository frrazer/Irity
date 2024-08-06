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
    OWNER:  [13, [".all"], []]
};

async function calculateClearance(user_id) {
    const database = await databaseService.getDatabase("DiscordServer");
    const collection = database.collection("CasinoEmpireLevelling");

    const result = await collection.findOne({ user_id: user_id });

    if (result && result.clearance) {
        return result.clearance.roles;
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
    
    let allPermissions = new Set(directPermissions);
  
    inheritedLevels.forEach(inheritedLevel => {
      getPermissions(inheritedLevel).forEach(permission => allPermissions.add(permission));
    });
  
    return Array.from(allPermissions);
}

module.exports = {
    calculateClearance,
    permissionCheck,
    getPermissions
};
