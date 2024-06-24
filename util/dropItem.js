const { getProductInfo, getThumbnails } = require("noblox.js")
const { stringToDuration } = require("../util/functions");
const getAverageColor = require("../util/getAverageColor")
const { getDatabase } = require("../services/databaseService");
const { EmbedBuilder } = require("discord.js");
const { default: axios } = require("axios");

module.exports = async function (client, item_id, data) {
    try {
        const database = await getDatabase("ArcadeHaven");
        const items = database.collection("items");
        const find_res = await items.findOne({ itemId: Number(item_id) })
        if (find_res) {
            await items.deleteOne({ itemId: Number(item_id) });
            return await module.exports(client, item_id, data);
        }

        const product_info = await getProductInfo(item_id);
        let item_data = {
            itemId: Number(item_id),
            name: product_info.Name,
            creator: product_info.Creator.Name,
            description: product_info.Description,
            type: data.limited_type,
            originalPrice: Number(data.price),
            releaseTime: Math.floor(new Date().getTime() / 1000),
            rap: 0,
            quantitySold: 0,
            history: { sales: [], rap: [] },
            serials: [],
            reselling: {},
            tradeable: false
        };

        if (data.limited_type === "unique") {
            item_data.totalQuantity = data.quantity;
            item_data.tradeable = true;
        } else if (data.limited_type === "limited") {
            item_data.offsaleTime = Math.floor(Date.now() / 1000) + stringToDuration(data.date)
        }

        await items.insertOne(item_data);
        await postToRoblox(item_id);
        await postDropEmbed(client, item_data, data.user || "1185559942917263390");

        return item_data
    } catch (error) {
        throw error;
    }
}

async function postDropEmbed(client, doc, user_id) {
    const guild = client.guilds.cache.get("932320416989610065");
    const channel = guild.channels.cache.get("1157724862123606038");
    const member = await guild.members.fetch(user_id);

    let fields = [
        {
            name: "Price",
            value: `$${doc.originalPrice.toLocaleString()}`,
            inline: true
        },
        ...(doc.type === "unique" ? [{
            name: "Quantity",
            value: doc.totalQuantity.toLocaleString(),
            inline: true
        }] : []),
        ...(doc.type === "limited" ? [{
            name: "Offsale Time",
            value: `<t:${doc.offsaleTime}:R>`,
            inline: true
        }] : [])
    ];

    const member_avatar = await member.user.displayAvatarURL({ size: 256 });
    let item_icon = (await getThumbnails([
        {
            type: "Asset",
            size: "150x150",
            targetId: Number(doc.itemId),
            format: "png",
        },
    ]))[0].imageUrl
    const colour = await getAverageColor(item_icon);

    const embed = new EmbedBuilder()
        .setTitle(doc.name)
        .setDescription(doc.description)
        .addFields(...fields)
        .setAuthor({
            name: `Item dropped by ${member.nickname || member.user.displayName}${member.user.displayName === "Irity" ? " (AI)" : ""}`,
            iconURL: member_avatar
        })
        .setColor(colour)
        .setThumbnail(item_icon)

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
        })
    } catch (error) {
        console.error("Error posting to Roblox:", error);
    }

    console.log(`Dropped item ${item_id} successfully`);
}