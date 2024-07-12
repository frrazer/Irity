const {
    SlashCommandBuilder,
    EmbedBuilder,
    SlashCommandSubcommandBuilder,
  } = require("discord.js");
  const { chatgpt } = require("../../../../util/runAi");
  const databaseService = require("../../../../services/databaseService");
  
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
      .setDescription("Get AI logs.")
      .addSubcommand(settings.list)
      .addSubcommand(settings.thread),
    roles: ["1213276024020934666"],
    async execute(interaction, client) {
      const subcommand = interaction.options.getSubcommand();
  
      if (subcommand === "list") {
        const database = await databaseService.getDatabase("DiscordServer");
        const collection = database.collection("ValueAIThreads");
        const threads = await collection.find().limit(15).toArray();
        const threadIds = threads.map((thread) => thread.thread_id);
        const threadIdsString = threadIds.join("\n");
  
        return interaction.reply({
          content: threadIdsString,
        });
      } else if (subcommand === "thread") {
        await interaction.deferReply();

        const threadId = interaction.options.getString("thread_id");
        const thread = (await chatgpt.beta.threads.messages.list(threadId)).data;
        let str = "";

        thread.reverse();
        thread.forEach((message) => {
          str += `**${message.role}:** ${message.content[0].text.value}\n\n`;
        });

        return interaction.editReply({
          content: str,
        });
      }
    },
  };
  