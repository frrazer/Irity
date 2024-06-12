const embeds = require("../embed")

module.exports = {
    async execute(interaction, client) {
        const queue = client.distube.getQueue(interaction.guild.id);

        if (!queue) {
            return embeds.errorEmbed(interaction, 'I am not connected to a voice channel.', null, false);
        }

        const channel = queue.voiceChannel;

        try {
            await interaction.deferReply();
            await client.distube.voices.leave(interaction.guild.id);
            return embeds.successEmbed(interaction, `Disconnected from ${channel.name}.`, null, false);
        } catch (error) {
            console.error(error);
            return embeds.errorEmbed(interaction, 'An error occurred while trying to disconnect from the voice channel.', null, false);
        }
    }
};
