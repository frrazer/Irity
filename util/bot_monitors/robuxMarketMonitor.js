const databaseService = require('../../services/databaseService');

module.exports = async function (client) {
    const db = await databaseService.getDatabase("ArcadeHaven");
    const robux_market = db.collection("robux_market");
    const items = await db.collection("items");

    async function verify_listings() {
        try {
            const listings = await robux_market.find({}).toArray();
            const unique_item_ids = new Set(listings.map(listing => listing.itemId));
            const items_data = await items.find({ itemId: { $in: Array.from(unique_item_ids) } }).toArray();
        } catch (error) {
            console.error(error);
        }
    }


    verify_listings()
    setInterval(verify_listings, 20000);
}