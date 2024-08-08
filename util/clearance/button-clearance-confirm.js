const extractUserId = (str) => {
  const regex = /<@(\d+)>/;
  const match = str.match(regex);
  if (match) {
    return match[1];
  }
  return null;
};

const databaseService = require("../../services/databaseService");
const embeds = require("../embed");

module.exports = {
  async execute(interaction, client) {
    const user_id = extractUserId(interaction.message.embeds[0].description);
    const database = await databaseService.getDatabase("DiscordServer");
    const collection = database.collection("CasinoEmpireLevelling");
    const user = await collection.findOne({ user_id });

    if (!user) {
      return interaction.update({
        content: "User not found",
        components: [],
      });
    }

    const level = interaction.message.embeds[0].footer.text.split("Level: ")[1];
    await collection.updateOne(
      {
        user_id,
      },
      {
        $set: {
          clearance: {
            level: level,
          },
        },
      }
    );

    return interaction.update({
      embeds: [
        await embeds.successEmbed(
          interaction,
          "Clearance level set",
          null,
          false,
          true
        ),
      ],
      components: [],
    });
  },
};
