const databaseService = require('../../services/databaseService');

module.exports = async function (client) {
    const db = await databaseService.getDatabase("ArcadeHaven");
    const collection = db.collection("cash_logs");

    async function log() {
        try {
            const logs = await collection.find({ context: { $ne: "DataService-503" }, logged: { $exists: false } }).sort({ date: 1 }).limit(25).toArray();
            await collection.deleteMany({ context: "DataService-503" });

            if (logs.length === 0) return;

            const channel = await client.channels.cache.get("1251294803518291998");
            let message = ""

            for (const log of logs) {
                const username = log.player
                const date = log.date
                const amount = log.amount
                const context = log.context
                const prefix = `${amount > 80000000 ? "@everyone" : ""}`

                message += `${prefix} \`${username}\` **$${amount.toLocaleString()}** \`${context}\`  <t:${date}:R>\n`
            }

            await channel.send({
                content: message
            });
            
            await collection.updateMany({
                _id: { $in: logs.map(log => log._id) }
            }, {
                $set: { logged: true }
            });
        } catch (error) {
            console.error(error);
        }
    }


    log()
    setInterval(log, 5000);
}