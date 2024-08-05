// redisService.js

const redis = require('ioredis');
const { MongoClient } = require("mongodb");
const config = require("../util/config.json");

const redis_client = new redis({
    host: "127.0.0.1",
    port: 6379,
});

module.exports = redis_client