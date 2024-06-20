const { EmbedBuilder } = require("discord.js");
const databaseService = require("../../services/databaseService");
const embeds = require("../../util/embed");
const { getUsernameFromId, getPlayerThumbnail } = require("noblox.js")

module.exports = {
    async execute(interaction, client) {
        const caseId = interaction.options.getInteger("case");
        const database = await databaseService.getDatabase("ArcadeHaven");
        const cases = database.collection("ModerationCases");
        const data = await cases.findOne({ caseId });

        if (!data) return embeds.errorEmbed(interaction, "No case found with that ID.");
        await interaction.deferReply();

        const moderator = await interaction.guild.members.fetch(data.moderator);
        const target_name = await getUsernameFromId(data.target);
        let fields = [{
            name: "Case",
            value: `\`${caseId}\``,
            inline: true
        },
        {
            name: "Type",
            value: `\`${data.type}\``,
            inline: true
        },
        {
            name: "Moderator",
            value: `\`${moderator.user.username}\``,
            inline: true
        },
        {
            name: "Target",
            value: `<:singleright:1252703372998611085> [\`@${target_name}\`](https://www.roblox.com/users/${data.target}/profile)`,
        },
        {
            name: "Reason",
            value: `${data.reason}`,
            inline: true
        }]

        let thumbnail
        try {
            thumbnail = (await getPlayerThumbnail(data.target, "180x180", "png", false, "headshot"))[0].imageUrl
        } catch (error) {
            console.error(error)
            thumbnail = null
        }

        if (data.type.includes("Ban")) {
            fields.push({
                name: "Proof",
                value: `${data.proof || "No proof provided."}`,
            })
        }

        const embed = new EmbedBuilder()
            .addFields(...fields)
            .setTimestamp(new Date(data.timestamp))
            .setColor("Red")

        if (thumbnail) embed.setThumbnail(thumbnail)

        await interaction.editReply({ embeds: [embed] });
    }
}