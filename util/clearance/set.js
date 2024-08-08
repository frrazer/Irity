const databaseService = require("../../services/databaseService");
const embeds = require("../embed");
const calculateClearance = require("../calculateClearance");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  async execute(interaction, client) {
    const user = interaction.options.getUser("user");
    const level = interaction.options.getString("level");

    const database = await databaseService.getDatabase("DiscordServer");
    const collection = database.collection("CasinoEmpireLevelling");
    const document = await collection.findOne({ user_id: user.id });

    if (!document) {
      return embeds.errorEmbed(
        interaction,
        "User not found within database.",
        null,
        true
      );
    }

    if (!document.clearance) {
      document.clearance = { level: "DEFAULT" };
    }

    const permissions = calculateClearance.getPermissions(level);

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Are you sure?")
          .setDescription(
            `<@${user.id}> will receive the following permissions: ${permissions
              .map((permission) => `\`${permission}\``)
              .join(", ")}`
          )
          .setFooter({text: `Level: ${level}`})
          .setColor("Orange"),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Confirm")
            .setStyle(ButtonStyle.Success)
            .setCustomId("clearance-confirm"),
          new ButtonBuilder()
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("clearance-cancel")
        ),
      ],
    });
  },
};
