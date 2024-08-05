const { OpenAI } = require("openai");
const dbs = require("../services/databaseService");

const chatgpt = new OpenAI({
  apiKey: process.env.CHATGPT_KEY,
});

module.exports = {
  run: async function (content, assistant_id) {
    const thread = await chatgpt.beta.threads.create();

    chatgpt.beta.threads.messages.create(thread.id, {
      role: "user",
      content,
    });

    let run = await chatgpt.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id,
    });

    if (run.status === "completed") {
      const messages = (await chatgpt.beta.threads.messages.list(thread.id))
        .data;

      const db = await dbs.getDatabase("DiscordServer");
      const collection = db.collection("ValueAIThreads");
      collection.insertOne({
        thread_id: thread.id,
        assistant_id,
      });

      return messages[0].content[0].text.value;
    } else {
      return null;
    }
  },

  chatgpt,
};
