// volume.js
const embeds = require("../embed")

module.exports = {
    async execute(interaction, client) {
        const volume = interaction.options.getInteger('volume');
        
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return embeds.errorEmbed(interaction, 'You need to be in a voice channel to change the volume.', null, false);
        }

        const queue = client.distube.getQueue(interaction.guild.id);
        if (!queue) {
            return embeds.errorEmbed(interaction, 'There is nothing playing.', null, false);
        }

        if (volume < 0 || volume > 100) {
            return embeds.errorEmbed(interaction, 'The volume must be between 0 and 100.', null, false);
        }

        try {
            client.distube.setVolume(interaction.guild.id, volume);
            return embeds.successEmbed(interaction, `The volume has been set to ${volume}.`, null, false);
        } catch (error) {
            console.error(error);
            return embeds.errorEmbed(interaction, 'An error occurred while trying to set the volume.', null, false);
        }
    }
};
