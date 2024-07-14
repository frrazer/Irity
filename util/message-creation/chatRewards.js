const ALLOWED_CHANNELS = [
  "1089320905395667045",
  "1057313206604931273",
  "1157722854318673950",
];
const CHANCE = 1; // 1%
const API_URL = "https://api.noxirity.com/v1/ah/marketplace/GetInventory?id=1";
const {
  getIdFromUsername,
  getUsernameFromId,
  getThumbnails,
} = require("noblox.js");
const databaseService = require("../../services/databaseService");
const { abbreviateNumber } = require("../../util/functions");
const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

function percentageToOneInX(percentage) {
  if (percentage <= 0) {
    return "Invalid percentage value";
  }
  return Math.round(1 / (percentage / 100));
}

async function refreshInventory(user_id) {
  const url =
    "https://apis.roblox.com/messaging-service/v1/universes/4570608156/topics/GlobalSystems";
  await axios({
    method: "POST",
    url: url,
    headers: {
      "x-api-key": process.env.MESSAGING_SERVICE_KEY,
      "content-type": "application/json",
    },
    data: {
      message: JSON.stringify({
        system: "Admin",
        method: "RefreshInv",
        userId: user_id,
      }),
    },
  });
}

module.exports = async function (message) {
  if (!ALLOWED_CHANNELS.includes(message.channel.id)) return;

  if (Math.random() < CHANCE / 100) {
    const user_id = await getIdFromUsername(message.member.nickname);
    const username = await getUsernameFromId(user_id);
    const response = await fetch(API_URL);
    const data = (await response.json()).data;
    let all_items = [];

    for (const item_id in data) {
      data[item_id].forEach((serial) => {
        all_items.push(`${item_id}-${serial}`);
      });
    }

    let item_data = null;
    let attempts = 0;
    const db = await databaseService.getDatabase("ArcadeHaven");
    const col = db.collection("items");
    let item_id, serial;

    while (!item_data && attempts < 5) {
      let random_item = all_items[Math.floor(Math.random() * all_items.length)];
      [item_id, serial] = random_item.split("-");

      const twelve_hours_ago = Math.floor((Date.now() - 43200000) / 1000);
      item_data = await col.findOne(
        {
          itemId: Number(item_id),
          releaseTime: { $lt: twelve_hours_ago },
        },
        {
          projection: { name: 1, value: 1, rap: 1, releaseTime: 1 },
        }
      );

      attempts++;
      if (item_data) break;
    }
    if (!item_data) return;

    await col.updateOne(
      { itemId: Number(item_id) },
      {
        $set: {
          [`serials.${Number(serial) - 1}.u`]: Number(user_id),
        },
        $push: {
          [`serials.${Number(serial) - 1}.h`]: [
            "discord_chat_reward",
            Number(user_id),
            1,
            Math.floor(Date.now() / 1000),
          ],
        },
        $unset: {
          [`reselling.${serial}`]: "",
        },
      }
    );

    const { name, value, rap, releaseTime } = item_data;
    const thumbnail =
      (
        await getThumbnails([
          {
            type: "Asset",
            targetId: item_id,
            format: "png",
            size: "150x150",
          },
        ])
      )[0].imageUrl || null;

    const chance_of_getting_item = (CHANCE / 100) * (1 / all_items.length);
    const one_in_x = abbreviateNumber(
      percentageToOneInX(chance_of_getting_item)
    );

    const embed = new EmbedBuilder()
      .setTitle(value >= 20000000 ? "LUCKY CHAT REWARD 🎊" : "Chat Reward 🥂")
      .setDescription(
        `<@${message.author.id}> has just been awarded **${name} (#${serial})** for being active in chat!\n\n-# This item was sent to Roblox user "${username}". [View Profile](https://www.roblox.com/users/${user_id}/profile)`
      )
      .setFooter({
        text: `Chance: 1 in ${one_in_x} | Value: ${abbreviateNumber(
          item_data.value || item_data.rap
        )}`,
      })
      .setColor("Blue");

    if (thumbnail) embed.setThumbnail(thumbnail);

    await message.reply({
      embeds: [embed],
    });

    await refreshInventory(user_id);
  } else {
    console.log("No item awarded.");
    return;
  }
};
