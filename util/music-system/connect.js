// connect.js
const { joinVoiceChannel } = require("@discordjs/voice")
const embeds = require("../embed")

module.exports = {
    async execute(interaction, client) {
        const channel = interaction.member.voice.channel;
        if (!channel) return embeds.errorEmbed(interaction, "You need to be in a voice channel to use this command.", null, false);
    }
}