const databaseService = require('../../services/databaseService');
const express = require('express');
const net = require('net');

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
    monitorForOutboundMessages(3003, client);
    // monitorForInboundMessages(4444, client);
};

async function monitorForOutboundMessages(port = 3003, client) {
    const isPortInUse = await checkPortInUse(port);
    if (isPortInUse) {
        console.error(`Port ${port} is already in use.`);
        return;
    }

    const app = express();
    const guild = client.guilds.cache.get('932320416989610065');
    app.use(express.json());

    app.use((req, res, next) => {
        res.setHeader('Content-Type', 'application/json');
        next();
    });

    app.post('/', async (req, res) => {
        const { channel_id, msg } = req.body;

        if (!channel_id || !msg) {
            res.status(400).json({
                status: 'error',
                message: 'Missing channel_id or msg in request body.',
            });
            return;
        }

        const channel = guild.channels.cache.get(channel_id);
        if (!channel) {
            res.status(404).json({
                status: 'error',
                message: 'Channel not found.',
            });
            return;
        }

        try {
            await channel.send(msg);
            res.status(200).json({ status: 'success' });
        } catch (e) {
            res.status(500).json({
                status: 'error',
                message: 'Failed to send message.',
            });
        }
    });

    app.get('/', async (req, res) => {
        res.status(200).json({
            status: 'success',
            message: 'The server is running.',
        });
    });

    app.listen(port, () => {
        console.log(`Listening for outbound messages on port ${port}.`);
    });
}

// async function monitorForInboundMessages(port = 4444, client) {
//     const isPortInUse = await checkPortInUse(port);
//     if (isPortInUse) {
//         console.error(`Port ${port} is already in use.`);
//         return;
//     }

//     const app = express();
//     app.use(express.json());

//     app.post('/', async (req, res) => {
//         res.status(200).json({ status: 'success' });

//         require('../../events/messageCreate').execute(
//             {
//                 from_server: true,
//                 ...req.body.message,
//             },
//             client,
//         );
//     });

//     app.listen(port, () => {
//         console.log(`Listening for inbound messages on port ${port}.`);
//     });
// }
