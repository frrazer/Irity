const { SlashCommandBuilder, EmbedBuilder, SlashCommandSubcommandBuilder } = require("discord.js");
const databaseService = require("../../../../services/databaseService");
const embeds = require("../../../../util/embed")
const calculateLevel = require("../../../../util/calculateLevel");

const settings = {
    "xp": new SlashCommandSubcommandBuilder()
        .setName("xp")
        .setDescription("Check the XP leaderboard."),
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Check the leaderboards.")
        .addSubcommand(settings.xp),
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "xp") {
            await interaction.deferReply();

            const database = await databaseService.getDatabase("DiscordServer");
            const collection = database.collection("CasinoEmpireLevelling");

            const leaderboard = await collection.find().sort({ "tracking.xp": -1 }).limit(10).toArray();

            const embed = new EmbedBuilder()
                .setTitle("XP Leaderboard")
                .setColor("Blue")
                .setTimestamp();

            let description = '';
            for (let i = 0; i < leaderboard.length; i++) {
                let username;
                const now = Date.now();
                const oneHour = 60 * 60 * 1000; // in milliseconds

                if (leaderboard[i].caching && leaderboard[i].caching.username && leaderboard[i].caching.last_updated && now - leaderboard[i].caching.last_updated < oneHour) {
                    username = leaderboard[i].caching.username;
                } else {
                    const user = await interaction.client.users.fetch(leaderboard[i].user_id);
                    username = user.username;
                    leaderboard[i].caching = {
                        username: username,
                        last_updated: now
                    };

                    await collection.updateOne({ user_id: leaderboard[i].user_id }, { $set: { caching: leaderboard[i].caching } });
                }

                const lvl = calculateLevel(leaderboard[i].tracking.xp)
                description += `**${i + 1}.** **${username}** - Level ${lvl.currentLevel} \`(${Math.floor(leaderboard[i].tracking.xp).toLocaleString()}/${Math.floor(lvl.xpToNextLevel+leaderboard[i].tracking.xp).toLocaleString()})\` \n`;
            }

            embed.setDescription(description);
            interaction.editReply({ embeds: [embed] });
        }
    },
};