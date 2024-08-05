const embeds = require("../embed")

module.exports = {
    async execute(interaction, client) {
        const connection = client.distube.voices.get(interaction.guild.id);

        if (!connection) {
            return embeds.errorEmbed(interaction, 'I am not connected to a voice channel.', null, false);
        }

        try {
            client.distube.voices.leave(interaction.guild.id);
            return embeds.successEmbed(interaction, `Disconnected from ${connection.channel.name}.`, null, false);
        } catch (error) {
            console.error(error);
            return embeds.errorEmbed(interaction, 'An error occurred while trying to disconnect from the voice channel.', null, false);
        }
    }
};
