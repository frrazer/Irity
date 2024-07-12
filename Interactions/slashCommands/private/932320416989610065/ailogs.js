const {
  SlashCommandBuilder,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
} = require("discord.js");
const { chatgpt } = require("../../../../util/runAi");

const settings = {
  list: new SlashCommandSubcommandBuilder()
    .setName("list")
    .setDescription("Get the 15 most recent thread IDs."),
  thread: new SlashCommandSubcommandBuilder()
    .setName("thread")
    .setDescription("Get a thread's data.")
    .addStringOption((option) =>
      option
        .setName("thread_id")
        .setDescription("The thread ID to lookup.")
        .setRequired(true)
    ),
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ailogs")
    .setDescription("Get AI logs."),
  roles: ["1213276024020934666"],
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    // if (subcommand === "list") {
    //   chatgpt.beta.threads.runs.
    // }
  },
};
