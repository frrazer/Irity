const ALLOWED_CHANNELS = [
  "1089320905395667045",
  "1057313206604931273",
  "1157722854318673950",
];
const CHANCE = 0; // 1%
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

async function getEligibleItems(database, userId) {
  const collection = database.collection("items");
  const twelve_hours_ago = Math.floor((Date.now() - 43200000) / 1000);

  return collection
    .find(
      {
        "serials.u": parseInt(userId),
        releaseTime: { $lt: twelve_hours_ago },
        rap: { $gte: 1 },
      },
      {
        projection: {
          itemId: 1,
          serials: 1,
          name: 1,
          value: 1,
          rap: 1,
          releaseTime: 1,
        },
      }
    )
    .toArray();
}

module.exports = async function (message) {
  if (!ALLOWED_CHANNELS.includes(message.channel.id)) return;

  if (Math.random() < CHANCE / 100) {
    const user_id = await getIdFromUsername(message.member.nickname);
    const username = await getUsernameFromId(user_id);
    const items = await getEligibleItems(
      await databaseService.getDatabase("ArcadeHaven"),
      user_id
    );

    if (!items.length) {
      console.log("No eligible items found");
      return;
    }

    const item_data = items[Math.floor(Math.random() * items.length)];
    const eligible_serials = item_data.serials.filter(
      (serial) => serial.u === 1
    );
    const serial = Math.floor(Math.random() * eligible_serials.length);
    const item_id = item_data.itemId;

    if (!item_data) return;

    const col = (await databaseService.getDatabase("ArcadeHaven")).collection(
      "items"
    );

    const res = await col.updateOne(
      { itemId: Number(item_id) },
      {
        $set: {
          [`serials.${Number(serial)}.u`]: Number(user_id),
        },
        $push: {
          [`serials.${Number(serial)}.h`]: [
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

    if (res.modifiedCount === 0) {
      console.log(Number(item_id), Number(serial));
      console.error("Failed to update item serials");
      return;
    }

    const { name, value } = item_data;

    let thumbnail;
    try {
      thumbnail =
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
    } catch (error) {
      if (error.name === "AbortError") {
        console.error("Thumbnail fetch request timed out");
        thumbnail = null;
      } else {
        throw error;
      }
    }

    const one_in_x = abbreviateNumber(percentageToOneInX(CHANCE / 100));

    const embed = new EmbedBuilder()
      .setTitle(
        value >= 2000000 ? "LUCKY CHAT REWARD 🎉🎉🎉" : "Chat Reward 🎊"
      )
      .setDescription(
        `<@${
          message.author.id
        }> has just been awarded **${name}** (worth ${abbreviateNumber(
          item_data.value || item_data.rap
        )}) for being active in chat!\n\n-# This item was sent to Roblox user "${username}". [View Profile](https://www.roblox.com/users/${user_id}/profile)\n`
      )
      .setColor(value >= 2000000 ? "Gold" : "Blue")
      .setAuthor({
        name: `One in ${one_in_x} chance! (Serial: ${Number(serial) + 1})`,
        iconURL:
          "https://cdn.discordapp.com/emojis/1249357547605987438.webp?size=96&quality=lossless",
      });

    if (thumbnail) embed.setThumbnail(thumbnail);

    const reply = await message.reply({
      embeds: [embed],
    });

    if (value >= 2000000) {
      await reply.react("🎉");
    }

    await refreshInventory(user_id);
  } else {
    return;
  }
};
