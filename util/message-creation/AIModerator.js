const AI = require("../runAi").chatgpt;
const { EmbedBuilder } = require("discord.js");

const punishments = {
  hate: ".timeout 1 ?r Hate Speech ?t 12h",
  "hate/threatening": ".ban 1 ?r Hate Speech with Threats",
  harassment: ".timeout 1 ?r Harassment ?t 12h",
  "harassment/threatening": ".ban 1 ?r Harassment with Threats",
  "self-harm": ".timeout 1 ?r Promoting Self-Harm ?t 12h",
  "self-harm/intent": ".timeout 1 ?r Expressing Intent for Self-Harm ?t 12h",
  "self-harm/instructions": ".ban 1 ?r Instructing on Self-Harm",
  sexual: ".timeout 1 ?r Sexual Content ?t 12h",
  "sexual/minors": ".ban 1 ?r Sexual Content Involving Minors",
  violence: ".timeout 1 ?r Violent Content ?t 12h",
  "violence/graphic": ".ban 1 ?r Graphic Violent Content",
};

const rulesSeverity = [
  "hate",
  "harassment",
  "self-harm",
  "sexual",
  "violence",
  "self-harm/intent",
  "hate/threatening",
  "harassment/threatening",
  "violence/graphic",
  "self-harm/instructions",
  "sexual/minors",
];

const ignoredCategories = ["harassment", "harassment/threatening"];

function formatCategories(input) {
  const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

  const formatOutput = (categories) => {
    if (categories.length === 1) return categories[0];
    return categories.slice(0, -1).join(", ") + " and " + categories.slice(-1);
  };

  const categories = input.split("\n");
  const consolidated = {};

  categories.forEach((category) => {
    const mainCategory = category.split(" (")[0];
    const subCategory = category.match(/\(([^)]+)\)/);
    if (!consolidated[mainCategory]) {
      consolidated[mainCategory] = [];
    }
    if (subCategory) {
      consolidated[mainCategory].push(subCategory[1]);
    }
  });

    const formattedCategories = Object.entries(consolidated).map(
    ([key, value]) => {
      if (value.length > 0) {
        return `${capitalize(key)} (${value.join(" & ")})`;
      }
      return capitalize(key);
    }
  );

  return formatOutput(formattedCategories);
}

const IGNORE_CHANNELS = ["1060495255692136558"];

module.exports = async function (message) {
  if (IGNORE_CHANNELS.includes(message.channel.id)) return;

  const response = await AI.moderations.create({
    input: message.content,
  });

  if (response.results[0].flagged) {
    const categories = response.results[0].categories;
    const flaggedCategories = Object.keys(categories).filter(
      (category) => categories[category]
    );

    const ignored = flaggedCategories.filter((category) =>
      ignoredCategories.includes(category)
    );

    if (ignored.length > 0) return;

    const formattedCategories = flaggedCategories.map((category) => {
      const [mainCategory, subCategory] = category.split("/");
      return subCategory ? `${mainCategory} (${subCategory})` : mainCategory;
    });

    const mostSevereCategory = rulesSeverity.find((category) =>
      flaggedCategories.includes(category)
    );
    let punishment = punishments[mostSevereCategory];
    const formatted = formatCategories(formattedCategories.join("\n"));
    punishment = punishment.replace("1", message.author.id);

    const embed = new EmbedBuilder()
      .setTitle("Potential Rule-Breaking Message Detected")
      .setDescription(
        `<:singleright:1252703372998611085> Author: <@${
          message.author.id
        }> *\`${
          message.author.id
        }\`*\n<:singleright:1252703372998611085> Link: ${message.url} *\`${
          message.id
        }\`*\n<:singleright:1252703372998611085> <t:${Math.floor(
          message.createdTimestamp / 1000
        )}:f>\n\`\`\`diff\n- ${message.content}\n\`\`\``
      )
      .addFields(
        { name: "Violation Detected", value: formatted },
        {
          name: "AI Suggested Punishment",
          value: `\`\`\`${punishment}\n\`\`\`${
            flaggedCategories.length > 1
              ? `\n-# The most severe rule violation determined the punishment.`
              : ""
          }`,
        }
      )
      .setColor("Red");

    const notify_channel = message.guild.channels.cache.get(
      "1096567235365048403"
    );
    notify_channel.send({
      embeds: [embed],
    });
  }
};
