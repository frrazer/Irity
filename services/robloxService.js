const { getDatastoreEntry, setDatastoreEntry, setAPIKey } = require("noblox.js")
const databaseService = require("./databaseService")
const { stringToDuration } = require("../util/functions")
const { EmbedBuilder } = require("@discordjs/builders")
const axios = require("axios")

module.exports = {
    async getDatastoreEntry(key, reference) {
        const database = await databaseService.getDatabase("DiscordServer")
        const cache = database.collection("RobloxServiceCache")
        const cachedData = await cache.findOne({ key })

        if (cachedData) {
            const expiry = cachedData.expiry
            if (expiry < Date.now()) {
                await cache.deleteOne({ key })
            } else {
                if (reference) {
                    await cache.updateOne({ key }, { $set: { reference } })
                }

                if (cachedData.value === null) {
                    throw new Error("404 NOT_FOUND Entry not found in the datastore.")
                } else {
                    return cachedData.value
                }
            }
        }

        await setAPIKey(process.env.DATASTORE_KEY)
        let entry

        try {
            entry = await getDatastoreEntry(4570608156, process.env.DATASTORE_NAME, key)
            console.log(`Fetched entry for key ${key} from Datastore`)

            if (entry) {
                let doc = {
                    key,
                    value: entry,
                    expiry: Date.now() + 60000,
                }

                if (reference) {
                    doc.reference = reference
                }

                await cache.insertOne({
                    ...doc,
                    UserId: key.split("_")[1]
                })

                return entry
            } else {
                throw new Error("No entry found")
            }
        } catch (error) {
            await cache.insertOne({
                key,
                value: null,
                expiry: Date.now() + 60000,
                UserId: key.split("_")[1],
                ...(reference ? { reference } : {})
            })

            throw error
        }
    },

    async setDatastoreEntry(key, value) {
        await setAPIKey(process.env.DATASTORE_KEY)
        const user_id = parseInt(key.split("_")[1])
        return setDatastoreEntry(4570608156, process.env.DATASTORE_NAME, key, value, undefined, undefined, undefined, [user_id])
    },

    async gameBan(key, rule_violation, duration, ban_alts, admin) {
        let true_duration
        if (duration === "perm") {
            true_duration = -1
        } else {
            true_duration = stringToDuration(duration)
        }

        const user_id = parseInt(key.split("_")[1]);
        const url = `https://apis.roblox.com/cloud/v2/universes/4570608156/user-restrictions/${user_id}?updateMask=gameJoinRestriction`;

        const body = {
            gameJoinRestriction: {
                active: true,
                duration: `${true_duration}s`,
                privateReason: "Check Irity cases for more information",
                displayReason: `We believe you have violated rule ${rule_violation}. You can appeal this ban by joining our Discord server.`,
                excludeAltAccounts: !ban_alts,
                inherited: true,
                startTime: new Date().toISOString()
            }
        };

        try {
            await axios({
                method: "PATCH",
                url: url,
                headers: {
                    "x-api-key": process.env.BAN_API_KEY,
                    "Content-Type": "application/json",
                },
                data: body
            });

            return true
        } catch (error) {
            return false
        }
    },

    async gameUnban(key) {
        const user_id = parseInt(key.split("_")[1]);
        const url = `https://apis.roblox.com/cloud/v2/universes/4570608156/user-restrictions/${user_id}?updateMask=gameJoinRestriction`;

        const body = {
            gameJoinRestriction: {
                active: false
            }
        };

        try {
            await axios({
                method: "PATCH",
                url: url,
                headers: {
                    "x-api-key": process.env.BAN_API_KEY,
                    "Content-Type": "application/json",
                },
                data: body
            });

            return true
        } catch (error) {
            return false
        }
    },

    async getBanStatus(key) {
        const user_id = parseInt(key.split("_")[1]);
        const url = `https://apis.roblox.com/cloud/v2/universes/4570608156/user-restrictions/${user_id}`;

        try {
            const response = await axios({
                method: "GET",
                url: url,
                headers: {
                    "x-api-key": process.env.BAN_API_KEY,
                    "Content-Type": "application/json",
                }
            });

            return response.data.gameJoinRestriction
        } catch (error) {
            return false
        }
    },

    async setCash(key, amount) {
        await setAPIKey(process.env.ROBLOX_API_KEY)
        if (isNaN(amount)) return false
        let entry = await getDatastoreEntry(4570608156, process.env.DATASTORE_NAME, key)
        if (!entry) return false

        entry.data.Data.Cash = amount
        await this.setDatastoreEntry(key, entry.data)

        const database = await databaseService.getDatabase("DiscordServer")
        const cache = database.collection("RobloxServiceCache")
        await cache.updateOne({ key }, { $set: { value: entry, expiry: Date.now() + 60000 } })

        return true
    },
}