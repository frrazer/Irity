require("dotenv").config();

const { ShardingManager } = require("discord.js");
const isDevMode = process.argv.includes('dev');

const manager = new ShardingManager("./bot.js", {
  token: isDevMode ? process.env.DEV_BOT_TOKEN : process.env.BOT_TOKEN,
  totalShards: "auto",
  shardArgs: process.argv, // Pass command line arguments to shards
  execArgv: ['--trace-warnings'], // Node.js flags
});

console.log(`Starting ${isDevMode ? "Development" : "Production"} Mode`);

manager.on("shardCreate", (shard) => {
  console.log(`Shard Launched: ${shard.id}`);
});

manager.spawn();