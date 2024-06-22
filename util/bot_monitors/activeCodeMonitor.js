const databaseService = require('../../services/databaseService');

module.exports = async function (client) {
    const db = await databaseService.getDatabase("ArcadeHaven");
    const collection = db.collection("codes");

    const guild = await client.guilds.fetch("932320416989610065")
    const channel = await guild.channels.fetch("1089320905395667045")
    const message = await channel.messages.fetch("1253844862797742260")

    async function verify_active_codes() {
        try {
            const codes = await collection.find({ src: { $exists: false }, script: { $ne: "" } }).toArray();
            let active_codes = []
            for (let code of codes) {
                const expiration = code.expiration;
                const max_uses = code.max_uses;
                const uses = code.uses;

                if (
                    !((max_uses !== 0 && uses >= max_uses) ||
                        (expiration !== 0 && expiration < Date.now()))
                ) {
                    active_codes.push(code);
                }
            }

            let content = `## <:tt_ys:1187754951171125249> Active Codes\n\n`
            for (let code of active_codes) {
                if (code.expiration) {
                    content += `**${code.code}** - Expires <t:${Math.floor(code.expiration / 1000)}:R>\n`
                } else if (code.max_uses) {
                    content += `**${code.code}** - ${code.uses || 0}/${code.max_uses} uses\n`
                }
            }

            if (message.content !== content) {
                message.edit(content)
            }
        } catch (error) {
            console.error(error);
        }
    }

    verify_active_codes()
    setInterval(verify_active_codes, 8000);
}