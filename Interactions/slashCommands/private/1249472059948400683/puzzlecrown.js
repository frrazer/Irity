const {
  SlashCommandBuilder,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
} = require("discord.js");
const databaseService = require("../../../../services/databaseService");
const embeds = require("../../../../util/embed");
const getRobloxFromDiscord = require("../../../../util/getRobloxFromDiscord");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("guess")
    .setDescription("Guess the number to win a puzzle crown.")
    .addIntegerOption((option) =>
      option
        .setName("number")
        .setDescription("The number you want to guess.")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),
  async execute(interaction, client) {
    const current_epoch_seconds = Math.floor(Date.now() / 1000);
    const start_time = 1722279600;
    if (current_epoch_seconds < start_time) {
      return embeds.errorEmbed(
        interaction,
        `The Puzzle Crown event starts <t:${start_time}:R>! 🕒`,
        null,
        true
      );
    }

    const guess = interaction.options.getInteger("number");
    const database = await databaseService.getDatabase("DiscordServer");
    const ah_database = await databaseService.getDatabase("ArcadeHaven");
    const collection = database.collection("CasinoEmpireLevelling");
    let document = await collection.findOne({ user_id: interaction.user.id });
    const items_collection = ah_database.collection("items");
    const item = await items_collection.findOne({ itemId: 13014447392 });

    if (!document) {
      document = {
        user_id: interaction.user.id,
        tracking: {
          messages: 1,
          xp: 0,
          last_message: Date.now(),
        },
        settings: {
          level_up_notification: true,
        },
        caching: {
          last_updated: Date.now(),
          username: interaction.user.username,
        },
        events: {
          puzzlecrown: {
            attempts: 0,
            correct: Math.floor(Math.random() * 100) + 1,
            max_attempts: 5,
            won: false,
          },
        },
      };
      await collection.insertOne(document);
    }

    if (!document.events || !document.events.puzzlecrown) {
      document.events = document.events || {};
      document.events.puzzlecrown = {
        attempts: 0,
        correct: Math.floor(Math.random() * 100) + 1,
        max_attempts: 5,
        won: false,
      };

      await collection.updateOne(
        { user_id: interaction.user.id },
        { $set: { events: document.events } }
      );
    }

    if (document.events.puzzlecrown.won) {
      return embeds.errorEmbed(
        interaction,
        "You have already won a puzzle crown! 🎉",
        null,
        true
      );
    }

    if (item.serials[6].u !== 1) {
      return embeds.errorEmbed(
        interaction,
        "No more puzzle crowns are available! 😢",
        null,
        true
      );
    }

    const { attempts, correct } = document.events.puzzlecrown;
    const attempts_left = 6 - attempts;

    if (attempts_left <= 0) {
      return embeds.errorEmbed(
        interaction,
        "Sorry, you have no attempts left 🥲.",
        null,
        true
      );
    }

    if (guess !== correct) {
      document.events.puzzlecrown.attempts++;
      await collection.updateOne(
        { user_id: interaction.user.id },
        { $set: { events: document.events } }
      );

      return embeds.errorEmbed(
        interaction,
        `Whoops.. that wasn't the correct number. You have ${
          attempts_left - 1
        } attempts left.`,
        null,
        true
      );
    } else {
      await interaction.deferReply({
        ephemeral: true,
      });

      document.events.puzzlecrown.won = true;
      await collection.updateOne(
        { user_id: interaction.user.id },
        { $set: { events: document.events } }
      );

      const robloxId = (
        await getRobloxFromDiscord(client, interaction.user.id)
      )[1];
      const serial = item.serials.findIndex((serial) => serial.u === 1);
      await items_collection.updateOne(
        { itemId: 13014447392 },
        {
          $set: {
            [`serials.${serial}.u`]: Number(robloxId),
          },
        }
      );

      await embeds.successEmbed(
        interaction,
        "🎉 That was the correct number and you have won a puzzle crown!",
        null,
        true
      );

      const announcement_channel = interaction.guild.channels.cache.get(
        "1089320905395667045"
      );
      if (announcement_channel) {
        await announcement_channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                `🎉 ${interaction.user.username} has just won a puzzle crown!`
              )
              .setDescription(
                `Their number was ${guess}, and they guessed correctly in ${attempts} attempts.`
              )
              .setColor("#34449c")
              .setThumbnail(
                "https://tr.rbxcdn.com/b18ce5eefba6cb9355ac79d25aed6502/150/150/Hat/Png"
              ),
          ],
        });
      }
    }
  },
};
