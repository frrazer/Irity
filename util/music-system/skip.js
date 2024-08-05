// skip.js
const embeds = require("../embed")

module.exports = {
    async execute(interaction, client) {
        const queue = client.distube.getQueue(interaction.guild.id);

        if (!queue) {
            return embeds.errorEmbed(interaction, 'There is nothing playing.');
        }

        try {
            await interaction.deferReply();
            await client.distube.skip(interaction.guild.id);
            return embeds.successEmbed(interaction, 'The song has been skipped.');
        } catch (error) {
            if (error.message == "There is no up next song") {
                return embeds.errorEmbed(interaction, 'There is no more songs in the queue.');
            }

            return embeds.errorEmbed(interaction, 'An error occurred while trying to skip the song.');
        }
    }
};
