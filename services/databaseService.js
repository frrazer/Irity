const { MongoClient, Db } = require("mongodb");

/**
 * MongoDB connection URI.
 * @type {string}
 */
const uri = process.env.MONGO_URI;

/**
 * MongoDB client instance.
 * @type {MongoClient}
 */
let client;

/**
 * Connects to MongoDB and returns the client instance.
 * @returns {Promise<MongoClient>} The MongoDB client.
 */
const connectToMongoDB = async () => {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
};

/**
 * Retrieves a MongoDB database instance.
 * @param {string} databaseName The name of the database to connect to.
 * @returns {Promise<Db>} The database instance.
 */
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