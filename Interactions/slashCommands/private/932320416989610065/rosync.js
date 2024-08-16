const {
  SlashCommandBuilder,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const databaseService = require("../../../../services/databaseService");
const embeds = require("../../../../util/embed");
const { generators, Issuer, custom, TokenSet } = require("openid-client");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rosync")
    .setDescription("Link your Roblox account to your Discord account.")
    .addStringOption((option) =>
      option
        .setName("code")
        .setDescription("Your Verification Code")
        .setRequired(true)
    ),
  cooldown: 60,
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const db = await databaseService.getDatabase("RobloxOAuth");
    const collection = db.collection("pending");
    const userCollection = db.collection("users");

    let pendingLink = await collection.findOne({
      discordId: interaction.user.id,
      date: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
    });

    const issuer = await Issuer.discover(
      "https://apis.roblox.com/oauth/.well-known/openid-configuration"
    );

    const issuerClient = new issuer.Client({
      client_id: process.env.ROAUTH_CLIENT_ID,
      client_secret: process.env.ROAUTH_CLIENT_SECRET,
      redirect_uris: [`https://auth.noxirity.com/`],
      response_types: ["code"],
      scope: "openid profile group:read",
      id_token_signed_response_alg: "ES256",
    });

    issuerClient[custom.clock_tolerance] = 180;

    if (!pendingLink) {
      const state = generators.state();
      const nonce = generators.nonce();
      const urlId = require("crypto")
        .randomBytes(4)
        .toString("hex")
        .slice(0, 7);

      await collection.insertOne({
        discordId: interaction.user.id,
        code: interaction.options.getString("code"),
        state: state,
        nonce: nonce,
        date: new Date(),
        urlId: urlId,
        url: issuerClient.authorizationUrl({
          scope: issuerClient.scope,
          state: state,
          nonce: nonce,
        }),
      });

      pendingLink = { state, nonce, urlId };
    }

    const embed = await embeds.successEmbed(
      interaction,
      `Click the link below to connect your Roblox account to your Discord account.`,
      "The button will expire in 5 minutes.",
      true,
      true
    );

    const Button = new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setURL(`https://auth.noxirity.com/r?id=${pendingLink.urlId}`)
      .setLabel("Connect Account");

    await interaction.editReply({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(Button)],
    });

    const interval = setInterval(async () => {
      const pendingLink = await collection.findOne({
        discordId: interaction.user.id,
        date: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
      });

      if (!pendingLink) {
        clearInterval(interval);

        const user = await userCollection.findOne({
          discordId: interaction.user.id,
        });

        if (user) {
          await embeds.neutralEmbed(
            interaction,
            "Confirming authentication..."
          );

          const tokenSetData = user.tokenSet;
          const tokenSet = new TokenSet(tokenSetData);
          const claims = tokenSet.claims();

          const embed = await embeds.successEmbed(
            interaction,
            `Thanks for linking your Roblox account to Discord. Authentication was successful!`,
            null,
            true,
            true,
            "🎉"
          );

          embed.setThumbnail(claims.picture);
          embed.setTitle(`Hey, ${claims.preferred_username}!`);
          await interaction.editReply({ embeds: [embed] });

          userCollection.updateOne(
            { discordId: interaction.user.id },
            {
              $set: {
                claims: claims,
                claimsExpiry: new Date(Date.now() + 12 * 60 * 60 * 1000),
              },
            }
          );
        } else {
          return await embeds.errorEmbed(
            interaction,
            "Authentication timed out. Please try again later."
          );
        }
      }
    }, 3000);
  },
};
