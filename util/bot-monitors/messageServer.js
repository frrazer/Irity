const databaseService = require('../../services/databaseService');
const express = require("express");

module.exports = async function (client) {
    const app = express();
    const guild = client.guilds.cache.get("932320416989610065");

    app.use(express.json());

    app.use("/", async (req, res) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(
            JSON.stringify({
                status: "success",
            })
        );

        try {
            let channel_id = req.body.channel_id;
            if (!channel_id) return
            const channel = guild.channels.cache.get(channel_id);
            if (!channel) return;

            channel.send(req.body.msg);
        } catch (e) {
            return;
        }
    });

    app.listen(3003);
}