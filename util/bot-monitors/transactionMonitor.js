const databaseService = require("../../services/databaseService");
const crypto = require('crypto');
const { EmbedBuilder } = require("discord.js");
const { getDiscordFromRoblox } = require("../getDiscordFromRoblox");
const { getUsernameFromId } = require("noblox.js")

async function transactionMonitor(message) {
    const allowed_channels = ["1112734635210846310", "1142738352731332689"];
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

    const [item_name, serial] = embed.title.replace(/^✨/, '').trim().split("#").map(s => s.trim());
    const { fields, footer } = embed;
    const buyer_id = fields[3]?.value.match(/https:\/\/www\.roblox\.com\/users\/(\d+)\/profile/)?.[1] ?? null;
    const seller_id = fields[4]?.value.match(/https:\/\/www\.roblox\.com\/users\/(\d+)\/profile/)?.[1] ?? null;
    const sale_price = parseInt(fields[2]?.value.replace(/,/g, ""), 10);
    const sale_date = new Date(message.createdTimestamp);
    const transaction_id = footer?.text.split(": ")[1] ?? null;

    const database = await databaseService.getDatabase("ArcadeHaven");
    const collection = database.collection("items");
    const item = await collection.findOne({ name: item_name }, { projection: { itemId: 1, name: 1 } });

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
        type: "marketplace"
    };

    const user_database = await databaseService.getDatabase("DiscordServer");
    const user_collection = user_database.collection("CasinoEmpireLevelling");
    const seller = await user_collection.findOne({ user_id: buyer_discord_id });

    if (seller) {
        if (seller.settings.sale_notifications) {
            handleUserNotification(message, transaction, item.name);
        }
    }


    await saveTransaction(transaction);
}

async function handleTipsChannel(message) {
    const [tipper, tipped, rawAmount] = [...message.content.match(/https:\/\/www\.roblox\.com\/users\/\$?(\d+)\/profile/g).map(url => url.match(/\d+/)[0]), message.content.split(" ").pop()];
    const amount = parseInt(rawAmount.replace(/[$,]/g, ""), 10) || 0;
    const tip_date = new Date(message.createdTimestamp);
    const generateTransactionId = () => crypto.randomUUID().replace(/-/g, '').split('').map(() => Math.random() < 0.5 ? String.fromCharCode(Math.floor(Math.random() * 10) + 48) : String.fromCharCode(Math.floor(Math.random() * 26) + 65)).join('').slice(0, 8);

    const transaction = {
        tipper,
        tipped,
        amount,
        date: tip_date,
        transaction_id: generateTransactionId(),
        type: "tip"
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
    try {
        const seller_discord_id = await getDiscordFromRoblox(client, transaction.seller_id);
        const seller_user = await client.users.fetch(seller_discord_id);
        if (!seller_user) return;

        const embed = new EmbedBuilder()
            .setTitle(`Your ${item_name} sold!`)
            .addFields([
                message.embeds[0].fields[2],
                message.embeds[0].fields[3]
            ])
            .setColor("Blue")
            .setThumbnail(message.embeds[0].thumbnail.url)

        await seller_user.send({ embeds: [embed] });
    } catch (error) {
        console.error("Failed to send user notification:", error);
    }
}

module.exports = transactionMonitor;
