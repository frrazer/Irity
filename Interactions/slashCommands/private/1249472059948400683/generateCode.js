const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getDatabase } = require("../../../../services/databaseService");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("generate-code")
        .setDescription("Generates a code for the user to redeem.").addStringOption(option =>
            option
                .setName("script")
                .setDescription("The script to run.")
                .setRequired(true)
        ).addStringOption(option =>
            option
                .setName("notification")
                .setDescription("The notification to send.")
        ).addIntegerOption(option =>
            option
                .setName("uses")
                .setDescription("The number of uses the code has.")
        ),
    async execute(interaction, client) {
        const db = await getDatabase("ArcadeHaven");
        const collection = db.collection("codes");

        const script = interaction.options.getString("script");
        const notification = interaction.options.getString("notification");
        const uses = interaction.options.getInteger("uses");


        // generate a random 20 character code
        const code = Math.random().toString(36).substring(2, 22);
        collection.insertOne({
            code: code,
            script: script,
            notification: notification || "You have redeemed a code.",
            max_uses: uses || 1,
        });

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("Code Generated")
                    .setDescription(`Code: \`${code}\``)
                    .setColor("Blue"),
            ],
        });
    },
};
