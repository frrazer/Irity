const { SlashCommandBuilder, EmbedBuilder, SlashCommandSubcommandBuilder } = require("discord.js");
const databaseService = require("../../../services/databaseService");
const embeds = require("../../../util/embed")
const { findItems, findItem } = require("../../../util/searchMarketplace");
const { getThumbnails } = require("noblox.js");

const settings = {
    "search": new SlashCommandSubcommandBuilder()
        .setName("search")
        .setDescription("Search for an item in the bot's inventory.")
        .addStringOption(option =>
            option
                .setName("query")
                .setDescription("The item you want to search for.")
                .setRequired(true)
                .setAutocomplete(true),
        ),
    "sort": new SlashCommandSubcommandBuilder()
        .setName("sort")
        .setDescription("Get the top 15 items in the bot's inventory.")
        .addStringOption(option =>
            option
                .setName("method")
                .setDescription("The method you want to sort by.")
                .setRequired(true)
                .addChoices(
                    {
                        name: "Top Total Value Items",
                        value: "value"
                    },
                    {
                        name: "Most Hoarded Items",
                        value: "quantity"
                    },
                    {
                        name: "Best Items",
                        value: "best"
                    }
                )
        ),
}

function abriviateNumber(number) {
    const SI_SYMBOL = ["", "k", "M", "B", "T", "P", "E"];
    const tier = Math.log10(number) / 3 | 0;

    if (tier === 0) return number;
    const suffix = SI_SYMBOL[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = number / scale;
    return scaled.toFixed(1) + suffix;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bot-inventory")
        .setDescription("Search through the bot's inventory.")
        .addSubcommand(settings.search)
        .addSubcommand(settings.sort),
    async execute(interaction, client) {
        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === "search") {
                const query = interaction.options.getString("query");
                const item = await findItem(query);

                if (!item)
                    return embeds.errorEmbed(interaction, "I couldn't find that item in the Marketplace.");

                const bot_owned = item.serials.filter(serial => serial.u === 1).length;
                const player_owned = item.serials.filter(serial => serial.u !== 1).length; // this is how many the bot doesn't own
                const percent_bot_owned = ((bot_owned / item.serials.length) * 100).toFixed(2);
                const total_value = (item.value || item.rap) * bot_owned;

                let icon = (await getThumbnails([
                    {
                        type: "Asset",
                        size: "150x150",
                        targetId: Number(item.itemId),
                        format: "png",
                    },
                ]))[0].imageUrl

                const embed = new EmbedBuilder()
                    .setTitle(`${item.name}`)
                    .addFields(
                        {
                            name: "Bot Owns",
                            value: `x${bot_owned.toLocaleString()} (${percent_bot_owned}%)`,
                            inline: true
                        },
                        {
                            name: "Players Own",
                            value: `x${player_owned.toLocaleString()}`,
                            inline: true
                        },
                        {
                            name: "Bot Total Value",
                            value: `$${total_value.toLocaleString()}`,
                            inline: true
                        }
                    ).setColor("Blue")

                if (icon) embed.setThumbnail(icon);
                await interaction.reply({ embeds: [embed] });
            } else if (subcommand === "sort") {
                const method = interaction.options.getString("method");
                const database = await databaseService.getDatabase("ArcadeHaven");
                const collection = database.collection("items");
                const items = await collection
                    .find(
                        { "serials.u": 1 },
                        { projection: { "serials.u": 1, "serials._id": 1, itemId: 1, name: 1, value: 1, rap: 1 } }
                    )
                    .toArray();
                let bot_total_value = 0;
                items.forEach(item => {
                    bot_total_value += (item.value || item.rap) * item.serials.filter(serial => serial.u === 1).length;
                });

                if (method === "value") {
                    items.sort((a, b) => {
                        return ((b.value || b.rap) * b.serials.filter(serial => serial.u === 1).length) - ((a.value || a.rap) * a.serials.filter(serial => serial.u === 1).length);
                    });
                } else if (method === "quantity") {
                    // sort by the most owned by the bot
                    items.sort((a, b) => {
                        return b.serials.filter(serial => serial.u === 1).length - a.serials.filter(serial => serial.u === 1).length;
                    });
                } else if (method === "best") {
                    // sort by the highest value
                    items.sort((a, b) => {
                        return (b.value || b.rap) - (a.value || a.rap);
                    });
                }

                const embed = new EmbedBuilder()
                    .setTitle(`Arcade Haven Bot Top Items`)
                    .setColor("Blue").setFooter({
                        text: `Sorted by ${method === "value" ? "Value" : (method === "quantity" ? "Quantity" : "Best Items")} | Total Value: $${abriviateNumber(bot_total_value)}`,
                    })

                let descripion = "";
                items.slice(0, 15).forEach((item, index) => {
                    if (method === "value") {
                        descripion += `**${index + 1}.** **${item.name}** - $${abriviateNumber(((item.value || item.rap) * item.serials.filter(serial => serial.u === 1).length))} Value (x${item.serials.filter(serial => serial.u === 1).length})\n`;
                    } else if (method === "quantity") {
                        descripion += `**${index + 1}.** **${item.name}** - x${item.serials.filter(serial => serial.u === 1).length}\n`;
                    } else if (method === "best") {
                        descripion += `**${index + 1}.** **${item.name}** - $${abriviateNumber(((item.value || item.rap) * item.serials.filter(serial => serial.u === 1).length))} Value (x${item.serials.filter(serial => serial.u === 1).length})\n`;
                    }
                });

                embed.setDescription(descripion);
                await interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error(error);
            embeds.errorEmbed(interaction, "This command is not available yet.");
        }
    },

    async autocomplete(interaction) {
        console.log(`Autocomplete: ${interaction.options.getFocused()}`)
        const focusedValue = interaction.options.getFocused().toLowerCase();

        try {
            const items = await findItems(focusedValue);
            console.log(items);

            const response = items.map((choice) => ({
                name: `"${choice.name}"`,
                value: `"${choice.name}"`,
            }));

            await interaction.respond(response);
        } catch (error) {
            console.error(error);
        }
    }
};