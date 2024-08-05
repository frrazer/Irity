const embeds = require("../embed")

module.exports = {
    async execute(interaction, client) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return embeds.errorEmbed(interaction, 'You need to be in a voice channel to shuffle the queue.', null, false);
        }

        const queue = client.distube.getQueue(interaction.guild.id);
        if (!queue) {
            return embeds.errorEmbed(interaction, 'There is nothing playing.', null, false);
        }

        try {
            client.distube.shuffle(queue);
            return embeds.successEmbed(interaction, 'The queue has been shuffled.', null, false);
        } catch (error) {
            console.error(error);
            return embeds.errorEmbed(interaction, 'An error occurred while trying to shuffle the queue.', null, false);
        }
    }
};
