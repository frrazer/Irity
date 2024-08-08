const databaseService = require("../../services/databaseService");
const crypto = require("crypto");
const { EmbedBuilder } = require("discord.js");
const getDiscordFromRoblox = require("../getDiscordFromRoblox");
const { getUsernameFromId } = require("noblox.js");

const generateTransactionId = () =>
  crypto
    .randomUUID()
    .replace(/-/g, "")
    .split("")
    .map(() =>
      Math.random() < 0.5
        ? String.fromCharCode(Math.floor(Math.random() * 10) + 48)
        : String.fromCharCode(Math.floor(Math.random() * 26) + 65)
    )
    .join("")
    .slice(0, 8);

async function transactionMonitor(message) {
  const allowed_channels = [
    "1112734635210846310",
    "1142738352731332689",
    "1201249045771984936",
  ];
  if (!allowed_channels.includes(message.channel.id)) return;
  if (!message.author.bot) return;

  try {
    switch (message.channel.id) {
      case "1112734635210846310":
        await handleRAPChangesChannel(message);
        break;
      case "1142738352731332689":
        await handleTipsChannel(message);
        break;
      case "1201249045771984936":
        await handleRobuxSalesChannel(message);
        break;
      default:
        console.log("Unhandled channel ID:", message.channel.id);
    }
  } catch (error) {
    console.error("Failed to handle message:", error);
  }
}

async function handleRAPChangesChannel(message) {
  const embed = message.embeds[0];
  if (!embed) return;

  const [item_name, serial] = embed.title
    .replace(/^✨/, "")
    .trim()
    .split("#")
    .map((s) => s.trim());
  const { fields, footer } = embed;
  const buyer_id =
    fields[3]?.value.match(
      /https:\/\/www\.roblox\.com\/users\/(\d+)\/profile/
    )?.[1] ?? null;
  const seller_id =
    fields[4]?.value.match(
      /https:\/\/www\.roblox\.com\/users\/(\d+)\/profile/
    )?.[1] ?? null;
  const sale_price = parseInt(fields[2]?.value.replace(/,/g, ""), 10);
  const sale_date = new Date(message.createdTimestamp);
  const transaction_id = footer?.text.split(": ")[1] ?? null;

  const database = await databaseService.getDatabase("ArcadeHaven");
  const collection = database.collection("items");
  const item = await collection.findOne(
    { name: item_name },
    { projection: { itemId: 1, name: 1 } }
  );

  if (!item) {
    console.error("Failed to find item:", item_name);
    return;
  }

  const transaction = {
    item_id: `${item.itemId}`,
    serial,
    buyer_id,
    seller_id,
    sale_price,
    date: sale_date,
    transaction_id,
    type: "marketplace",
  };

  handleUserNotification(message, transaction, item_name);
  await saveTransaction(transaction);
}

