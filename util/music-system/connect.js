const embeds = require("../embed")

module.exports = {
    async execute(interaction, client) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return embeds.errorEmbed(interaction, 'You need to be in a voice channel to connect to a voice channel.', null, false);
        }

        const channel = client.channels.cache.get(voiceChannel.id);

        try {
            await interaction.deferReply();
            await client.distube.voices.join(channel);
            return embeds.successEmbed(interaction, `Connected to ${channel.name}.`, null, false);
        } catch (error) {
            console.error(error);
            return embeds.errorEmbed(interaction, 'An error occurred while trying to connect to the voice channel.', null, false);
        }
    }
};
