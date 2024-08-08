const embeds = require("../embed")


module.exports = {
    async execute(interaction, client) {
        const mode = interaction.options.getString('mode');

        // Check if the user is in a voice channel
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return embeds.errorEmbed(interaction, 'You need to be in a voice channel to change the repeat mode.');
        }

        // Get the queue for the guild
        const queue = client.distube.getQueue(interaction.guild.id);
        if (!queue) {
            return embeds.errorEmbed(interaction, 'There is nothing playing.');
        }

        try {
            let repeatMode;
            switch (mode) {
                case 'none':
                    repeatMode = 0;
                    break;
                case 'song':
                    repeatMode = 1;
                    break;
                case 'queue':
                    repeatMode = 2;
                    break;
                default:
                    return embeds.errorEmbed(interaction, 'Invalid repeat mode provided.');
            }

            client.distube.setRepeatMode(queue, repeatMode);
            return embeds.successEmbed(interaction, `The repeat mode has been set to \`${mode}\`.`);
        } catch (error) {
            console.error(error);
            return embeds.errorEmbed(interaction, 'An error occurred while trying to set the repeat mode.');
        }
    }
};
