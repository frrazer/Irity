// play.js
const { EmbedBuilder } = require('discord.js');
const embeds = require('../embed');

module.exports = {
    async execute(interaction, client) {
        const query = interaction.options.getString('query');

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: 'You need to be in a voice channel to play music.', ephemeral: true });
        }

        try {
            let queue = client.distube.getQueue(interaction.guild.id)
            let current_song = queue ? queue.songs[0] : null;

            await interaction.deferReply();

            await client.distube.play(voiceChannel, query, {
                member: interaction.member,
                textChannel: interaction.channel,
                interaction
            });

            queue = client.distube.getQueue(interaction.guild.id);
            let added_song = queue.songs[queue.songs.length - 1];

            let embed;
            if (!current_song) {
                added_song = queue.songs[0];
                embed = new EmbedBuilder()
                    .setTitle('Success!')
                    .setDescription(`<:tt_ys:1187754951171125249> Now playing: [${added_song.name}](${added_song.url}) - \`${added_song.formattedDuration}\``)
                    .setThumbnail(added_song.thumbnail).setColor("#45B681")
            } else {
                const positionInQueue = queue.songs.find

                embed = new EmbedBuilder()
                    .setTitle('Success!')
                    .setDescription(`<:tt_ys:1187754951171125249> Added [${added_song.name}](${added_song.url}) - \`${added_song.formattedDuration}\` to the queue.`)
                    .setThumbnail(added_song.thumbnail).setColor("#45B681")
            }

            return interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            return interaction.followUp({ content: 'An error occurred while trying to play the track.', ephemeral: true });
        }
    }
};
