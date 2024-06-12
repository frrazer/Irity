const { SlashCommandBuilder, EmbedBuilder, SlashCommandSubcommandBuilder } = require("discord.js");
const databaseService = require("../../../services/databaseService");
const embeds = require("../../../util/embed")

const settings = {
    "play": new SlashCommandSubcommandBuilder()
        .setName("play")
        .setDescription("Play or queue a song.").addStringOption(option =>
            option.setName("query")
                .setDescription("The song you want to play.")
                .setRequired(true)),
    "skip": new SlashCommandSubcommandBuilder()
        .setName("skip")
        .setDescription("Skip the current song."),
    "stop": new SlashCommandSubcommandBuilder()
        .setName("stop")
        .setDescription("Stop the music."),
    "disconnect": new SlashCommandSubcommandBuilder()
        .setName("disconnect")
        .setDescription("Disconnect the bot from the voice channel."),
    "pause": new SlashCommandSubcommandBuilder()
        .setName("pause")
        .setDescription("Pause the music."),
    "resume": new SlashCommandSubcommandBuilder()
        .setName("resume")
        .setDescription("Resume the music."),
    "queue": new SlashCommandSubcommandBuilder()
        .setName("queue")
        .setDescription("View the queue."),
    "connect": new SlashCommandSubcommandBuilder()
        .setName("connect")
        .setDescription("Connect the bot to the voice channel."),
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("music")
        .setDescription("Play some music in a voice channel.")
        .addSubcommand(settings.play)
        .addSubcommand(settings.skip)
        .addSubcommand(settings.stop)
        .addSubcommand(settings.disconnect)
        .addSubcommand(settings.pause)
        .addSubcommand(settings.resume)
        .addSubcommand(settings.queue)
        .addSubcommand(settings.connect),
    roles: ["1213276024020934666"],
    async execute(interaction, client) {
        try {
            const subcommand = interaction.options.getSubcommand();
            const file = require(`../../../util/music-system/${subcommand}.js`);
            file.execute(interaction, client);
        } catch (error) {
            embeds.errorEmbed(interaction, "It seems like there was an error executing the command.", null, false);
        }
    },
};