const databaseService = require("../../services/databaseService");
const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const embeds = require("../../util/embed");
const calculateLevel = require("../../util/calculateLevel");

module.exports = {
  async execute(interaction, client) {
    const user_id = interaction.user.id;
    const giveaway_id = interaction.message.id;
    const database = await databaseService.getDatabase("DiscordServer");
    const collection = database.collection("GiveawayEntries");

    const entry = await collection.findOne({ user_id, giveaway_id });
    if (entry) {
      return interaction.reply({
        embeds: [
          await embeds.errorEmbed(
            interaction,
            "You have already entered this giveaway!",
            null,
            true,
            true
          ),
        ],
        components: [
          new ActionRowBuilder().addComponents([
            new ButtonBuilder()
              .setCustomId("giveaway-leave")
              .setLabel("Leave Giveaway")
              .setEmoji("<:close:1252438815189241897>")
              .setStyle(ButtonStyle.Secondary),
          ]),
        ],
        ephemeral: true,
      });
    }

    // check requirements
    const giveaway = await database.collection("IrityGiveaways").findOne({
      message_id: giveaway_id,
    });

    if (!giveaway) {
      return embeds.errorEmbed(
        interaction,
        "I couldn't find this giveaway, it may have ended or been deleted.",
        null,
        true
      );
    }

    const requirements = giveaway.data.requirements;
    if (requirements.boosting) {
      // must have 932538393622085652 role
      const member = interaction.member;
      const has_role = member.roles.cache.has("932538393622085652");
      if (!has_role) {
        return embeds.errorEmbed(
          interaction,
          "You must be boosting the server to enter this giveaway!",
          null,
          true
        );
      }
    }

    if (requirements.level) {
      const user = await database
        .collection("CasinoEmpireLevelling")
        .findOne({ user_id });
      const xp = user ? user.tracking.xp : 0;
      const level = calculateLevel(xp).currentLevel

      console.log("level", level);
      console.log("requirements.level", requirements.level);
      console.log("xp", xp);

      if (level < requirements.level) {
        return embeds.errorEmbed(
          interaction,
          `You must be at least **Level ${requirements.level}** to enter this giveaway!`,
          null,
          true
        );
      }
    }

    if (requirements.roles) {
      const member = interaction.member;
      const roles = member.roles.cache;
      const has_roles = requirements.roles.every((role) => roles.has(role));
      if (!has_roles) {
        return embeds.errorEmbed(
          interaction,
          "You must have the required roles to enter this giveaway!",
          null,
          true
        );
      }
    }

    await collection.insertOne({
      user_id,
      giveaway_id,
      timestamp: new Date(),
    });

    return embeds.successEmbed(
      interaction,
      "You have entered the giveaway, good luck!",
      null,
      true
    );
  },
};
