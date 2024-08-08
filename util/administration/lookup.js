const {
  getIdFromUsername,
  getPlayerThumbnail,
  getUsernameFromId,
} = require("noblox.js");
const robloxService = require("../../services/robloxService");
const databaseService = require("../../services/databaseService");
const embeds = require("../../util/embed");
const {
  abbreviateNumber,
  calculateExpression,
  validateRoles,
  stringToDuration,
} = require("../functions");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const fs = require("fs");

async function createCase(data) {
  const database = await databaseService.getDatabase("ArcadeHaven");
  const collection = database.collection("ModerationCases");
  const caseId = (await collection.countDocuments()) + 1;
  const doc = {
    caseId,
    ...data,
  };

  console.log(doc);

  await collection.insertOne(doc);

  return caseId;
}

async function logAction(client, data, case_id) {
  let guild = client.guilds.cache.get("932320416989610065");

  if (!guild) {
    try {
      guild = await client.guilds.fetch("932320416989610065");
    } catch (error) {
      guild = null;
    }
  }

  const channel = guild.channels.cache.get("1118861387704320030");
  const message = channel.send(data);

  const database = await databaseService.getDatabase("ArcadeHaven");
  const collection = database.collection("ModerationCases");
  collection.updateOne({ caseId: case_id }, { $set: { message: data } }); // this is so when we run /admin case we can see the exact message
}

