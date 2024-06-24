const { SlashCommandSubcommandBuilder, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const embeds = require("../../../util/embed")
const autodropper = require("../../../util/message-creation/autodropFiller")
const databaseService = require("../../../services/databaseService")

const settings = {
    "monitor": new SlashCommandSubcommandBuilder()
        .setName("monitor")
        .setDescription("Begin/Stop monitoring your messages for drop requests."),
    "view": new SlashCommandSubcommandBuilder()
        .setName("view")
        .setDescription("View the current items in the autodropper.").addIntegerOption(option =>
            option
                .setName("page")
                .setDescription("The page number to view.")
                .setRequired(false)
        ),
    "remove": new SlashCommandSubcommandBuilder()
        .setName("remove")
        .setDescription("Remove an item from the autodropper.")
        .addIntegerOption(option =>
            option
                .setName("index")
                .setDescription("The index of the item to remove.")
                .setRequired(true)
        )
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("autodropper")
        .setDescription("Manage the autodropper.")
        .addSubcommand(settings.monitor)
        .addSubcommand(settings.view)
        .addSubcommand(settings.remove),
    roles: ["1252381044796031016", "1182048570216546395"],
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const user_id = interaction.user.id;

        if (subcommand === "monitor") {
            const isTracking = await autodropper.toggleTracking(user_id, interaction.channel.id);
            return embeds.successEmbed(interaction, `Your messages are **${isTracking ? "now being monitored" : "no longer being monitored"}** in this channel for drop requests.`);
        } else if (subcommand === "view") {
            const db = await databaseService.getDatabase("ArcadeHaven");
            const ff_db = await databaseService.getDatabase("FortuneFrenzy");
            const auto_dropper = db.collection("auto_dropper");
            const ff_items = ff_db.collection("Items");
            const total_documents = await auto_dropper.countDocuments({ dropped: { $ne: true } });
            const total_pages = Math.ceil(total_documents / 10);
            const page = interaction.options.getInteger("page") || 1;

            if (page < 1 || page > total_pages) {
                return embeds.errorEmbed(interaction, `Please enter a number between 1 and ${total_pages}.`);
            }

            const find_res = await auto_dropper.find({ dropped: { $ne: true } }).skip((page - 1) * 10).limit(10).toArray();
            let string = "";
            let i = page > 1 ? (page - 1) * 10 : 0;
            for (const item of find_res) {
                i++;
                const item_doc = await ff_items.findOne({ ItemId: item.item_id });
                if (!item_doc) continue;

                if (item.limited_type == "unique") {
                    string += `**${i}.** \`${item_doc.Name}\` - ${item.quantity.toLocaleString()}x - $${item.price.toLocaleString()}\n`;
                } else {
                    string += `**${i}.** \`${item_doc.Name}\` - ${item.date} - $${item.price.toLocaleString()}\n`;
                }
            }

            string += `\nPage ${page}/${total_pages}`;

            const embed = new EmbedBuilder().setTitle("Autodropper Items").setDescription(string).setColor("Blue").setFooter({
                text: "Use /autodropper remove to remove an item from the autodropper."
            })

            return interaction.reply({ embeds: [embed] });
        } else if (subcommand === "remove") {
            const db = await databaseService.getDatabase("ArcadeHaven");
            const auto_dropper = db.collection("auto_dropper");
            const index = interaction.options.getInteger("index");

            if (index < 1) {
                return embeds.errorEmbed(interaction, "Please enter a number greater than 0.");
            }

            const find_res = await auto_dropper.find({ dropped: { $ne: true } }).skip((index - 1)).limit(1).toArray();
            if (!find_res[0]) {
                return embeds.errorEmbed(interaction, "I couldn't find an item at that index.");
            }

            await auto_dropper.deleteOne({ _id: find_res[0]._id });
            return embeds.successEmbed(interaction, "The item has been removed from the autodropper.");
        }
    },
};