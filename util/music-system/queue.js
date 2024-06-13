const { EmbedBuilder } = require('discord.js');
const embeds = require('../embed');

module.exports = {
    async execute(interaction, client) {
        const queue = client.distube.getQueue(interaction.guild.id);

        if (!queue) {
            return embeds.errorEmbed(interaction, 'There is nothing playing.', null, false);
        }

        const totalDuration = queue.songs.reduce((acc, song) => acc + song.duration, 0);
        const hours = Math.floor(totalDuration / 3600);
        const minutes = Math.floor((totalDuration % 3600) / 60);
        const seconds = Math.floor(totalDuration % 60);
        const formattedTotalDuration = `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        const limitedSongs = queue.songs.slice(0, 15);
        const remainingSongs = queue.songs.length - limitedSongs.length;

        try {
            const queueEmbed = new EmbedBuilder()
                .setTitle('Current Music Queue')
                .setDescription(
                    limitedSongs
                        .map((song, index) => `**${index + 1}.** [${song.name}](${song.url}) - \`${song.formattedDuration}\` (by ${song.user})`)
                        .join('\n') + (remainingSongs > 0 ? `\n...and ${remainingSongs} more song(s)` : '')
                )
                .addFields(
                    { name: 'Total Songs', value: `${queue.songs.length}`, inline: true },
                    { name: 'Total Duration', value: `${formattedTotalDuration}`, inline: true },
                    { name: 'Now Playing', value: `[${queue.songs[0].name}](${queue.songs[0].url}) - \`${queue.songs[0].formattedDuration}\` (requested by ${queue.songs[0].user})` }
                )
                .setFooter({ text: `Requested by ${queue.songs[0].user.tag}`, iconURL: queue.songs[0].user.displayAvatarURL() })
                .setColor('Blue')
                .setThumbnail(queue.songs[0].thumbnail);

            return interaction.reply({ embeds: [queueEmbed] });
        } catch (error) {
            console.error(error);
            return embeds.errorEmbed(interaction, 'An error occurred while trying to display the queue.', null, false);
        }
    }
};
