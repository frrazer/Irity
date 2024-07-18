const databaseService = require("../../services/databaseService");

module.exports = async function (client) {
  const db = await databaseService.getDatabase("ArcadeHaven");
  const robux_market = db.collection("robux_market");
  const items = await db.collection("items");

  async function verify_listings() {
    try {
      const listings = await robux_market.find({}).toArray();
      const unique_item_ids = new Set(
        listings.map((listing) => listing.itemId)
      );
      const items_data = await items
        .find(
          { itemId: { $in: Array.from(unique_item_ids) } },
          {
            projection: {
              "serials.u": 1,
              itemId: 1,
              value: 1,
            },
          }
        )
        .toArray();

      const minimum_rate = 0.2
      for (let listing of listings) {
        const item_data = items_data.find(
          (item) => item.itemId === listing.itemId
        );
        if (!item_data) {
          await robux_market.deleteOne({ _id: listing._id });
          continue;
        }

        const serial_data = item_data.serials[listing.serial];
        const owner_id = serial_data.u;
        const seller_id = listing.userId;

        if (owner_id !== seller_id) {
          await robux_market.deleteOne({ _id: listing._id });
          continue;
        }

        const valuePerRobux = (item_data.value || 0) / listing.price;
        const ratePer10k = 10000 / valuePerRobux;

        if (item_data.value > 0 && ratePer10k < minimum_rate) {
          console.log(`Deleting listing ${listing._id} due to rate ${ratePer10k}`);
          await robux_market.deleteOne({ _id: listing._id });
          continue;
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  verify_listings();
  setInterval(verify_listings, 20000);
};
