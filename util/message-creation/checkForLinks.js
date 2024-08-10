async function checkMessageForLinks(message) {
    const levelRoles = [
        { level: 5, role: "1249484824406659214" },
        { level: 10, role: "1249484815195967559" },
        { level: 25, role: "1210321267257909339" },
        { level: 50, role: "1210321263763923005" },
        { level: 75, role: "1210321260765253652" },
        { level: 100, role: "1210321251453636638" },
    ];

    const whitelist = [
        "https://discord.com/channels/",
        "https://ptb.discord.com/channels/",
        "https://canary.discord.com/channels/",
        "https://discordapp.com/channels/",
        "https://www.roblox.com/groups/16592351/Casino-Empire",
        "https://www.roblox.com/games/13081529792/NEW-Arcade-Haven",
        "https://discord.gift/",
        "https://x.com/casinoempires",
    ];

    const ignoredCategories = ["1182029577736945734", "1182029534044884992", "1182029509239787590", "1182029466952806501", "1057312553358868531"];
    const ignoredRoles = ["1182048570216546395", "932538393622085652"];
    const ignoredMembers = ["573950888721514523", "733707800345051216"];
    const ignoredChannels = ["1271574559312838676"]
    const linkRegex = /(https?:\/\/[^\s]+)/g;

    const member = message.member;
    const userRoles = member.roles.cache.map(role => role.id);
    const messageCategory = message.channel.parentId;

    if (ignoredCategories.includes(messageCategory)) {
        return;
    }

    if (ignoredRoles.some(role => userRoles.includes(role))) {
        return;
    }

    if (ignoredMembers.includes(message.author.id)) {
        return;
    }

    if (ignoredChannels.includes(message.channel.id)) {
        return;
    }

    let userLevel = 0;
    for (const { level, role } of levelRoles) {
        if (userRoles.includes(role)) {
            userLevel = level;
        }
    }

    const links = message.content.match(linkRegex);
    if (links) {
        const isWhitelisted = links.every(link =>
            whitelist.some(whitelistedLink => link.startsWith(whitelistedLink))
        );

        if (isWhitelisted) return;

        let notificationMessage

        if (userLevel < 10 && linkRegex.test(message.content)) {
            await message.delete();
            notificationMessage = await message.channel.send(`<:tt_er:1187754755435548742> ${message.author} | You need to be at least level 10 to post links in this server.`);
        } else if (userLevel === 10 && linkRegex.test(message.content) && message.channel.id !== "1088174756676784160") {
            await message.delete();
            notificationMessage = await message.channel.send(`<:tt_er:1187754755435548742> ${message.author} | You need to be at least level 25 to post links in this channel. Please use <#1088174756676784160> instead.`);
        }

        if (notificationMessage) {
            setTimeout(() => notificationMessage.delete(), 5000);
        }
    }
}

module.exports = checkMessageForLinks;