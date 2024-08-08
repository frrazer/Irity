const {
  SlashCommandSubcommandBuilder,
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const embeds = require("../../../../util/embed");
const {
  calculateClearance,
  getPermissions,
  permissionCheck,
  clearance_levels,
} = require("../../../../util/calculateClearance");

const settings = {
  check: new SlashCommandSubcommandBuilder()
    .setName("check")
    .setDescription("Check a user's clearance level.")
    .addUserOption((user) =>
      user
        .setName("user")
        .setDescription("The user to check clearance for.")
        .setRequired(true)
    ),
  set: new SlashCommandSubcommandBuilder()
    .setName("set")
    .setDescription("Set a user's clearance level.")
    .addUserOption((user) =>
      user
        .setName("user")
        .setDescription("The user to set clearance for.")
        .setRequired(true)
    )
    .addStringOption((level) =>
      level
        .setName("level")
        .setDescription("The level to set.")
        .setRequired(true)
        .addChoices(
          Object.keys(clearance_levels).map((level) => ({
            name: level
              .toLowerCase()
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" "),
            value: level,
          }))
        )
    ),
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clearance")
    .setDescription("Check clearance levels.")
    .addSubcommand(settings.check)
    .addSubcommand(settings.set),
  roles: ["1213276024020934666", "1180090434744229988", "1069023487647301692"],
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    try {
      require(`../../../../util/clearance/${subcommand}.js`).execute(
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
