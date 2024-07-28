const {
  SlashCommandBuilder,
  EmbedBuilder,
  messageLink,
  ChannelType,
} = require("discord.js");
const { convertTime } = require("../../../util/functions");
const { gameUnban } = require("../../../services/robloxService");
const {
  errorEmbed,
  neutralEmbed,
  successEmbed,
} = require("../../../util/embed");
const os = require("os");
const { exec } = require("child_process");
const { default: axios } = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dev")
    .setDescription("Run developer commands.")
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The command to run.")
        .setRequired(true)
    ),
  contexts: [0, 1, 2],
  integration_types: [0, 1],
  async execute(interaction, client) {
    const WHITELIST = ["406163086978842625"];
    const valid_commands = [
      "--guilds",
      "--reboot",
      "--game --unbanwave",
      "--kill",
    ];

    if (!WHITELIST.includes(interaction.user.id)) {
      return errorEmbed(
        interaction,
        "You do not have permission to run this command."
      );
    }

    const command = interaction.options.getString("command");
    if (!valid_commands.includes(command)) {
      return errorEmbed(interaction, "Invalid command.", null);
    }

    if (command === "--guilds") {
      const invitePromises = client.guilds.cache.map(async (guild) => {
        if (!guild) return;

        console.log(guild);

        const channels = await guild.channels.fetch();
        const channel = channels.find(
          (channel) => channel.type === ChannelType.GuildText
        );

        try {
          const invite = await channel.createInvite();
          return { guild, invite };
        } catch (error) {
          return { guild, invite: "No invite link available." };
        }
      });

      Promise.all(invitePromises).then((invitesArray) => {
        const invites = Object.fromEntries(
          invitesArray.map(({ guild, invite }) => [guild, invite])
        );
        interaction.reply({
          content: Object.entries(invites)
            .map(([guild, invite]) => `${guild}: ${invite}`)
            .join("\n"),
        });
      });
    } else if (command === "--reboot") {
      await neutralEmbed(
        interaction,
        "An reboot has been requested for `Irity`.",
        null,
        false
      );

      exec("pm2 restart Irity", (error, stdout, stderr) => {
        if (error) {
          errorEmbed(
            interaction,
            `Something went wrong: ${error.message}`,
            null,
            false
          );
        }

        if (stdout) {
          successEmbed(
            interaction,
            `\n## Success\n\`\`\`\n${stdout}\`\`\``,
            null,
            false
          );
        }
      });
    } else if (command === "--game --unbanwave") {
      await neutralEmbed(
        interaction,
        "Found 0 bans so far...",
        null,
        false,
        false,
        "<a:loading:1265392674446512232>"
      );

      const url = `https://apis.roblox.com/cloud/v2/universes/4570608156/user-restrictions:listLogs`;
      const logs = [];
      let next_page_token = undefined;

      async function getNextPage() {
        const response = await axios({
          url: url,
          method: "GET",
          params: {
            maxPageSize: 100,
            pageToken: next_page_token,
          },
          headers: {
            "x-api-key": process.env.BAN_API_KEY,
            "Content-Type": "application/json",
          },
        });

        const data = response.data;
        logs.push(...data.logs);

        await neutralEmbed(
          interaction,
          `Found ${logs.length} bans so far...`,
          null,
          false,
          false,
          "<a:loading:1265392674446512232>"
        );

        if (data.nextPageToken) {
          next_page_token = data.nextPageToken;
        } else {
          next_page_token = undefined;
        }
      }

      await getNextPage();

      if (logs.length === 0) {
        return errorEmbed(interaction, "No bans found!", null, false);
      }

      if (next_page_token) {
        while (next_page_token) {
          await getNextPage();
        }
      }

      await successEmbed(
        interaction,
        `Found ${logs.length} bans! Starting unban wave...\n\n**<a:loading:1265392674446512232> Unbanned 0/${logs.length} users.**`,
        null,
        false
      );

      let total_success = 0;
      let total_failed = 0;

      for (const log of logs) {
        const user = log.user;
        const user_id = Number(user.split("/")[1]);
        const success = await gameUnban(`MAIN_${user_id}`);

        if (success) {
          total_success++;
        } else {
          total_failed++;
        }

        await successEmbed(
          interaction,
          `Found ${
            logs.length
          } bans! Starting unban wave...\n\n**<a:loading:1265392674446512232> Unbanned ${total_success}/${
            logs.length
          } users.**${
            total_failed > 0
              ? `\n\n**<:tt_mp:1182425203679170600> Failed to unban ${total_failed} users.**`
              : ""
          }`,
          null,
          false
        );
      }

      await successEmbed(
        interaction,
        `Unban wave complete!\n\n**<:tt_ys:1187754951171125249> Unbanned ${total_success}/${
          logs.length
        } users.**${
          total_failed > 0
            ? `\n\n**<:tt_mp:1182425203679170600> Failed to unban ${total_failed} users.**`
            : ""
        }`,
        null,
        false
      );
    } else if (command === "--kill") {
      await neutralEmbed(
        interaction,
        "All internal services are being killed...",
        null,
        false
      );

      exec("pm2 stop Irity", (error, stdout, stderr) => {
        if (error) {
          errorEmbed(
            interaction,
            `Something went wrong: ${error.message}`,
            null,
            false
          );
        }

        if (stdout) {
          successEmbed(
            interaction,
            `\n## Success\n\`\`\`\n${stdout}\`\`\``,
            null,
            false
          );
        }
      });
    }
  },
};
