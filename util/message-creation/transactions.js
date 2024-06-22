module.exports = async function (message) {
    if (message.channel.id === "1247965608549552249") {
        return require("../bot-monitors/tradesMonitor")(message)
    }

    require("../bot-monitors/transactionMonitor")(message)
}