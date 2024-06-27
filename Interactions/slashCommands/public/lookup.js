const { SlashCommandBuilder, EmbedBuilder, SlashCommandSubcommandBuilder } = require("discord.js");
const databaseService = require("../../../services/databaseService");
const embeds = require("../../../util/embed")
const { generateGraph } = require("../../../util/generateGraph");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lookup")
        .setDescription("Lookup information")
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("item")
                .setDescription("Lookup an item")
        ),
    async execute(interaction, client) {
        
    },
};