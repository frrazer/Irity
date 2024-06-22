const calculateLevel = require("../calculateLevel");
const databaseService = require("../../services/databaseService");

async function level(message) {
    const isDevMode = process.argv.includes('dev');
    if (isDevMode && !["406163086978842625", "1092037151119654913"].includes(message.author.id)) return;

    const authorId = message.author.id;
    const CHANNEL_ID = "1057661334185054338";

    const levelRoles = [
        { level: 5, role: "1249484824406659214" },
        { level: 10, role: "1249484815195967559" },
        { level: 25, role: "1210321267257909339" },
        { level: 50, role: "1210321263763923005" },
        { level: 75, role: "1210321260765253652" },
        { level: 100, role: "1210321251453636638" },
    ];

    try {
        const database = await databaseService.getDatabase("DiscordServer");
        const collection = database.collection("CasinoEmpireLevelling");
        let document = await collection.findOne({ user_id: authorId });

        if (!document) {
            document = {
                user_id: authorId,
                tracking: {
                    messages: 1,
                    xp: 0,
                    last_message: Date.now(),
                },
                settings: {
                    level_up_notification: true,
                },
                cacheing: {
                    last_updated: Date.now(),
                    username: message.author.username,
                }
            };
            await collection.insertOne(document);
        }

        const { tracking } = document;
        const { messages, xp, last_message } = tracking;
        let xpToAdd = Math.floor(15 + Math.random() * 11);

        const xp_multiplier_expire = 1718578800
        const xp_multiplier = 2.5

        if (Date.now() / 1000 > xp_multiplier_expire) {
            xpToAdd *= xp_multiplier;
        }

        const newXp = xp + xpToAdd;
        const newMessages = messages + 1;

        if (last_message + 60000 > Date.now()) return;
        await collection.updateOne({ user_id: authorId }, {
            $set: {
                "tracking.messages": newMessages,
                "tracking.xp": newXp,
                "tracking.last_message": Date.now(),
                "cacheing.last_updated": Date.now(),
                "cacheing.username": message.author.username,
            }
        });

        const currentLevel = calculateLevel(xp).currentLevel;
        const newLevel = calculateLevel(newXp).currentLevel;

        if (newLevel > currentLevel) {
            const notifyChannel = await client.channels.fetch(CHANNEL_ID);
            let messageContent = `Congratulations, {{user}}! You have officially reached level **${newLevel}**! 🎉`;

            const member = await notifyChannel.guild.members.fetch(authorId);
            let highestRole = null;
            let roleUpdated = false;

            for (const levelRole of levelRoles) {
                if (newLevel >= levelRole.level) {
                    highestRole = levelRole;
                }
            }

            if (highestRole) {
                const rolesToRemove = levelRoles.filter(role => role.level < highestRole.level && member.roles.cache.has(role.role));
                for (const role of rolesToRemove) {
                    await member.roles.remove(role.role);
                    roleUpdated = true;
                }

                if (!member.roles.cache.has(highestRole.role)) {
                    await member.roles.add(highestRole.role);
                    roleUpdated = true;
                }
            }

            if (roleUpdated && document.settings.level_up_notification || newLevel === 1) {
                messageContent += "\n\n> If you do not wish to be pinged for level ups, you can disable this notification by using the **/settings level-up-notification** command.";
            }

            messageContent = document.settings.level_up_notification ? messageContent.replace("{{user}}", `<@${authorId}>`) : messageContent.replace("{{user}}", member.user.username);

            notifyChannel.send({ content: messageContent });
        }
    } catch (error) {
        console.error('Error handling regular message:', error);
    }
}

module.exports = level;