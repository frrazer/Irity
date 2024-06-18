const { getIdFromUsername, getPlayerThumbnail, getUsernameFromId } = require("noblox.js")
const robloxService = require("../../services/robloxService")
const databaseService = require("../../services/databaseService")
const embeds = require("../../util/embed")
const { abbreviateNumber, calculateExpression } = require("../functions")
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")

async function createCase(data) {
    const database = await databaseService.getDatabase("ArcadeHaven")
    const collection = database.collection("ModerationCases")
    const caseId = await collection.countDocuments() + 1
    const doc = {
        caseId,
        ...data
    }

    console.log(doc)

    await collection.insertOne(doc)

    return caseId
}

async function logAction(client, data) {
    let guild = client.guilds.cache.get("932320416989610065")

    if (!guild) {
        try {
            guild = await client.guilds.fetch("932320416989610065")
        } catch (error) {
            guild = null
        }
    }

    const channel = guild.channels.cache.get("1118861387704320030")
    channel.send(data)
}

module.exports = {
    async execute(interaction, client) {
        const options = interaction.options
        let username
        let user_id

        if (!options) {
            const db = await databaseService.getDatabase("DiscordServer")
            const collection = db.collection("RobloxServiceCache")
            const document = await collection.findOne({ reference: interaction.message.interaction.id })
            if (!document) return

            user_id = document.value.data.UserIds[0]
            username = interaction.message.embeds[0].title.split(" ")[0].slice(0, -2);
        } else {
            await interaction.deferReply()
            username = options.getString("username")
            user_id = await getIdFromUsername(username)

            if (!user_id) return embeds.errorEmbed(interaction, "User not found.")
            username = await getUsernameFromId(user_id)
        }

        if (!user_id) return embeds.errorEmbed(interaction, "User not found.")

        let reference = options ? interaction.id : interaction.message.interaction.id
        robloxService.getDatastoreEntry(`MAIN_${user_id}`, reference).then(async (data) => {
            const user_data = data.data.Data
            const meta_data = data.data.MetaData
            const cash = Math.floor(user_data.Cash)
            const profit = Math.floor(user_data.Profit)
            const wagered = Math.floor(user_data.Wagered)
            let thumbnail

            try {
                thumbnail = (await getPlayerThumbnail(user_id, "180x180", "png", false, "headshot"))[0].imageUrl
            } catch (error) {
                thumbnail = null
            }

            const embed = new EmbedBuilder()
                .setTitle(`Lookup for ${username}`)
                .setThumbnail(thumbnail)
                .setDescription(`**Cash:** $${cash.toLocaleString()}\n**Profit:** $${abbreviateNumber(profit)}\n**Wagered:** $${abbreviateNumber(wagered)}`)
                .setColor("Blue")
                .setFooter({
                    text: "Last updated",
                })
                .setTimestamp(new Date(meta_data.LastUpdate * 1000))

            let fields = []
            for (const key in user_data.GameData) {
                const data = user_data.GameData[key]
                if (data.Played < 1) continue;

                fields.push({
                    name: `${data.Profit > 0 ? "🟢" : "🔴"} ${key}`,
                    value: `$${abbreviateNumber(data.Profit)} (${data.RoundsWon.toLocaleString()}/${data.Played.toLocaleString()})`,
                    inline: true
                })
            }

            if (fields.length > 0) {
                embed.addFields(...fields)
            }

            const action_row = new ActionRowBuilder()
            const components = [
                new ButtonBuilder()
                    .setCustomId("administration/lookup/gameban")
                    .setLabel("Ban")
                    .setEmoji("<:banicon:1252425649923293204>")
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
                    .setStyle(ButtonStyle.Secondary)
            ]

            if (meta_data.ActiveSession) {
                embed.setAuthor({
                    name: "This user is currently in a server",
                    iconURL: "https://cdn.discordapp.com/emojis/1249473596188004433.webp"
                })
            }

            if (user_data.Moderation.BanData2.Banned) {
                embed.setAuthor({
                    name: "This user is banned from Arcade Haven",
                    iconURL: "https://cdn.discordapp.com/emojis/1249473498062000209.webp"
                })

                components[0] = new ButtonBuilder()
                    .setCustomId("administration/lookup/unban")
                    .setLabel("Unban")
                    .setEmoji("<:unban:1252630527731564666>")
                    .setStyle(ButtonStyle.Success)
            }

            const admin_roles = ["1069023487647301692", "1113868122311639050", "1180090434744229988", "1213276024020934666", "1249703065632641045"]
            if (!interaction.member.roles.cache.some(role => admin_roles.includes(role.id))) {
                components[1].setDisabled(true)
            }

            action_row.addComponents(...components)

            if (!options) {
                interaction.update({ embeds: [embed], components: [action_row] })
            } else {
                await interaction.editReply({ embeds: [embed], components: [action_row] })
            }
        }).catch((error) => {
            console.error(error)
            let errorMessage
            if (error.message === "404 NOT_FOUND Entry not found in the datastore.") {
                errorMessage = "The provided user does not have any data on record."
            }

            return embeds.errorEmbed(interaction, errorMessage || "Something went wrong, please try again later.")
        })
    },

    async button(interaction, client) {
        const buttonId = interaction.customId;
        const database = await databaseService.getDatabase("DiscordServer");
        const collection = database.collection("RobloxServiceCache");
        const document = await collection.findOne({ reference: interaction.message.interaction.id });

        if (!document) {
            return interaction.reply({
                embeds: [await embeds.errorEmbed(interaction, "This interaction has expired.", null, false, true)],
                ephemeral: true
            });
        }

        const handleHistoryNavigation = async (currentPage, direction, username) => {
            const allBets = Object.entries(document.value.data.Data.Logs.Bets).flatMap(([key, bets]) => bets.map(bet => ({ mode: key, ...bet })));
            allBets.sort((a, b) => b.time - a.time);

            const betsPerPage = 10;
            const totalPages = Math.ceil(allBets.length / betsPerPage);
            currentPage += direction;

            let historyString = "";
            for (let i = (currentPage - 1) * betsPerPage; i < currentPage * betsPerPage; i++) {
                if (i >= allBets.length) break;
                const bet = allBets[i];
                historyString += `**${i + 1}.** \`${bet.id}\` (${bet.mode} <t:${bet.time}:R>)\n`;
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
                    .setStyle(ButtonStyle.Danger)
            ];

            const actionRow = new ActionRowBuilder().addComponents(...components);
            await interaction.update({ embeds: [embed], components: [actionRow] });
        }

        switch (buttonId) {
            case "administration/lookup/gameban":
                const username = interaction.message.embeds[0].title.split(" ")[2]
                const modal = new ModalBuilder()
                    .setTitle(`Ban ${username}`)
                    .setCustomId("administration/lookup/gameban")
                    .addComponents(
                        new ActionRowBuilder()
                            .addComponents(
                                new TextInputBuilder()
                                    .setLabel("Reason")
                                    .setPlaceholder("Enter a reason for the ban")
                                    .setCustomId("reason")
                                    .setRequired(true)
                                    .setStyle(TextInputStyle.Short)
                            ),
                        new ActionRowBuilder()
                            .addComponents(
                                new TextInputBuilder()
                                    .setLabel("Duration")
                                    .setPlaceholder("Enter the duration of the ban")
                                    .setCustomId("duration")
                                    .setRequired(true)
                                    .setStyle(TextInputStyle.Short)
                            ),
                        new ActionRowBuilder()
                            .addComponents(
                                new TextInputBuilder()
                                    .setLabel("Proof")
                                    .setPlaceholder("Paste each link on a new line")
                                    .setCustomId("proof")
                                    .setRequired(true)
                                    .setStyle(TextInputStyle.Paragraph)
                            )
                    )

                interaction.showModal(modal);

                break;
            case "administration/lookup/edit":
                const editUsername = interaction.message.embeds[0].title.split(" ")[2]
                const editModal = new ModalBuilder()
                    .setTitle(`Edit ${editUsername}`)
                    .setCustomId("administration/lookup/edit")
                    .addComponents(
                        new ActionRowBuilder()
                            .addComponents(
                                new TextInputBuilder()
                                    .setLabel("Cash")
                                    .setPlaceholder("0")
                                    .setValue(`${document.value.data.Data.Cash}`)
                                    .setCustomId("cash")
                                    .setRequired(true)
                                    .setStyle(TextInputStyle.Short)
                            ),
                    )

                interaction.showModal(editModal);
                break;
            case "administration/lookup/history":
                const lookupUsername = interaction.message.embeds[0].title.split(" ")[2];
                await handleHistoryNavigation(1, 0, lookupUsername);
                break;
            case "administration/lookup/history/previous":
                const prevPage = parseInt(interaction.message.embeds[0].footer.text.split(" ")[1].split("/")[0]);
                const prevUsername = interaction.message.embeds[0].title.split(" ")[0].slice(0, -2);
                await handleHistoryNavigation(prevPage, -1, prevUsername);
                break;
            case "administration/lookup/history/previous-far":
                const farPrevPage = parseInt(interaction.message.embeds[0].footer.text.split(" ")[1].split("/")[0]);
                const prevTotalPages = parseInt(interaction.message.embeds[0].footer.text.split(" ")[1].split("/")[1]);
                const farPrevUsername = interaction.message.embeds[0].title.split(" ")[0].slice(0, -2);
                await handleHistoryNavigation(farPrevPage, -(farPrevPage) + 1, farPrevUsername);
                break;
            case "administration/lookup/history/next":
                const nextPage = parseInt(interaction.message.embeds[0].footer.text.split(" ")[1].split("/")[0]);
                const nextUsername = interaction.message.embeds[0].title.split(" ")[0].slice(0, -2);
                await handleHistoryNavigation(nextPage, 1, nextUsername);
                break;
            case "administration/lookup/history/next-far":
                const farNextPage = parseInt(interaction.message.embeds[0].footer.text.split(" ")[1].split("/")[0]);
                const farTotalPages = parseInt(interaction.message.embeds[0].footer.text.split(" ")[1].split("/")[1]);
                const farNextUsername = interaction.message.embeds[0].title.split(" ")[0].slice(0, -2);
                await handleHistoryNavigation(farNextPage, farTotalPages - farNextPage, farNextUsername);
                break;
            case "administration/lookup/history/close":
                this.execute(interaction, client);
                break;
            case "administration/lookup/unban":
                const unbamUsername = interaction.message.embeds[0].title.split(" ")[2]
                const unbanModal = new ModalBuilder()
                    .setTitle(`Unban ${unbamUsername}`)
                    .setCustomId("administration/lookup/unban")
                    .addComponents(
                        new ActionRowBuilder()
                            .addComponents(
                                new TextInputBuilder()
                                    .setLabel("Why are you unbanning this user?")
                                    .setPlaceholder("Reason")
                                    .setCustomId("reason")
                                    .setRequired(true)
                                    .setStyle(TextInputStyle.Short)
                            ),
                    )

                interaction.showModal(unbanModal);
                break;
        }
    },

    async modal(interaction, client) {
        const customId = interaction.customId;
        const database = await databaseService.getDatabase("DiscordServer");
        const collection = database.collection("RobloxServiceCache");
        const document = await collection.findOne({ reference: interaction.message.interaction.id });

        if (!document) {
            return interaction.reply({
                embeds: [await embeds.errorEmbed(interaction, "This interaction has expired.", null, false, true)],
                ephemeral: true
            });
        }

        switch (customId) {
            case "administration/lookup/gameban":
                const reason = interaction.fields.getTextInputValue("reason") || "No reason provided";
                const proof = interaction.fields.getTextInputValue("proof") || "No proof provided";
                const duration = interaction.fields.getTextInputValue("duration") || "perm"
                const username = interaction.message.embeds[0].title.split(" ")[2]
                const ban_user_id = document.value.data.UserIds[0]
                await interaction.deferReply({ ephemeral: true });

                robloxService.gameBan(`MAIN_${ban_user_id}`, reason, duration, interaction.user.username).then(async (success) => {
                    const embed = EmbedBuilder.from(interaction.message.embeds[0])
                    embed.setAuthor({
                        name: "This user is banned from Arcade Haven",
                        iconURL: "https://cdn.discordapp.com/emojis/1249473498062000209.webp"
                    })

                    const action_row = new ActionRowBuilder()
                    const components = [
                        new ButtonBuilder()
                            .setCustomId("administration/lookup/unban")
                            .setLabel("Unban")
                            .setEmoji("<:unban:1252630527731564666>")
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId("administration/lookup/edit")
                            .setLabel("Edit Cash")
                            .setEmoji("<:editdataicon:1252425167699837028>")
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId("administration/lookup/history")
                            .setLabel("View History")
                            .setEmoji("<:recentbets:1252425177975881728>")
                            .setStyle(ButtonStyle.Secondary)
                    ]

                    const admin_roles = ["1069023487647301692", "1113868122311639050", "1180090434744229988", "1213276024020934666", "1249703065632641045"]
                    if (!interaction.member.roles.cache.some(role => admin_roles.includes(role.id))) {
                        components[1].setDisabled(true)
                    }

                    action_row.addComponents(...components)
                    interaction.message.edit({ embeds: [embed], components: [action_row] })

                    embeds.successEmbed(interaction, `Successfully banned ${username}.`)

                    const case_id = await createCase({
                        type: "Ban",
                        target: ban_user_id,
                        reason: reason,
                        moderator: interaction.user.id,
                        timestamp: Date.now(),
                    })

                    logAction(client, {
                        embeds: [
                            new EmbedBuilder()
                                .addFields(
                                    {
                                        name: "Case",
                                        value: `\`${case_id}\``,
                                        inline: true
                                    },
                                    {
                                        name: "Type",
                                        value: "`Ban`",
                                        inline: true
                                    },
                                    {
                                        name: "Moderator",
                                        value: `\`${interaction.user.username}\``,
                                        inline: true
                                    },
                                    {
                                        name: "Target",
                                        value: `<:singleright:1252703372998611085> [\`@${username}\`](https://www.roblox.com/users/${ban_user_id}/profile)`,
                                    },
                                    {
                                        name: "Reason",
                                        value: reason
                                    }
                                )
                                .setTimestamp(new Date())
                                .setThumbnail(embed.data.thumbnail.url)
                                .setColor("Red")
                        ]
                    })
                }).catch((error) => {
                    console.error(error)
                    return embeds.errorEmbed(interaction, "Something went wrong, please try again later.")
                })

                break
            case "administration/lookup/edit":
                const expression = interaction.fields.getTextInputValue("cash")
                const edit_user_id = document.value.data.UserIds[0]
                const edit_username = interaction.message.embeds[0].title.split(" ")[2]
                await interaction.deferReply({ ephemeral: true });
                const new_amount = parseInt(await calculateExpression(expression))

                if (isNaN(new_amount)) {
                    return embeds.errorEmbed(interaction, "I wasn't able to calculate the new cash amount.")
                }

                robloxService.setCash(`MAIN_${edit_user_id}`, new_amount).then(async (success) => {
                    const embed = EmbedBuilder.from(interaction.message.embeds[0])
                    embed.setDescription(`**Cash:** $${new_amount.toLocaleString()}\n**Profit:** $${abbreviateNumber(document.value.data.Data.Profit)}\n**Wagered:** $${abbreviateNumber(document.value.data.Data.Wagered)}`)

                    interaction.message.edit({ embeds: [embed], components: interaction.message.components })
                    embeds.successEmbed(interaction, `Successfully updated ${edit_username}'s cash to $${new_amount.toLocaleString()}.`)

                    const case_id = await createCase({
                        type: "Cash-Edit",
                        target: edit_user_id,
                        reason: `Changed cash to $${new_amount.toLocaleString()}`,
                        moderator: interaction.user.id,
                        timestamp: Date.now(),
                    })

                    logAction(client, {
                        embeds: [
                            new EmbedBuilder()
                                .addFields(
                                    {
                                        name: "Case",
                                        value: `\`${case_id}\``,
                                        inline: true
                                    },
                                    {
                                        name: "Type",
                                        value: "`Cash Edit`",
                                        inline: true
                                    },
                                    {
                                        name: "Moderator",
                                        value: `\`${interaction.user.username}\``,
                                        inline: true
                                    },
                                    {
                                        name: "Target",
                                        value: `<:singleright:1252703372998611085> [\`@${edit_username}\`](https://www.roblox.com/users/${edit_user_id}/profile)`,
                                    },
                                    {
                                        name: "Reason",
                                        value: `Changed cash to $${new_amount.toLocaleString()}`,
                                    }
                                )
                                .setTimestamp(new Date())
                                .setThumbnail(embed.data.thumbnail.url)
                                .setColor("Blue")
                        ]
                    })
                }).catch((error) => {
                    console.error(error)
                    return embeds.errorEmbed(interaction, "Something went wrong, please try again later.")
                })
                break
            case "administration/lookup/unban":
                const unban_reason = interaction.fields.getTextInputValue("reason") || "No reason provided";
                const unban_user_id = document.value.data.UserIds[0]
                const unban_username = interaction.message.embeds[0].title.split(" ")[2]
                await interaction.deferReply({ ephemeral: true });

                robloxService.gameUnban(`MAIN_${unban_user_id}`, unban_reason, interaction.user.username).then(async (success) => {
                    const embed = EmbedBuilder.from(interaction.message.embeds[0])
                    embed.setAuthor(null)

                    const action_row = new ActionRowBuilder()
                    const components = [
                        new ButtonBuilder()
                            .setCustomId("administration/lookup/gameban")
                            .setLabel("Ban")
                            .setEmoji("<:banicon:1252425649923293204>")
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
                            .setStyle(ButtonStyle.Secondary)
                    ]

                    const admin_roles = ["1069023487647301692", "1113868122311639050", "1180090434744229988", "1213276024020934666", "1249703065632641045"]
                    if (!interaction.member.roles.cache.some(role => admin_roles.includes(role.id))) {
                        components[1].setDisabled(true)
                    }

                    action_row.addComponents(...components)
                    interaction.message.edit({ embeds: [embed], components: [action_row] })
                    embeds.successEmbed(interaction, `Successfully unbanned ${unban_username}.`)

                    const case_id = await createCase({
                        type: "Unban",
                        target: unban_user_id,
                        reason: unban_reason,
                        moderator: interaction.user.id,
                        timestamp: Date.now(),
                    })

                    logAction(client, {
                        embeds: [
                            new EmbedBuilder()
                                .addFields(
                                    {
                                        name: "Case",
                                        value: `\`${case_id}\``,
                                        inline: true
                                    },
                                    {
                                        name: "Type",
                                        value: "\`Unban\`",
                                        inline: true
                                    },
                                    {
                                        name: "Moderator",
                                        value: `\`${interaction.user.username}\``,
                                        inline: true
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
                                .setColor("Blue")
                        ]
                    })
                }).catch((error) => {
                    console.error(error)
                    return embeds.errorEmbed(interaction, "Something went wrong, please try again later.")
                })
                break
            default:
                break
        }
    }
}