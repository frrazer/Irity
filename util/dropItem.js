const { getProductInfo, getThumbnails } = require("noblox.js");
const { stringToDuration } = require("../util/functions");
const getAverageColor = require("../util/getAverageColor");
const { getDatabase } = require("../services/databaseService");
const { EmbedBuilder } = require("discord.js");
const { default: axios } = require("axios");

async function extract_details() {
  const html = (await axios.get("https://www.rolimons.com/itemtable")).data;
  const startString = "<script>var item_details = ";
  const endString = ";</script>";
  const startIndex = html.indexOf(startString);
  if (startIndex === -1) {
    return null;
  }
  const endIndex = html.indexOf(endString, startIndex);
  if (endIndex === -1) {
    return null;
  }
  const jsonString = html.substring(startIndex + startString.length, endIndex);
  const details = JSON.parse(jsonString);

  return details;
}

function prettifyNumber(number) {
  // Get the length of the number by converting it to a string
  const numLength = number.toString().length;
  const roundingFactor = Math.pow(10, numLength - 2); // -2 to keep 2 significant figures
  const roundedNumber = Math.round(number / roundingFactor) * roundingFactor;

  return roundedNumber
}

module.exports = async function (client, item_id, data, reserve, meta_data) {
  try {
    const database = await getDatabase("ArcadeHaven");
    const items = database.collection("items");
    const find_res = await items.findOne({ itemId: Number(item_id) });
    if (find_res) {
      await items.deleteOne({ itemId: Number(item_id) });
      return await module.exports(client, item_id, data);
    }

    const details = await extract_details();
    let item_details = details[item_id] || [];
    let rap = item_details[8];
    let value = item_details[16];

    const product_info = meta_data || (await getProductInfo(item_id));
    let item_data = {
      itemId: Number(item_id),
      name: product_info.Name,
      creator: product_info.Creator.Name,
      description: product_info.Description,
      type: data.limited_type,
      originalPrice: Number(data.price),
      releaseTime: Math.floor(new Date().getTime() / 1000),
      rap: 0,
      quantitySold: reserve || 0,
      history: { sales: [], rap: [] },
      serials: [],
      reselling: {},
      tradeable: false,
      value: value || (rap ? prettifyNumber(rap) : 0) || 0,
    };

    if (reserve && reserve > 0) {
      if (!(data.limited_type === "unique" && data.quantity < 10)) {
        const timestamp = Math.floor(Date.now() / 1000);
        for (let i = 0; i < reserve; i++) {
          item_data.serials.push({
            u: 1,
            t: timestamp,
          });
        }
      }
    }

    if (data.limited_type === "unique") {
      item_data.totalQuantity = data.quantity;
      item_data.tradeable = true;
    } else if (data.limited_type === "limited") {
      item_data.offsaleTime =
        Math.floor(Date.now() / 1000) + stringToDuration(data.date);
    }

    await items.insertOne(item_data);
    await postToRoblox(item_id);
    await postDropEmbed(
      client,
      item_data,
      data.user || "1185559942917263390",
      data.Image
    );

    return item_data;
  } catch (error) {
    throw error;
  }
};

async function postDropEmbed(client, doc, user_id, image_url) {
  const guild = client.guilds.cache.get("932320416989610065");
  const channel = guild.channels.cache.get("1157724862123606038");
  let member

  try {
    member = await guild.members.fetch(user_id);
  } catch {
    member = await guild.members.fetch("1185559942917263390");
  }

  let fields = [
    {
      name: "Price",
      value: `$${doc.originalPrice.toLocaleString()}`,
      inline: true,
    },
    ...(doc.type === "unique"
      ? [
          {
            name: "Quantity",
            value: doc.totalQuantity.toLocaleString(),
            inline: true,
          },
        ]
      : []),
    ...(doc.type === "limited"
      ? [
          {
            name: "Offsale Time",
            value: `<t:${doc.offsaleTime}:R>`,
            inline: true,
          },
        ]
      : []),
    ...(doc.value !== 0
      ? [
          {
            name: "Value",
            value: doc.value.toLocaleString(),
            inline: true,
          },
        ]
      : []),
  ];

  const member_avatar = await member.user.displayAvatarURL({ size: 256 });
  let item_icon =
    image_url ||
    (
      await getThumbnails([
        {
          type: "Asset",
          size: "150x150",
          targetId: Number(doc.itemId),
          format: "png",
        },
      ])
    )[0].imageUrl;
  const colour = await getAverageColor(item_icon);

  const embed = new EmbedBuilder()
    .setTitle(doc.name)
    .setDescription(doc.description)
    .addFields(...fields)
    .setAuthor({
      name: `Item dropped by ${member.nickname || member.user.displayName}${
        member.user.displayName === "Irity" ? " (AI)" : ""
      }`,
      iconURL: member_avatar,
    })
    .setColor(colour)
    .setThumbnail(item_icon);

  await channel.send({ embeds: [embed], content: `<@&1096403875554140250>` });
}

async function postToRoblox(item_id) {
  try {
    const url =
      "https://apis.roblox.com/messaging-service/v1/universes/4570608156/topics/RefreshItem";
    await axios({
      method: "POST",
      url: url,
      headers: {
        "x-api-key": process.env.MESSAGING_SERVICE_KEY,
        "content-type": "application/json",
      },
      data: {
        message: `${item_id}`,
      },
    });
  } catch (error) {
    console.error("Error posting to Roblox:", error);
    console.log(error.response.data);
  }

  console.log(`Dropped item ${item_id} successfully`);
}
