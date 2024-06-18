const { getDatastoreEntry, setDatastoreEntry, setAPIKey } = require("noblox.js")
const databaseService = require("./databaseService")
const { stringToDuration } = require("../util/functions")
const { EmbedBuilder } = require("@discordjs/builders")

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

                return cachedData.value
            }
        }

        await setAPIKey(process.env.DATASTORE_KEY)
        const entry = await getDatastoreEntry(4570608156, process.env.DATASTORE_NAME, key)

        if (entry) {
            let doc = {
                key,
                value: entry,
                expiry: Date.now() + 60000,
            }

            if (reference) {
                doc.reference = reference
            }

            await cache.insertOne(doc)
        }

        return entry
    },

    async setDatastoreEntry(key, value) {
        await setAPIKey(process.env.DATASTORE_KEY)
        const user_id = parseInt(key.split("_")[1])
        return setDatastoreEntry(4570608156, process.env.DATASTORE_NAME, key, value, undefined, undefined, undefined, [user_id])
    },

    async gameBan(key, reason, duration, admin) {
        let true_duration
        if (duration === "perm") {
            true_duration = -1
        } else {
            true_duration = stringToDuration(duration)
        }

        await setAPIKey(process.env.ROBLOX_API_KEY)
        let entry = await getDatastoreEntry(4570608156, process.env.DATASTORE_NAME, key)
        if (!entry) return false

        entry.data.Data.Moderation.BanData2 = {}
        entry.data.Data.Moderation.AdminName = admin
        entry.data.Data.Moderation.BanData2.Reason = reason
        entry.data.Data.Moderation.BanData2.Banned = true
        entry.data.Data.Moderation.BanData2.EpochTime = Math.floor(Date.now() / 1000) + true_duration
        delete entry.data.MetaData.ActiveSession

        await this.setDatastoreEntry(key, entry.data)

        const database = await databaseService.getDatabase("DiscordServer")
        const cache = database.collection("RobloxServiceCache")
        await cache.updateOne({ key }, { $set: { value: entry, expiry: Date.now() + 60000 } })

        return true
    },

    async gameUnban(key) {
        await setAPIKey(process.env.ROBLOX_API_KEY)
        let entry = await getDatastoreEntry(4570608156, process.env.DATASTORE_NAME, key)
        if (!entry) return false

        entry.data.Data.Moderation.BanData2.Banned = false
        delete entry.data.MetaData.ActiveSession

        await this.setDatastoreEntry(key, entry.data)

        const database = await databaseService.getDatabase("DiscordServer")
        const cache = database.collection("RobloxServiceCache")
        await cache.updateOne({ key }, { $set: { value: entry, expiry: Date.now() + 60000 } })

        return true
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