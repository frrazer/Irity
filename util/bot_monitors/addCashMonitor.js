const databaseService = require('../../services/databaseService');

module.exports = async function (client) {
    // fetch the 50 oldest logs from the database
    // send them in channel in the same message to avoid spamming the channel
    // delete the logs from the database
    // repeat every 20 seconds

    const db = await databaseService.getDatabase("ArcadeHaven");
    const collection = db.collection("cash_logs");

    async function log() {
        const logs = await collection.find({ context: { $ne: "DataService-503" } }).sort({ date: 1 }).limit(30).toArray(); // fetch the 30 oldest logs excluding those with context equal to DataService-503
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

        console.log(message)

        await channel.send({
            content: message
        });
        await collection.deleteMany({
            $or: [
                { _id: { $in: logs.map(log => log._id) } },
                { context: "DataService-503" }
            ]
        });
    }

    log()
    setInterval(log, 7000);
}