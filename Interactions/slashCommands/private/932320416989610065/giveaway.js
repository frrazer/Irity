const {
  SlashCommandBuilder,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
} = require("discord.js");
const databaseService = require("../../../../services/databaseService");
const embeds = require("../../../../util/embed");

const settings = {
  create: new SlashCommandSubcommandBuilder()
    .setName("create")
    .setDescription("Create a giveaway."),
  start: new SlashCommandSubcommandBuilder()
    .setName("start")
    .setDescription("Start a giveaway.")
    .addStringOption((option) =>
      option
        .setName("code")
        .setDescription("The giveaway code.")
        .setRequired(true)
        .setMinLength(4)
        .setMaxLength(4)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to start the giveaway in.")
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName("role1")
        .setDescription("The role to ping when the giveaway starts.")
        .setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName("role2")
        .setDescription("The role to ping when the giveaway ends.")
        .setRequired(false)
    ),
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Manage giveaways.")
    .addSubcommand(settings.create)
    .addSubcommand(settings.start),
  roles: ["1254848251253882930"],
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    try {
      require(`../../../../util/giveaways/${subcommand}.js`).execute(
        interaction,
        client
      );
    } catch (error) {
      console.error(error);
      return embeds.errorEmbed(
        interaction,
        "This command is not implemented yet."
      );
    }
  },
};
