const getDatabase = (databaseName) => {
  const { MongoClient } = require("mongodb");
  const config = require("../util/config.json");

  const uri = process.env.MONGO_URI
  const client = new MongoClient(uri);

  try {
    const database = client.db(databaseName);
    return database;
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  getDatabase,
};
