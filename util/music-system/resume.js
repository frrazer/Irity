const embeds = require("../embed")

module.exports = {
    async execute(interaction, client) {
        const queue = client.distube.getQueue(interaction.guild.id);

        if (!queue) {
            return embeds.errorEmbed(interaction, 'There is nothing playing.');
        }

        try {
            if (!queue.paused) {
                return embeds.errorEmbed(interaction, 'The music is already playing.');
            }
            client.distube.resume(interaction.guild.id);
            return embeds.successEmbed(interaction, 'The music has been resumed.');
        } catch (error) {
            console.error(error);
            return embeds.errorEmbed(interaction, 'An error occurred while trying to resume the music.');
        }
    }
};
