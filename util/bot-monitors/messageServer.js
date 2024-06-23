const databaseService = require('../../services/databaseService');
const express = require("express");
const net = require("net");

function checkPortInUse(port) {
    return new Promise((resolve, reject) => {
        const server = net.createServer();

        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(true); // Port is in use
            } else {
                reject(err); // Some other error occurred
            }
        });

        server.once('listening', () => {
            server.close();
            resolve(false); // Port is available
        });

        server.listen(port);
    });
}

module.exports = async function (client) {
    const port = 3003;
    const isPortInUse = await checkPortInUse(port);
    if (isPortInUse) return

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