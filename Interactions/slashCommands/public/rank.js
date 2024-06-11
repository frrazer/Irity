const { SlashCommandBuilder, EmbedBuilder, SlashCommandSubcommandBuilder } = require("discord.js");
const databaseService = require("../../../services/databaseService");
const embeds = require("../../../util/embed")
const calculateLevel = require("../../../util/calculateLevel");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rank")
        .setDescription("Get your current rank & level.").addUserOption(user =>
            user
                .setName("user")
                .setDescription("The user to get the rank of.")
                .setRequired(false),
        ),
    async execute(interaction, client) {
        const database = databaseService.getDatabase("DiscordServer");
        const collection = database.collection("CasinoEmpireLevelling");
        const target_user = interaction.options.getUser("user");
        const authorId = target_user ? target_user.id : interaction.user.id;

        const result = await collection.findOne({ user_id: authorId });
        if (result) {
            const lvl = calculateLevel(result.tracking.xp)
            const leaderboard = await collection.find({}, { projection: { user_id: 1, "tracking.xp": 1 } }).sort({ "tracking.xp": -1 }).toArray();
            const rank = leaderboard.findIndex(user => user.user_id === authorId) + 1;

            const embed = new EmbedBuilder()
                .setTitle(`${authorId === interaction.user.id ? "Your" : `${target_user.username}'s`} Rank`)
                .setDescription(`**Leaderboard Rank:** #${rank}\n**Level:** ${lvl.currentLevel} (${result.tracking.xp.toLocaleString()}/${Math.floor(lvl.xpToNextLevel + result.tracking.xp).toLocaleString()})\n**XP until next level:** ${Math.floor(lvl.xpToNextLevel).toLocaleString()}`)
                .setColor("Blue")
                .setThumbnail(target_user ? target_user.displayAvatarURL() : interaction.user.displayAvatarURL())

            interaction.reply({ embeds: [embed] });
        } else {
            embeds.errorEmbed(interaction, "You have not started levelling yet. Send a message to start levelling.", null, true);
        }
    },
};