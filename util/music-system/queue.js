// queue.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    async execute(interaction, client) {
        // Get the queue for the guild
        const queue = client.distube.getQueue(interaction.guild.id);

        // Check if there is an active queue
        if (!queue) {
            return interaction.reply({ content: 'There is no music playing right now!', ephemeral: true });
        }

        // Format the queue information
        try {
            const queueEmbed = new EmbedBuilder()
                .setTitle('Current Music Queue')
                .setDescription(
                    queue.songs
                        .map((song, index) => `${index + 1}. [${song.name}](${song.url}) - \`${song.formattedDuration}\``)
                        .join('\n')
                )
                .setFooter({
                    text: `Now Playing: ${queue.songs[0].name} - ${queue.songs[0].formattedDuration}`,
                })
                .setColor("Blue")

            return interaction.reply({ embeds: [queueEmbed] });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'There was an error displaying the queue!', ephemeral: true });
        }
    }
};
