const { SlashCommandBuilder, EmbedBuilder, SlashCommandSubcommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } = require("discord.js");
const databaseService = require("../../../../services/databaseService");
const embeds = require("../../../../util/embed")
const generateGraph = require("../../../../util/generateGraph");
const { getProductInfo, getThumbnails } = require("noblox.js")
const sharp = require("sharp")
const { readPsd, writePsd } = require("ag-psd")
const { createCanvas, loadImage } = require("canvas");
const { readFileSync, fstat, writeFileSync, createWriteStream } = require("fs");
const axios = require("axios");

function calculateHighOwnershipPercentage(items) {
    const userItemCount = items.reduce((count, item) => {
        count[item.u] = (count[item.u] || 0) + 1;
        return count;
    }, {});

    const highOwners = Object.keys(userItemCount).filter(userId => userItemCount[userId] > 3);
    const highOwnerItemCount = highOwners.reduce((total, userId) => total + userItemCount[userId], 0);
    const totalItemCount = items.length;
    const percentage = (highOwnerItemCount / totalItemCount) * 100;

    return percentage;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lookup")
        .setDescription("Lookup information")
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("item")
                .setDescription("Lookup an item")
                .addStringOption(option =>
                    option
                        .setName("query")
                        .setDescription("The item to search for")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "item") {
            await interaction.deferReply()

            const query = interaction.options.getString("query");
            let filter = {}

            if (!isNaN(Number(query))) {
                filter = { itemId: Number(query) }
            } else {
                filter = {
                    name: { $regex: new RegExp(query.toLowerCase()), $options: "i" },
                };
            }

            const database = await databaseService.getDatabase("ArcadeHaven");
            const collection = database.collection("items");
            const item = await collection.findOne(filter, { projection: { "serials.h": 0 } });

            if (!item) {
                await handleNonExistingItem(interaction, query)
            } else {
                await handleExistingItem(interaction, item)
            }
        }
    },

    async autocomplete(interaction, client) {
        try {
            const value = interaction.options.getFocused()
            const url = `https://catalog.roproxy.com/v1/search/items/details?Category=11&CreatorTargetId=1&Keyword=${value}`
            const response = await fetch(url)
            const data = await response.json()

            const filtered = data.data
                .map(item => ({
                    name: item.name,
                    value: `${item.id}`
                }));

            await interaction.respond(filtered)
        } catch (error) {
            console.error(error)
        }
    }
};

async function handleExistingItem(interaction, item) {
    const rap = Math.floor(item.rap || 0)
    const value = item.value || 0
    const original_price = item.originalPrice
    const quantity_sold = item.quantitySold
    const total_quantity = item.totalQuantity ? item.totalQuantity.toLocaleString() : "∞"
    const release_timestamp = item.releaseTime
    const high_ownership_percentage = calculateHighOwnershipPercentage(item.serials)

    let item_icon = (await getThumbnails([
        {
            type: "Asset",
            size: "150x150",
            targetId: Number(item.itemId),
            format: "png",
        },
    ]))[0].imageUrl

    const graph_background = "images/graphBackground.png"
    const graph_buffer = await generateGraph(item.history.rap, "Recent Average Price", [1084, 398], "#FFFFFF")
    const item_icon_buffer = await fetchImageBuffer(item_icon)
    const graph = await updateGraph(graph_background, graph_buffer, item_icon_buffer)
    const image_id = require("crypto").randomBytes(16).toString("hex")

    const embed = new EmbedBuilder()
        .setTitle(item.name)
        .setDescription(item.description)
        .addFields(
            {
                name: "<:rap:1256718470234771457> Average Price",
                value: `$${rap.toLocaleString()}`,
                inline: true
            },
            {
                name: "<:value:1256738502972932177>Value",
                value: `${value.toLocaleString()}`,
                inline: true
            },
            {
                name: "<:originalprice:1256718585229869128> Original Price",
                value: `$${original_price.toLocaleString()}`,
                inline: true
            },
            {
                name: "<:quantitysold:1256718684672626739> Quantity Sold",
                value: `${quantity_sold.toLocaleString()}/${total_quantity}`,
                inline: true
            },
            {
                name: "<:hoarded:1256718768650846299> Hoarded",
                value: `${high_ownership_percentage.toFixed(2)}%`,
                inline: true
            },
            {
                name: "<:date:1256718820215885864> Released",
                value: `<t:${release_timestamp}:R>`,
                inline: true
            }
        )
        .setColor("Blue")

    const attachment = new AttachmentBuilder(graph, {
        name: `${image_id}.png`
    })

    embed.setImage(`attachment://${image_id}.png`)

    const buttons = [
        new ButtonBuilder()
            .setLabel("Edit Value")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("edit_value")
            .setEmoji("<:valueedit:1256740574673764454>"),
        new ButtonBuilder()
            .setLabel("Flag Projected")
            .setStyle(ButtonStyle.Danger)
            .setCustomId("toggle_projected")
            .setEmoji("<:projected:1256740916618592358>")
    ]

    await interaction.editReply({
        embeds: [embed],
        files: [attachment],
        components: [
            new ActionRowBuilder().addComponents(...buttons)
        ]
    })
}

