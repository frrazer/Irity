const { SlashCommandSubcommandBuilder, SlashCommandBuilder } = require("discord.js");
const embeds = require("../../../util/embed")
const autodropper = require("../../../util/message-creation/autodropFiller")

const settings = {
    "monitor": new SlashCommandSubcommandBuilder()
        .setName("monitor")
        .setDescription("Begin/Stop monitoring your messages for drop requests."),
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("autodropper")
        .setDescription("Manage the autodropper.")
        .addSubcommand(settings.monitor),
    roles: ["1252381044796031016", "1182048570216546395"],
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const user_id = interaction.user.id;

        if (subcommand === "monitor") {
            const isTracking = await autodropper.toggleTracking(user_id, interaction.channel.id);
            return embeds.successEmbed(interaction, `Your messages are **${isTracking ? "now being monitored" : "no longer being monitored"}** in this channel for drop requests.`);
        }
    },
};