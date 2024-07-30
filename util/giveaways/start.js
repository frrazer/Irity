const databaseService = require("../../services/databaseService");
const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const embeds = require("../../util/embed");

module.exports = {
  async execute(interaction, client) {
    const code = interaction.options.getString("code");
    const channel = interaction.options.getChannel("channel");

    const database = await databaseService.getDatabase("DiscordServer");
    const collection = database.collection("IrityGiveaways");
    const giveaway = await collection.findOne({ code });

    if (!giveaway) {
      return embeds.errorEmbed(interaction, "Giveaway not found!", null, true);
    }

    const total_winners = giveaway.data.total_winners;
    const duration = giveaway.data.duration;
    const host_id = giveaway.data.host;
    const reward = giveaway.data.reward;
    const requirements = giveaway.data.requirements;
    const end_time = Math.floor(Date.now() / 1000 + duration);

    // build the giveaway embed

    const requirementsArray = [
      requirements.boosting
        ? "<:bluedot:1267190531901882532> Must be server boosting! <a:boosting:1267191928676548730>"
        : "",
      requirements.level
        ? `<:bluedot:1267190531901882532> Be at least **Level ${requirements.level}**`
        : "",
      requirements.roles
        ? `<:bluedot:1267190531901882532> Roles: ${requirements.roles
            .map((role) => `<@&${role}>`)
            .join(", ")}`
        : "",
      requirements.none
        ? "<:bluedot:1267190531901882532> No requirements!"
        : "",
    ];

    const embed = new EmbedBuilder()
      .setAuthor({
        name: reward,
        iconURL:
          "https://cdn.discordapp.com/emojis/1267192501203107920.webp?size=56&quality=lossless",
      })
      .setDescription(
        `
        <:grey_dot:1264285450995105823> **${total_winners}** Winner${
          total_winners > 1 ? "s" : ""
        }
        <:grey_dot:1264285450995105823> Ending <t:${end_time}:R>
        <:grey_dot:1264285450995105823> Hosted by <@${host_id}>

        **Requirements:**        
        ${requirementsArray.filter(Boolean).join("\n")}
      `
      )
      .setColor("Blue");

    const buttons = [
      new ButtonBuilder()
        .setLabel(`Participate (0)`)
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🎉")
        .setCustomId("giveaway-enter")
        .setDisabled(false),
    ];

    const message = await channel.send({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(buttons)],
    });

    const giveaway_id = message.id;
    await collection.updateOne(
      { code },
      {
        $set: {
          message_id: giveaway_id,
          channel_id: channel.id,
          guild_id: channel.guild.id,
          started: true,
          end_time,
        },
        $unset: {
          code: "",
        },
      }
    );

    return embeds.successEmbed(
      interaction,
      `Giveaway started in <#${channel.id}>!`,
      null,
      true
    );
  },
};