async function handleNonExistingItem(interaction, query) {
    let product_info

    try {
        const general_database = await databaseService.getDatabase("General");
        const collection = general_database.collection("RobloxProductInfo");

        const filter = {
            $or: [
                { Name: { $regex: new RegExp(query.toLowerCase()), $options: "i" } },
                { AssetId: Number(query) }
            ]
        }

        product_info = await collection.findOne(filter)

        if (!product_info) {
            product_info = await getProductInfo(query)
            await collection.insertOne(product_info)
        }
    } catch (error) {
        product_info = null
    }

    if (!product_info) {
        await embeds.errorEmbed(interaction, "I was unable to find that item.", null, false)
        return
    }

    const embed = new EmbedBuilder()
        .setTitle(product_info.Name)
        .setDescription(product_info.Description)
        .setURL(`https://www.roblox.com/catalog/${product_info.AssetId}/`)
        .addFields(
            ...[product_info.PriceInRobux !== null
                ? {
                    name: "Price (Robux)",
                    value: `${product_info.PriceInRobux.toLocaleString()} Robux`,
                    inline: true,
                }
                : {
                    name: "Price (Tix)",
                    value: `${(product_info.PriceInTickets !== null) ? `${product_info.PriceInTickets.toLocaleString()} Tix` : "Unknown"}`,
                    inline: true,
                },
            ],
            {
                name: "Creator",
                value: `[${product_info.Creator.Name}${product_info.Creator.HasVerifiedBadge ? " <:verified:1256673811122622505>" : ""}](https://www.roblox.com/users/${product_info.Creator.Id}/profile)`,
                inline: true
            }
        )
        .setFooter({
            text: `Item ID: ${product_info.AssetId}`,
            iconURL: "https://cdn.discordapp.com/emojis/1256674848420265986.webp?size=96&quality=lossless"
        })
        .setTimestamp(new Date(product_info.Created))
        .setColor("Blue")

    let item_icon = (await getThumbnails([
        {
            type: "Asset",
            size: "150x150",
            targetId: Number(product_info.AssetId),
            format: "png",
        },
    ]))[0].imageUrl

    embed.setThumbnail(item_icon)

    const buttons = [
        new ButtonBuilder()
            .setLabel("Release Item")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("release_item")
            .setEmoji("<:add:1256690397413900329>")
    ]

    await interaction.editReply({
        embeds: [embed],
        components: [
            new ActionRowBuilder().addComponents(...buttons)
        ]
    })
}

async function updateGraph(originalImageBuffer, redReplacementBuffer, greenReplacementBuffer, outputImagePath) {
    async function overlayArea(ctx, x, y, width, height, imageBuffer) {
        const image = await loadImage(imageBuffer);
        ctx.drawImage(image, x, y, width, height);
    }

    const original_image = await loadImage(originalImageBuffer)
    const canvas = createCanvas(original_image.width, original_image.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(original_image, 0, 0)
    await overlayArea(ctx, 59, 51, 1084, 398, redReplacementBuffer)
    await overlayArea(ctx, 1159, 92, 286, 285, greenReplacementBuffer);

    const image = canvas.toBuffer();
    return image
}

async function fetchImageBuffer(url) {
    const response = await axios({
        url,
        responseType: 'arraybuffer'
    });

    return Buffer.from(response.data, 'binary');
}