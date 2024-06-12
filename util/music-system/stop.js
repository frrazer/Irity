// stop.js
const embeds = require("../embed")

module.exports = {
    async execute(interaction, client) {
        const queue = client.distube.getQueue(interaction.guild.id);

        if (!queue) {
            return embeds.errorEmbed(interaction, 'There is nothing playing.', null, false);
        }

        try {
            client.distube.stop(interaction.guild.id);
            return embeds.successEmbed(interaction, 'The music has been stopped.', null, false);
        } catch (error) {
            console.error(error);
            return embeds.errorEmbed(interaction, 'An error occurred while trying to stop the music.', null, false);
        }
    }
};