async function handleRobuxSalesChannel(message) {
  const embed = message.embeds[0];
  if (!embed) return;

  const [item_name, serial] = [
    embed.title.replace(/\s*\(#\d+\)/, "").trim(),
    embed.title.match(/\d+/)[0],
  ];
  const buyer_id = embed.fields[0].value.match(
    /https:\/\/www\.roblox\.com\/users\/(\d+)\/profile/
  )[1];
  const seller_id = embed.fields[1].value.match(
    /https:\/\/www\.roblox\.com\/users\/(\d+)\/profile/
  )[1];
  const sale_price = parseInt(embed.fields[2].value.match(/\d+$/)[0]);
  const sale_date = new Date(message.createdTimestamp);

  const database = await databaseService.getDatabase("ArcadeHaven");
  const collection = database.collection("items");
  const item = await collection.findOne(
    { name: item_name },
    { projection: { itemId: 1, name: 1 } }
  );

  if (!item) {
    console.error("Failed to find item:", item_name);
    return;
  }

  const transaction = {
    item_id: `${item.itemId}`,
    serial,
    buyer_id,
    seller_id,
    sale_price,
    date: sale_date,
    transaction_id: generateTransactionId(),
    type: "robux_marketplace",
  };

  handleUserNotification(message, transaction, item_name);
  await saveTransaction(transaction);
}

async function handleTipsChannel(message) {
  if (message.content === null || message.content === "") return;

  const [tipper, tipped, rawAmount] = [
    ...message.content
      .match(/https:\/\/www\.roblox\.com\/users\/\$?(\d+)\/profile/g)
      .map((url) => url.match(/\d+/)[0]),
    message.content.split(" ").pop(),
  ];
  const amount = parseInt(rawAmount.replace(/[$,]/g, ""), 10) || 0;
  const tip_date = new Date(message.createdTimestamp);

  const transaction = {
    tipper,
    tipped,
    amount,
    date: tip_date,
    transaction_id: generateTransactionId(),
    type: "tip",
  };

  await saveTransaction(transaction);
}

async function saveTransaction(transaction) {
  try {
    const database = await databaseService.getDatabase("ArcadeHaven");
    const collection = database.collection("game_transactions");
    await collection.insertOne(transaction);
  } catch (error) {
    console.error("Failed to save transaction:", error);
  }
}

async function handleUserNotification(message, transaction, item_name) {
  const client = require("../../bot").client;
  if (message.embeds.length === 0) return;

  if (transaction.type === "marketplace") {
    try {
      const [_, seller_discord_id] = await getDiscordFromRoblox(
        transaction.seller_id
      );
      if (!seller_discord_id) return;

      const user_database = await databaseService.getDatabase("DiscordServer");
      const user_collection = user_database.collection("CasinoEmpireLevelling");
      const seller = await user_collection.findOne({
        user_id: seller_discord_id,
      });

      if (seller && seller.settings.sale_notifications !== true) {
        return;
      }

      const seller_user = await client.users.fetch(seller_discord_id);
      if (!seller_user) return;

      const embed = new EmbedBuilder()
        .setTitle(`Your ${item_name} sold!`)
        .setDescription(`[Link to RAP Changes](${message.url})`)
        .addFields([message.embeds[0].fields[2], message.embeds[0].fields[3]])
        .setColor("Blue")
        .setThumbnail(message.embeds[0].thumbnail.url);

      await seller_user.send({ embeds: [embed] });
    } catch (error) {
      console.error("Failed to send user notification:", error);
    }
  } else if (transaction.type === "robux_marketplace") {
    let _, seller_discord_id;
    const user_database = await databaseService.getDatabase("DiscordServer");
    const user_collection = user_database.collection("CasinoEmpireLevelling");

    try {
      [_, seller_discord_id] = await getDiscordFromRoblox(
        transaction.seller_id
      );

      console.log("Seller Discord ID:", seller_discord_id);

      if (!seller_discord_id) return;

      const seller = await user_collection.findOne({
        user_id: seller_discord_id,
      });

      if (seller && seller.settings.sale_notifications !== true) {
        return;
      }

      const seller_user = await client.users.fetch(seller_discord_id);
      if (!seller_user) return;

      message.embeds[0].fields[0].inline = true;
      message.embeds[0].fields[2].inline = true;

      const embed = new EmbedBuilder()
        .setTitle(`Your ${item_name} sold!`)
        .setDescription(`[Link to Robux Sales](${message.url})`)
        .addFields(message.embeds[0].fields[0], message.embeds[0].fields[2])
        .setColor("Blue")
        .setThumbnail(message.embeds[0].thumbnail.url)
        .setFooter({
          text: message.embeds[0].footer.text.replace(
            "This seller has",
            "You have"
          ),
        });

      await seller_user.send({ embeds: [embed] });
    } catch (error) {
      const notify_channel = message.guild.channels.cache.get(
        "1057661334185054338"
      );

      notify_channel.send({
        content: `<:tt_er:1187754755435548742> <@${seller_discord_id}> | I couldn't send you a DM so I've turned off sale notifications for you. You can turn them back on if you decide to open your DMs.`,
      });

      await user_collection.updateOne(
        { user_id: seller_discord_id },
        { $set: { "settings.sale_notifications": false } }
      );
    }
  }
}

module.exports = transactionMonitor;