module.exports = {
  async execute(interaction, client) {
    const options = interaction.options;
    let username;
    let user_id;

    if (!options) {
      const db = await databaseService.getDatabase("DiscordServer");
      const collection = db.collection("RobloxServiceCache");
      const document = await collection.findOne({
        reference: interaction.message.interaction.id,
      });
      if (!document) return;

      user_id = document.value.data.UserIds[0];
      username = interaction.message.embeds[0].title.split(" ")[0].slice(0, -2);
    } else {
      await interaction.deferReply();
      username = options.getString("username");
      user_id = await getIdFromUsername(username);

      if (!user_id) return embeds.errorEmbed(interaction, "User not found.");
      username = await getUsernameFromId(user_id);
    }

    if (!user_id) return embeds.errorEmbed(interaction, "User not found.");

    let reference = options
      ? interaction.id
      : interaction.message.interaction.id;
    let thumbnail;

    try {
      thumbnail = (
        await getPlayerThumbnail(user_id, "180x180", "png", false, "headshot")
      )[0].imageUrl;
    } catch (error) {
      thumbnail = null;
    }

    robloxService
      .getDatastoreEntry(`MAIN_${user_id}`, reference)
      .then(async (data) => {
        let ban_status;

        try {
          ban_status = await robloxService.getBanStatus(`MAIN_${user_id}`);
        } catch (error) {
          ban_status = "error";
        }

        const user_data = data.data.Data;
        const meta_data = data.data.MetaData;
        const cash = Math.floor(user_data.Cash);
        const profit = Math.floor(user_data.Profit);
        const wagered = Math.floor(user_data.Wagered);

        const embed = new EmbedBuilder()
          .setTitle(`Lookup for ${username}`)
          .setThumbnail(thumbnail)
          .setDescription(
            `**Cash:** $${cash.toLocaleString()}\n**Profit:** $${abbreviateNumber(
              profit
            )}\n**Wagered:** $${abbreviateNumber(wagered)}`
          )
          .setColor("Blue")
          .setFooter({
            text: "Last updated",
          })
          .setTimestamp(new Date(meta_data.LastUpdate * 1000));

        let fields = [];
        for (const key in user_data.GameData) {
          const data = user_data.GameData[key];
          if (data.Played < 1) continue;

          fields.push({
            name: `${data.Profit > 0 ? "🟢" : "🔴"} ${key}`,
            value: `$${abbreviateNumber(
              data.Profit
            )} (${data.RoundsWon.toLocaleString()}/${data.Played.toLocaleString()})`,
            inline: true,
          });
        }

        if (fields.length > 0) {
          embed.addFields(...fields);
        }

        const action_row = new ActionRowBuilder();
        const components = [
          new ButtonBuilder()
            .setCustomId("administration/lookup/gameban")
            .setLabel("Ban")
            .setEmoji("<:banicon:1252425649923293204>")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("administration/lookup/transfer")
            .setLabel("Transfer")
            .setEmoji("<:wipe:1255634882453831680>")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("administration/lookup/edit")
            .setLabel("Edit Cash")
            .setEmoji("<:editdataicon:1252425167699837028>")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("administration/lookup/history")
            .setLabel("View History")
            .setEmoji("<:recentbets:1252425177975881728>")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("administration/lookup/getraw")
            .setLabel("Download")
            .setEmoji("<:getraw:1255636555674943589>")
            .setStyle(ButtonStyle.Secondary),
        ];

        if (meta_data.ActiveSession) {
          embed.setAuthor({
            name: "This user is currently in a server",
            iconURL:
              "https://cdn.discordapp.com/emojis/1249473596188004433.webp",
          });
        }

        if (ban_status && ban_status.active) {
          embed.setAuthor({
            name: "This user is banned from Arcade Haven",
            iconURL:
              "https://cdn.discordapp.com/emojis/1249473498062000209.webp",
          });

          components[0] = new ButtonBuilder()
            .setCustomId("administration/lookup/unban")
            .setLabel("Unban")
            .setEmoji("<:unban:1252630527731564666>")
            .setStyle(ButtonStyle.Success);

          if (
            ban_status.displayReason ==
            "You created or used an account to avoid an enforcement action taken against another account by the creator of this experience"
          ) {
            components[0].setDisabled(true);
            embed.setAuthor({
              name: "This user is an alternate account of a banned user",
              iconURL:
                "https://cdn.discordapp.com/emojis/1249473498062000209.webp",
            });
          }
        } else if (ban_status === "error") {
          embed.setAuthor({
            name: "I was unable to check the ban status of this user",
            iconURL:
              "https://cdn.discordapp.com/emojis/1182425203679170600.webp",
          });
        }

        const has_role = validateRoles(
          interaction.member,
          [
            "1069023487647301692",
            "1113868122311639050",
            "1180090434744229988",
            "1213276024020934666",
            "1249703065632641045",
          ],
          "one"
        );
        if (!has_role) {
          components[1].setDisabled(true);
          components[2].setDisabled(true);
        }

        console.log(components);
        action_row.addComponents(...components);

        if (!options) {
          interaction.update({
            embeds: [embed],
            components: [action_row],
          });
        } else {
          await interaction.editReply({
            embeds: [embed],
            components: [action_row],
          });
        }
      })
      .catch(async (error) => {
        let ban_status;

        try {
          ban_status = await robloxService.getBanStatus(`MAIN_${user_id}`);
        } catch (error) {
          ban_status = "error";
        }

        if (
          error.message === "404 NOT_FOUND Entry not found in the datastore."
        ) {
          const embed = new EmbedBuilder()
            .setTitle(`Lookup for ${username}`)
            .setDescription("This user has never played Arcade Haven before.")
            .setThumbnail(thumbnail)
            .setColor("Blue")
            .setFooter({
              text: "Last updated ",
            })
            .setTimestamp(new Date());

          const action_row = new ActionRowBuilder();
          const components = [
            new ButtonBuilder()
              .setCustomId("administration/lookup/gameban")
              .setLabel("Ban")
              .setEmoji("<:banicon:1252425649923293204>")
              .setStyle(ButtonStyle.Danger),
          ];

          if (ban_status && ban_status.active) {
            embed.setAuthor({
              name: "This user is banned from Arcade Haven",
              iconURL:
                "https://cdn.discordapp.com/emojis/1249473498062000209.webp",
            });

            components[0] = new ButtonBuilder()
              .setCustomId("administration/lookup/unban")
              .setLabel("Unban")
              .setEmoji("<:unban:1252630527731564666>")
              .setStyle(ButtonStyle.Success);

            if (ban_status.inherited) {
              components[0].setDisabled(true);
              embed.setAuthor({
                name: "This user is an alternate account of a banned user.",
                iconURL:
                  "https://cdn.discordapp.com/emojis/1249473498062000209.webp",
              });
            }
          } else if (ban_status === "error") {
            embed.setAuthor({
              name: "I was unable to check the ban status of this user.",
              iconURL:
                "https://cdn.discordapp.com/emojis/1182425203679170600.webp",
            });
          }

          console.log(components);
          action_row.addComponents(...components);
          return interaction.editReply({
            embeds: [embed],
            components: [action_row],
          });
        }

        console.error(error);
        return embeds.errorEmbed(
          interaction,
          "Something went wrong, please try again later."
        );
      });
  },

  async button(interaction, client) {
    const buttonId = interaction.customId;
    const database = await databaseService.getDatabase("DiscordServer");
    const collection = database.collection("RobloxServiceCache");
    const document = await collection.findOne({
      reference: interaction.message.interaction.id,
    });

    const handleHistoryNavigation = async (
      currentPage,
      direction,
      username
    ) => {
      const allBets = Object.entries(
        document.value.data.Data.Logs.Bets
      ).flatMap(([key, bets]) => bets.map((bet) => ({ mode: key, ...bet })));
      allBets.sort((a, b) => b.time - a.time);

      const betsPerPage = 10;
      const totalPages = Math.ceil(allBets.length / betsPerPage);
      currentPage += direction;

      let historyString = "";
      for (
        let i = (currentPage - 1) * betsPerPage;
        i < currentPage * betsPerPage;
        i++
      ) {
        if (i >= allBets.length) break;
        const bet = allBets[i];
        historyString += `**${i + 1}.** \`${bet.id}\` (${bet.mode} <t:${
          bet.time
        }:R>) ${
          bet.profit > 0
            ? "<:green_dot:1264285521476190300>"
            : "<:grey_dot:1264285450995105823>"
        }\n`;
      }

      if (historyString === "") {
        return interaction.reply({
          embeds: [
            await embeds.errorEmbed(
              interaction,
              "This page does not exist.",
              null,
              false,
              true
            ),
          ],
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`${username}'s Bet History`)
        .setDescription(historyString)
        .setColor("Blue")
        .setFooter({ text: `Page ${currentPage}/${totalPages}` });

      const components = [
        new ButtonBuilder()
          .setCustomId("administration/lookup/history/previous-far")
          .setEmoji("<:doubleleft:1252703391856197634>")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 1),
        new ButtonBuilder()
          .setCustomId("administration/lookup/history/previous")
          .setEmoji("<:singleleft:1252703411431014503>")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 1),
        new ButtonBuilder()
          .setCustomId("administration/lookup/history/next")
          .setEmoji("<:singleright:1252703372998611085>")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === totalPages),
        new ButtonBuilder()
          .setCustomId("administration/lookup/history/next-far")
          .setEmoji("<:doubleright:1252703345832104076>")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === totalPages),
        new ButtonBuilder()
          .setCustomId("administration/lookup/history/close")
          .setEmoji("<:close:1252438815189241897>")
          .setStyle(ButtonStyle.Danger),
      ];

      const actionRow = new ActionRowBuilder().addComponents(...components);
      await interaction.update({
        embeds: [embed],
        components: [actionRow],
      });
    };

    switch (buttonId) {
      case "administration/lookup/gameban":
        const username = interaction.message.embeds[0].title.split(" ")[2];
        const modal = new ModalBuilder()
          .setTitle(`Ban ${username}`)
          .setCustomId("administration/lookup/gameban")
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setLabel("Rule Violation")
                .setPlaceholder("Which rule number did they break?")
                .setCustomId("reason")
                .setRequired(true)
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setMaxLength(2)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setLabel("Duration")
                .setPlaceholder("Enter the duration of the ban")
                .setCustomId("duration")
                .setRequired(true)
                .setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setLabel("Proof")
                .setPlaceholder("Paste each link on a new line")
                .setCustomId("proof")
                .setRequired(true)
                .setStyle(TextInputStyle.Paragraph)
            )
          );

        interaction.showModal(modal);

        break;
      case "administration/lookup/edit":
        const editUsername = interaction.message.embeds[0].title.split(" ")[2];
        const editModal = new ModalBuilder()
          .setTitle(`Edit ${editUsername}`)
          .setCustomId("administration/lookup/edit")
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setLabel("Cash")
                .setPlaceholder("0")
                .setValue(`${document.value.data.Data.Cash}`)
                .setCustomId("cash")
                .setRequired(true)
                .setStyle(TextInputStyle.Short)
            )
          );

        interaction.showModal(editModal);
        break;
      case "administration/lookup/history":
        if (!document) {
          return interaction.reply({
            embeds: [
              await embeds.errorEmbed(
                interaction,
                "This interaction has expired.",
                null,
                false,
                true
              ),
            ],
            ephemeral: true,
          });
        }

        const lookupUsername =
          interaction.message.embeds[0].title.split(" ")[2];
        await handleHistoryNavigation(1, 0, lookupUsername);
        break;
      case "administration/lookup/history/previous":
        if (!document) {
          return interaction.reply({
            embeds: [
              await embeds.errorEmbed(
                interaction,
                "This interaction has expired.",
                null,
                false,
                true
              ),
            ],
            ephemeral: true,
          });
        }

        const prevPage = parseInt(
          interaction.message.embeds[0].footer.text.split(" ")[1].split("/")[0]
        );
        const prevUsername = interaction.message.embeds[0].title
          .split(" ")[0]
          .slice(0, -2);
        await handleHistoryNavigation(prevPage, -1, prevUsername);
        break;
      case "administration/lookup/history/previous-far":
        if (!document) {
          return interaction.reply({
            embeds: [
              await embeds.errorEmbed(
                interaction,
                "This interaction has expired.",
                null,
                false,
                true
              ),
            ],
            ephemeral: true,
          });
        }

        const farPrevPage = parseInt(
          interaction.message.embeds[0].footer.text.split(" ")[1].split("/")[0]
        );
        const prevTotalPages = parseInt(
          interaction.message.embeds[0].footer.text.split(" ")[1].split("/")[1]
        );
        const farPrevUsername = interaction.message.embeds[0].title
          .split(" ")[0]
          .slice(0, -2);
        await handleHistoryNavigation(
          farPrevPage,
          -farPrevPage + 1,
          farPrevUsername
        );
        break;
      case "administration/lookup/history/next":
        if (!document) {
          return interaction.reply({
            embeds: [
              await embeds.errorEmbed(
                interaction,
                "This interaction has expired.",
                null,
                false,
                true
              ),
            ],
            ephemeral: true,
          });
        }

        const nextPage = parseInt(
          interaction.message.embeds[0].footer.text.split(" ")[1].split("/")[0]
        );
        const nextUsername = interaction.message.embeds[0].title
          .split(" ")[0]
          .slice(0, -2);
        await handleHistoryNavigation(nextPage, 1, nextUsername);
        break;
      case "administration/lookup/history/next-far":
        if (!document) {
          return interaction.reply({
            embeds: [
              await embeds.errorEmbed(
                interaction,
                "This interaction has expired.",
                null,
                false,
                true
              ),
            ],
            ephemeral: true,
          });
        }

        const farNextPage = parseInt(
          interaction.message.embeds[0].footer.text.split(" ")[1].split("/")[0]
        );
        const farTotalPages = parseInt(
          interaction.message.embeds[0].footer.text.split(" ")[1].split("/")[1]
        );
        const farNextUsername = interaction.message.embeds[0].title
          .split(" ")[0]
          .slice(0, -2);
        await handleHistoryNavigation(
          farNextPage,
          farTotalPages - farNextPage,
          farNextUsername
        );
        break;
      case "administration/lookup/history/close":
        this.execute(interaction, client);
        break;
      case "administration/lookup/unban":
        const unbamUsername = interaction.message.embeds[0].title.split(" ")[2];
        const unbanModal = new ModalBuilder()
          .setTitle(`Unban ${unbamUsername}`)
          .setCustomId("administration/lookup/unban")
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setLabel("Why are you unbanning this user?")
                .setPlaceholder("Reason")
                .setCustomId("reason")
                .setRequired(true)
                .setStyle(TextInputStyle.Short)
            )
          );

        interaction.showModal(unbanModal);
        break;
      case "administration/lookup/getraw":
        try {
          await interaction.deferReply();

          const raw = JSON.stringify(document.value, null, 2);
          const doc_id = require("crypto").randomBytes(4).toString("hex");
          const path = `/var/www/irity-content/${doc_id}`;
          fs.writeFileSync(path, raw);

          interaction.editReply({
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setURL(`https://cdn.noxirity.com/${doc_id}`)
                  .setStyle(ButtonStyle.Link)
                  .setLabel("Download")
              ),
            ],
          });
        } catch (error) {
          console.error(error);
        }

        break;
      case "administration/lookup/transfer":
        const transferUsername =
          interaction.message.embeds[0].title.split(" ")[2];
        const transferModal = new ModalBuilder()
          .setTitle(`Transfer ${transferUsername}`)
          .setCustomId("administration/lookup/transfer")
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setLabel("Why are you transferring their inventory?")
                .setPlaceholder("Reason")
                .setCustomId("reason")
                .setRequired(true)
                .setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setLabel("Target Username")
                .setPlaceholder("Username")
                .setCustomId("target")
                .setRequired(true)
                .setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setLabel("Percent to Transfer")
                .setPlaceholder("0-100")
                .setCustomId("percent")
                .setRequired(true)
                .setStyle(TextInputStyle.Short)
            )
          );

        interaction.showModal(transferModal);
        break;
    }
  },

  async modal(interaction, client) {
    const customId = interaction.customId;
    const database = await databaseService.getDatabase("DiscordServer");
    const collection = database.collection("RobloxServiceCache");
    const document = await collection.findOne({
      reference: interaction.message.interaction.id,
    });

    switch (customId) {
      case "administration/lookup/gameban":
        const reason =
          interaction.fields.getTextInputValue("reason") ||
          "No reason provided";
        const proof =
          interaction.fields.getTextInputValue("proof") || "No proof provided";
        const duration =
          interaction.fields.getTextInputValue("duration") || "perm";
        const username = interaction.message.embeds[0].title.split(" ")[2];
        const ban_user_id = document.UserId;
        await interaction.deferReply({ ephemeral: true });

        if (isNaN(Number(reason))) {
          return embeds.errorEmbed(
            interaction,
            "Please provide a valid rule number."
          );
        }

        robloxService
          .gameBan(
            `MAIN_${ban_user_id}`,
            reason,
            duration,
            true,
            interaction.user.username
          )
          .then(async (success) => {
            if (!success) {
              return embeds.errorEmbed(
                interaction,
                "Something went wrong on Roblox's end, please try again later."
              );
            }

            const embed = EmbedBuilder.from(interaction.message.embeds[0]);
            embed.setAuthor({
              name: "This user is banned from Arcade Haven",
              iconURL:
                "https://cdn.discordapp.com/emojis/1249473498062000209.webp",
            });

            const action_row = new ActionRowBuilder();
            const components = [
              new ButtonBuilder()
                .setCustomId("administration/lookup/unban")
                .setLabel("Unban")
                .setEmoji("<:unban:1252630527731564666>")
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId("administration/lookup/transfer")
                .setLabel("Transfer")
                .setEmoji("<:wipe:1255634882453831680>")
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId("administration/lookup/edit")
                .setLabel("Edit Cash")
                .setEmoji("<:editdataicon:1252425167699837028>")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId("administration/lookup/history")
                .setLabel("View History")
                .setEmoji("<:recentbets:1252425177975881728>")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId("administration/lookup/getraw")
                .setLabel("Download")
                .setEmoji("<:getraw:1255636555674943589>")
                .setStyle(ButtonStyle.Secondary),
            ];

            const has_role = validateRoles(
              interaction.member,
              [
                "1069023487647301692",
                "1113868122311639050",
                "1180090434744229988",
                "1213276024020934666",
                "1249703065632641045",
              ],
              "one"
            );
            if (!has_role) {
              components[1].setDisabled(true);
              components[2].setDisabled(true);
            }

            if (document.value === null) {
              components.splice(1, 2);
            }

            action_row.addComponents(...components);
            interaction.message.edit({
              embeds: [embed],
              components: [action_row],
            });

            embeds.successEmbed(
              interaction,
              `Successfully banned ${username}.`
            );

            const case_id = await createCase({
              type: "Ban",
              target: ban_user_id,
              reason,
              moderator: interaction.user.id,
              proof,
              timestamp: Date.now(),
              duration: duration === "perm" ? -1 : stringToDuration(duration),
            });

            logAction(
              client,
              {
                embeds: [
                  new EmbedBuilder()
                    .addFields(
                      {
                        name: "Case",
                        value: `\`${case_id}\``,
                        inline: true,
                      },
                      {
                        name: "Type",
                        value: `\`Ban (${
                          duration === "perm" ? "∞" : duration
                        })\``,
                        inline: true,
                      },
                      {
                        name: "Moderator",
                        value: `\`${interaction.user.username}\``,
                        inline: true,
                      },
                      {
                        name: "Target",
                        value: `<:singleright:1252703372998611085> [\`@${username}\`](https://www.roblox.com/users/${ban_user_id}/profile)`,
                        inline: true,
                      },
                      {
                        name: "Rule Violation",
                        value: reason,
                        inline: true,
                      },
                      {
                        name: "Proof",
                        value: proof,
                      }
                    )
                    .setTimestamp(new Date())
                    .setThumbnail(embed.data.thumbnail.url)
                    .setColor("Red"),
                ],
              },
              case_id
            );
          })
          .catch((error) => {
            console.error(error);
            return embeds.errorEmbed(
              interaction,
              "Something went wrong, please try again later."
            );
          });

        break;
      case "administration/lookup/edit":
        const expression = interaction.fields.getTextInputValue("cash");
        const edit_user_id = document.UserId;
        const edit_username = interaction.message.embeds[0].title.split(" ")[2];
        await interaction.deferReply({ ephemeral: true });
        const new_amount = parseInt(await calculateExpression(expression));

        if (isNaN(new_amount)) {
          return embeds.errorEmbed(
            interaction,
            "I wasn't able to calculate the new cash amount."
          );
        }

        const current_cash = document.value.data.Data.Cash;

        robloxService
          .setCash(`MAIN_${edit_user_id}`, new_amount)
          .then(async (success) => {
            const embed = EmbedBuilder.from(interaction.message.embeds[0]);
            embed.setDescription(
              `**Cash:** $${new_amount.toLocaleString()}\n**Profit:** $${abbreviateNumber(
                document.value.data.Data.Profit
              )}\n**Wagered:** $${abbreviateNumber(
                document.value.data.Data.Wagered
              )}`
            );

            interaction.message.edit({
              embeds: [embed],
              components: interaction.message.components,
            });
            embeds.successEmbed(
              interaction,
              `Successfully updated ${edit_username}'s cash to $${new_amount.toLocaleString()}.`
            );

            const case_id = await createCase({
              type: "Cash-Edit",
              target: edit_user_id,
              reason: `**Old Cash:** $${current_cash.toLocaleString()}\n**New Cash:** $${new_amount.toLocaleString()}`,
              moderator: interaction.user.id,
              timestamp: Date.now(),
            });

            logAction(
              client,
              {
                embeds: [
                  new EmbedBuilder()
                    .addFields(
                      {
                        name: "Case",
                        value: `\`${case_id}\``,
                        inline: true,
                      },
                      {
                        name: "Type",
                        value: "`Cash Edit`",
                        inline: true,
                      },
                      {
                        name: "Moderator",
                        value: `\`${interaction.user.username}\``,
                        inline: true,
                      },
                      {
                        name: "Target",
                        value: `<:singleright:1252703372998611085> [\`@${edit_username}\`](https://www.roblox.com/users/${edit_user_id}/profile)`,
                      },
                      {
                        name: "Old Cash",
                        value: `$${current_cash.toLocaleString()}`,
                        inline: true,
                      },
                      {
                        name: "New Cash",
                        value: `$${new_amount.toLocaleString()}`,
                        inline: true,
                      }
                    )
                    .setTimestamp(new Date())
                    .setThumbnail(embed.data.thumbnail.url)
                    .setColor("Blue"),
                ],
              },
              case_id
            );
          })
          .catch((error) => {
            console.error(error);
            return embeds.errorEmbed(
              interaction,
              "Something went wrong, please try again later."
            );
          });
        break;
      case "administration/lookup/unban":
        const unban_reason =
          interaction.fields.getTextInputValue("reason") ||
          "No reason provided";
        const unban_user_id = document.UserId;
        const unban_username =
          interaction.message.embeds[0].title.split(" ")[2];
        await interaction.deferReply({ ephemeral: true });

        robloxService
          .gameUnban(
            `MAIN_${unban_user_id}`,
            unban_reason,
            interaction.user.username
          )
          .then(async (success) => {
            const embed = EmbedBuilder.from(interaction.message.embeds[0]);
            embed.setAuthor(null);

            const action_row = new ActionRowBuilder();
            const components = [
              new ButtonBuilder()
                .setCustomId("administration/lookup/gameban")
                .setLabel("Ban")
                .setEmoji("<:banicon:1252425649923293204>")
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId("administration/lookup/transfer")
                .setLabel("Transfer")
                .setEmoji("<:wipe:1255634882453831680>")
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId("administration/lookup/edit")
                .setLabel("Edit Cash")
                .setEmoji("<:editdataicon:1252425167699837028>")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId("administration/lookup/history")
                .setLabel("View History")
                .setEmoji("<:recentbets:1252425177975881728>")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId("administration/lookup/getraw")
                .setLabel("Download")
                .setEmoji("<:getraw:1255636555674943589>")
                .setStyle(ButtonStyle.Secondary),
            ];

            const has_role = validateRoles(
              interaction.member,
              [
                "1069023487647301692",
                "1113868122311639050",
                "1180090434744229988",
                "1213276024020934666",
                "1249703065632641045",
              ],
              "one"
            );
            if (!has_role) {
              components[1].setDisabled(true);
              components[2].setDisabled(true);
            }

            if (document.value === null) {
              components.splice(1, 2);
            }

            action_row.addComponents(...components);
            interaction.message.edit({
              embeds: [embed],
              components: [action_row],
            });
            embeds.successEmbed(
              interaction,
              `Successfully unbanned ${unban_username}.`
            );

            const case_id = await createCase({
              type: "Unban",
              target: unban_user_id,
              reason: unban_reason,
              moderator: interaction.user.id,
              timestamp: Date.now(),
            });

            logAction(
              client,
              {
                embeds: [
                  new EmbedBuilder()
                    .addFields(
                      {
                        name: "Case",
                        value: `\`${case_id}\``,
                        inline: true,
                      },
                      {
                        name: "Type",
                        value: "`Unban`",
                        inline: true,
                      },
                      {
                        name: "Moderator",
                        value: `\`${interaction.user.username}\``,
                        inline: true,
                      },
                      {
                        name: "Target",
                        value: `<:singleright:1252703372998611085> [\`@${unban_username}\`](https://www.roblox.com/users/${unban_user_id}/profile)`,
                      },
                      {
                        name: "Reason",
                        value: `${unban_reason}`,
                      }
                    )
                    .setTimestamp(new Date())
                    .setThumbnail(embed.data.thumbnail.url)
                    .setColor("Blue"),
                ],
              },
              case_id
            );
          })
          .catch((error) => {
            console.error(error);
            return embeds.errorEmbed(
              interaction,
              "Something went wrong, please try again later."
            );
          });
        break;
      case "administration/lookup/transfer":
        const transfer_reason =
          interaction.fields.getTextInputValue("reason") ||
          "No reason provided";
        const transfer_target = interaction.fields.getTextInputValue("target");
        const transfer_percent = Number(
          interaction.fields.getTextInputValue("percent")
        );
        const target_id = await getIdFromUsername(transfer_target);

        if (!target_id) {
          return embeds.errorEmbed(interaction, "Target user not found.");
        }

        if (isNaN(transfer_percent)) {
          return embeds.errorEmbed(
            interaction,
            "Please provide a valid percentage from 0-100."
          );
        }

        if (transfer_percent < 0 || transfer_percent > 100) {
          return embeds.errorEmbed(
            interaction,
            "Please provide a valid percentage from 0-100."
          );
        }

        const database = await databaseService.getDatabase("ArcadeHaven");
        const items_collection = database.collection("items");

        const docs = await items_collection
          .find(
            { "serials.u": Number(document.UserId) },
            {
              projection: {
                "serials.u": 1,
                "serials._id": 1,
                itemId: 1,
                value: 1,
                rap: 1,
              },
            }
          )
          .toArray();

        let new_inventory = {};
        let total_item_value = 0;
        docs.forEach(function (item) {
          const serials = item.serials;
          serials.forEach(function (serial_info, serial) {
            if (!serial_info) return;
            const owner_id = serial_info.u;
            if (owner_id === Number(document.UserId)) {
              if (!new_inventory[String(item.itemId)]) {
                new_inventory[String(item.itemId)] = [];
              }

              total_item_value += item.value || item.rap;
              new_inventory[String(item.itemId)].push(String(serial + 1));
            }
          });
        });

        let items_to_transfer = [];
        let total_value = 0;
        const target_value = Math.floor(
          total_item_value * (transfer_percent / 100)
        );
        const max_allowed_value = target_value * 1.1; // 10% buffer

        if (transfer_percent !== 100) {
          while (total_value < target_value) {
            const randomItem =
              Object.keys(new_inventory)[
                Math.floor(Math.random() * Object.keys(new_inventory).length)
              ];
            const randomSerial =
              new_inventory[randomItem][
                Math.floor(Math.random() * new_inventory[randomItem].length)
              ];
            const item = docs.find(
              (item) => item.itemId === parseInt(randomItem)
            );

            if (!item) continue;

            const potentialValue = total_value + (item.value || item.rap || 0);
            if (potentialValue > max_allowed_value) continue;

            items_to_transfer.push(`${randomItem}-${randomSerial}`);
            total_value = potentialValue;
          }
        } else {
          items_to_transfer = Object.keys(new_inventory).map((itemId) => {
            return new_inventory[itemId].map((serial) => `${itemId}-${serial}`);
          });
          items_to_transfer = items_to_transfer.flat();
          total_value = total_item_value;
        }

        let update_promises = items_to_transfer.map((item) => {
          const [itemId, serial] = item.split("-");
          if (!itemId || !serial) {
            return Promise.reject(new Error("Invalid item format"));
          }
          return items_collection.updateOne(
            { itemId: parseInt(itemId) },
            {
              $set: {
                [`serials.${parseInt(serial) - 1}.u`]: target_id,
                [`serials.${parseInt(serial) - 1}.t`]: Math.floor(
                  Date.now() / 1000
                ),
              },
            }
          );
        });

        console.log(items_to_transfer);

        Promise.all(update_promises)
          .then(() => {
            embeds.successEmbed(
              interaction,
              `Successfully transferred items to ${transfer_target}.`,
              null,
              true
            );
          })
          .catch((error) => {
            console.error(error);
            return embeds.errorEmbed(
              interaction,
              "Something went wrong, please try again later.",
              null,
              true
            );
          });

        const case_id = await createCase({
          type: "Transfer",
          target: document.UserId,
          receiver: target_id,
          reason: transfer_reason,
          moderator: interaction.user.id,
          timestamp: Date.now(),
        });

        logAction(
          client,
          {
            embeds: [
              new EmbedBuilder()
                .addFields(
                  {
                    name: "Case",
                    value: `\`${case_id}\``,
                    inline: true,
                  },
                  {
                    name: "Type",
                    value: "`Transfer`",
                    inline: true,
                  },
                  {
                    name: "Moderator",
                    value: `\`${interaction.user.username}\``,
                    inline: true,
                  },
                  {
                    name: "Target",
                    value: `<:singleright:1252703372998611085> [\`@${
                      interaction.message.embeds[0].title.split(" ")[2]
                    }\`](https://www.roblox.com/users/${
                      document.UserId
                    }/profile)`,
                  },
                  {
                    name: "Receiver",
                    value: `<:singleright:1252703372998611085> [\`@${transfer_target}\`](https://www.roblox.com/users/${target_id}/profile)`,
                  },
                  {
                    name: "Reason",
                    value: transfer_reason,
                  }
                )
                .setTimestamp(new Date())
                .setThumbnail(interaction.message.embeds[0].thumbnail.url)
                .setColor("Blue"),
            ],
          },
          case_id
        );

        break;
      default:
        break;
    }
  },
};
