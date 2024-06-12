const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
let client;

const connectToMongoDB = async () => {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
};

const getDatabase = async (databaseName) => {
  try {
    const client = await connectToMongoDB();
    const database = client.db(databaseName);
    return database;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

module.exports = {
  getDatabase,
};
