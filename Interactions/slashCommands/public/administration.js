const { SlashCommandBuilder, EmbedBuilder, SlashCommandSubcommandBuilder } = require("discord.js");
const databaseService = require("../../../services/databaseService");
const embeds = require("../../../util/embed")

const settings = {
    "lookup": new SlashCommandSubcommandBuilder()
        .setName("lookup")
        .setDescription("Lookup a user's data.")
        .addStringOption(option => option.setName("username").setDescription("The user to lookup.").setRequired(true)),
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Administrative commands.")
        .addSubcommand(settings.lookup),
    roles: ["1182048570216546395"],
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        try {
            require(`../../../util/administration/${subcommand}.js`).execute(interaction, client)
        } catch (error) {
            return embeds.errorEmbed(interaction, "This command is not implemented yet.")
        }
    },
};