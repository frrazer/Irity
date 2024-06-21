const { EmbedBuilder } = require("discord.js");
const databaseService = require("../../services/databaseService");
const embeds = require("../../util/embed");

module.exports = {
    async execute(interaction, client) {
        const option = interaction.options.getString("setting");
        const value = interaction.options.getBoolean("enabled");
        const db = await databaseService.getDatabase("ArcadeHaven");
        const settings = db.collection("game_settings");
        const doc = await settings.findOne({});

        if (!doc) {
            return embeds.errorEmbed(interaction, "Contact an administrator right now. The settings document is missing.")
        }

        if (doc[option] === undefined) {
            return embeds.errorEmbed(interaction, "Invalid setting.")
        }

        await settings.updateOne({ _id: doc._id }, { $set: { [option]: value } });

        return embeds.successEmbed(interaction, `Successfully set ${option} to ${value}.`)
    }
}