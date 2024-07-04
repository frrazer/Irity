const { OpenAI } = require('openai');

module.exports = async function (content, assistant_id) {
    const chatgpt = new OpenAI({
        apiKey: process.env.CHATGPT_KEY,
    });

    const thread = await chatgpt.beta.threads.create();

    const message = chatgpt.beta.threads.messages.create(thread.id, {
        role: 'user',
        content,
    });

    let run = await chatgpt.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id,
    });

    if (run.status === 'completed') {
        const messages = (await chatgpt.beta.threads.messages.list(thread.id))
            .data;

        return messages[0].content[0].text.value;
    } else {
        return null;
    }
};
