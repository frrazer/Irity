const embeds = require('../embed');

module.exports = {
    async execute(interaction, client) {
        const level = interaction.options.getInteger('level');

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return embeds.errorEmbed(interaction, 'You need to be in a voice channel to set the bass boost level.', null, false);
        }

        const queue = client.distube.getQueue(interaction.guild.id);
        if (!queue) {
            return embeds.errorEmbed(interaction, 'There is nothing playing.', null, false);
        }

        if (level < 0 || level > 10) {
            return embeds.errorEmbed(interaction, 'The bass boost level must be between 0 and 10.', null, false);
        }

        try {
            const filter = `bass=g=${level}`;
            queue.filters.clear()
            queue.filters.add({
                name: 'bassboost',
                value: filter
            }, true);
            return embeds.successEmbed(interaction, `The bass boost level has been set to ${level}.`, null, false);
        } catch (error) {
            console.error(error);
            return embeds.errorEmbed(interaction, 'An error occurred while trying to set the bass boost level.', null, false);
        }
    }
};
