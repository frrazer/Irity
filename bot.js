require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Collection,
  Partials,
} = require("discord.js");

const { DisTube } = require("distube");
const { SoundCloudPlugin } = require("@distube/soundcloud")

const client = new Client({
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates
  ],
});

const isDevMode = process.argv.includes('dev');
client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.modals = new Collection();
client.slashCommands = new Collection();
client.cooldowns = new Collection();

["commandHandler.js", "interactionHandler.js", "eventHandler.js"].forEach(
  (handler) => {
    require(`./handlers/${handler}`)(client);
  }
);

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

client.distube = new DisTube(client, {
  plugins: [new SoundCloudPlugin()],
})

client.distube.on("finish", (queue) => {
  client.distube.voices.leave(queue.id);
})

client.login(isDevMode ? process.env.DEV_BOT_TOKEN : process.env.BOT_TOKEN);

module.exports = {
  client,
};