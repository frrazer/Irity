const { SlashCommandBuilder, EmbedBuilder, SlashCommandSubcommandBuilder } = require("discord.js");
const databaseService = require("../../../services/databaseService");
const embeds = require("../../../util/embed")

const settings = {
    "level_up_notification": new SlashCommandSubcommandBuilder()
        .setName("level_up_notification")
        .setDescription("Toggle level up notifications.")
        .addBooleanOption(option =>
            option
                .setName("value")
                .setDescription("The value to set.")
                .setRequired(true)),
    "sale_notifications": new SlashCommandSubcommandBuilder()
        .setName("sale_notifications")
        .setDescription("Toggle sale notifications.")
        .addBooleanOption(option =>
            option
                .setName("value")
                .setDescription("The value to set.")
                .setRequired(true))
}

async function createDocument(collection, authorId) {
    const document = {
        user_id: authorId,
        tracking: {
            messages: 1,
            xp: 0,
            last_message: Date.now(),
        },
        settings: {
            level_up_notification: true,
            sale_notifications: false,
        },
        caching: {
            last_updated: Date.now(),
            username: message.author.username,
        }
    };

    await collection.insertOne(document);
    return document;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("settings")
        .setDescription("Change your settings.")
        .addSubcommand(settings.level_up_notification)
        .addSubcommand(settings.sale_notifications),
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        let document = await collection.findOne({ user_id: authorId });
        if (!document) {
            document = await createDocument(collection, authorId);
        }

        if (subcommand === "level_up_notification") {
            const value = interaction.options.getBoolean("value");
            const database = await databaseService.getDatabase("DiscordServer");
            const collection = database.collection("CasinoEmpireLevelling");
            const authorId = interaction.user.id;
            const result = await collection.updateOne({ user_id: authorId }, {
                $set: {
                    "settings.level_up_notification": value,
                }
            });

            if (result.modifiedCount === 1) {
                embeds.successEmbed(interaction, `Level up notifications have been **${value ? "enabled" : "disabled"}**.`, null, true);
            } else if (result.modifiedCount === 0 && result.matchedCount === 1) {
                embeds.errorEmbed(interaction, `Your level up notification settings are already ${value ? "enabled" : "disabled"}.`, null, true);
            } else {
                embeds.errorEmbed(interaction, "An error occurred while updating your settings. Please try again later.", null, true);
            }
        }
        else if (subcommand === "sale_notifications") {
            const value = interaction.options.getBoolean("value");
            const database = await databaseService.getDatabase("DiscordServer");
            const collection = database.collection("CasinoEmpireLevelling");
            const authorId = interaction.user.id;

            const result = await collection.updateOne({ user_id: authorId }, {
                $set: {
                    "settings.sale_notifications": value,
                }
            });

            if (result.modifiedCount === 1) {
                embeds.successEmbed(interaction, `Sale notifications have been **${value ? "enabled" : "disabled"}**.`, null, true);
            } else if (result.modifiedCount === 0 && result.matchedCount === 1) {
                embeds.errorEmbed(interaction, `Your sale notification settings are already ${value ? "enabled" : "disabled"}.`, null, true);
            } else {
                embeds.errorEmbed(interaction, "An error occurred while updating your settings. Please try again later.", null, true);
            }
        }
    },
};
