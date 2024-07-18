const { EmbedBuilder } = require("discord.js");
const databaseService = require("../../services/databaseService");

module.exports = async function (client) {
  try {
    const db = await databaseService.getDatabase("ArcadeHaven");
    const collection = db.collection("codes");
    const collection2 = db.collection("user_analytics");

    const guild = await client.guilds.fetch("932320416989610065");
    if (!guild) return;
    const channel = await guild.channels.fetch("1089320905395667045");
    if (!channel) return;
    const codes_message = await channel.messages.fetch("1253844862797742260");
    const statistics_message = await channel.messages.fetch(
      "1263043498228191274"
    );
    if (!codes_message || !statistics_message) return;
    if (codes_message.author.id !== client.user.id) return;
    if (statistics_message.author.id !== client.user.id) return;

    async function verify_active_codes() {
      try {
        const codes = await collection
          .find({ src: { $exists: false }, script: { $ne: "" } })
          .toArray();
        let active_codes = [];
        for (let code of codes) {
          const expiration = code.expiration;
          const max_uses = code.max_uses;
          const uses = code.uses;

          if (
            !(
              (max_uses !== 0 && uses >= max_uses) ||
              (expiration !== 0 && expiration < Date.now())
            )
          ) {
            active_codes.push(code);
          }
        }

        let content = `## <:tt_ys:1187754951171125249> Active Codes\n\n`;
        for (let code of active_codes) {
          if (code.expiration) {
            content += `**${code.code}** - Expires <t:${Math.floor(
              code.expiration / 1000
            )}:R> (${code.uses || 0} uses)\n`;
          } else if (code.max_uses) {
            content += `**${code.code}** - ${code.uses || 0}/${
              code.max_uses
            } uses\n`;
          }
        }

        function normalizeString(str) {
          return str.trim().replace(/\s+/g, " ");
        }

        const normalizedMessageContent = normalizeString(codes_message.content);
        const normalizedContent = normalizeString(content);
        if (normalizedMessageContent !== normalizedContent) {
          codes_message.edit(content);
        }
      } catch (error) {
        console.error('Error verifying active codes:', error);
      }
    }

    async function updateCoinflipStatistics() {
      try {
        const doc = await collection2.findOne({ userId: 2 });
        const coinflips_won = doc.coinflips_won || 0;
        const coinflips_lost = doc.coinflips_lost || 0;
        const embed = new EmbedBuilder()
          .setTitle("Coinflip Bot Statistics")
          .addFields(
            {
              name: "Coinflips Won",
              value: coinflips_won.toLocaleString(),
              inline: true,
            },
            {
              name: "Coinflips Lost",
              value: coinflips_lost.toLocaleString(),
              inline: true,
            },
            {
              name: "Win Rate",
              value: `${(
                (coinflips_won / (coinflips_won + coinflips_lost)) *
                100
              ).toFixed(2)}%`,
              inline: true,
            }
          )
          .setColor("Blue")
          .setDescription(
            `-# Last updated <t:${Math.floor(Date.now() / 1000)}:R>`
          );

        statistics_message.edit({ embeds: [embed], content: "" });
      } catch (error) {
        console.error('Error updating coinflip statistics:', error);
      }
    }

    verify_active_codes();
    updateCoinflipStatistics();
    setInterval(verify_active_codes, 8000);
    setInterval(updateCoinflipStatistics, 20000);
  } catch (error) {
    console.error('Error initializing module:', error);
  }
};
