const embeds = require("../../util/embed");
const functions = require("../../util/functions");
const dropItem = require("../../util/dropItem");
const { getDatabase } = require("../../services/databaseService");

const MINIMUM_PRICES = {
  // quantity: price
  // if quantity is less than x, price must be greater than y
  5: 4347826,
  10: 2173913,
  20: 1739130,
  40: 1521739,
  50: 1304348,
  60: 1086957,
  70: 869565,
  80: 434783,
  90: 217391,
  100: 108696,
  10000: 4348,
};

module.exports = {
  name: "release_item",
  aliases: [],
  async execute(interaction, client) {
    if (interaction.user.id !== interaction.message.interaction.user.id)
      return embeds.errorEmbed(
        interaction,
        "You cannot use this modal.",
        null,
        true
      );

    try {
      const name = interaction.fields.getTextInputValue("name");
      const description = interaction.fields.getTextInputValue("description");
      const quantity_or_duration =
        interaction.fields.getTextInputValue("quantity");
      const price = interaction.fields.getTextInputValue("price");
      const method = interaction.fields.getTextInputValue("method") || "Later";
      const image = interaction.message.embeds[0].thumbnail.url;
      const item_id = interaction.message.embeds[0].footer.text.match(/\d+/)[0];
      const creator = interaction.message.embeds[0].fields[1].value.match(
        /\[([^\[\]]+?)(\s<:verified:\d+>)?\]\(https:\/\/www\.roblox\.com\/users\/\d+\/profile\)/
      )[1];

      const clear = await checkForClearance(interaction, client);
      if (!clear) return;

      if (!["Now", "Later"].includes(method))
        return embeds.errorEmbed(
          interaction,
          "Invalid drop method.",
          null,
          true
        );

      let meta_data = {
        Name: name,
        Creator: { Name: creator },
        Description: description,
        Image: image,
      };

      if (method === "Now") {
        if (Number(quantity_or_duration)) {
          try {
            await dropItem(
              client,
              Number(item_id),
              {
                price: price,
                limited_type: "unique",
                quantity: Number(quantity_or_duration),
              },
              2,
              meta_data
            );

            return embeds.successEmbed(
              interaction,
              "Item dropped successfully.",
              null,
              false
            );
          } catch (error) {
            return embeds.errorEmbed(
              interaction,
              "Something went wrong while dropping the item. (Unique)",
              null,
              true
            );
          }
        } else {
          try {
            functions.stringToDuration(quantity_or_duration);

            await dropItem(
              client,
              Number(item_id),
              {
                price: price,
                limited_type: "limited",
                date: quantity_or_duration,
              },
              2,
              meta_data
            );

            return embeds.successEmbed(
              interaction,
              "Item dropped successfully.",
              null,
              false
            );
          } catch (error) {
            return embeds.errorEmbed(
              interaction,
              "Something went wrong while dropping the item. (Limited)",
              error.message,
              true
            );
          }
        }
      } else if (method === "Later") {
        const auto_dropper = (await getDatabase("ArcadeHaven")).collection(
          "auto_dropper"
        );
        const find_result = await auto_dropper.findOne({
          item_id: Number(item_id),
        });

        if (find_result)
          return embeds.errorEmbed(
            interaction,
            "This item is already on our autodropper database. If you want to update the price or quantity, please remove the item and add it again.",
            null,
            true
          );

        let is_duration = false;
        try {
          functions.stringToDuration(quantity_or_duration);
          is_duration = true;
        } catch (error) {
          is_duration = false;
        }

        const doc = {
          item_id: Number(item_id),
          limited_type: is_duration ? "limited" : "unique",
          price: Number(price),
          [is_duration ? "date" : "quantity"]: is_duration
            ? quantity_or_duration
            : Number(quantity_or_duration),
          user: interaction.user.id,
        };

        auto_dropper.insertOne(doc);

        return embeds.successEmbed(
          interaction,
          "Item added to autodropper.",
          null,
          false
        );
      }
    } catch (error) {
      console.error(error);
      return embeds.errorEmbed(
        interaction,
        "An unexpected error occurred.",
        null,
        true
      );
    }
  },
};

async function checkForClearance(interaction, client) {
  let ALLOWED_ROLES = ["1182048570216546395", "1139471373383782450"];
  const member = interaction.member;
  const bypassable = functions.validateRoles(member, [""], "one");

  if (bypassable) return true;
  if (!functions.validateRoles(member, ALLOWED_ROLES, "one")) {
    embeds.errorEmbed(interaction, "You do not have permission to do that.");

    return false;
  }

  const method = interaction.fields.getTextInputValue("method") || "Later";
  if (method === "Now") {
    if (!functions.validateRoles(member, [""], "one")) {
      embeds.errorEmbed(
        interaction,
        "You do not have permission to drop items immediately."
      );

      return false;
    }
  }

  let price;
  try {
    price = functions.calculateExpression(
      interaction.fields.getTextInputValue("price")
    );
  } catch (error) {
    embeds.errorEmbed(interaction, "Invalid price provided.");

    return false;
  }

  const quantity_or_duration = interaction.fields.getTextInputValue("quantity");

  if (Number(quantity_or_duration)) {
    if (Number(quantity_or_duration) <= 10) {
      embeds.errorEmbed(
        interaction,
        "You do not have permission to drop items with a quantity of 10 or less."
      );

      return false;
    } else if (Number(quantity_or_duration) > 1000) {
      embeds.errorEmbed(
        interaction,
        "You do not have permission to drop items with a quantity of 1,000 or more."
      );

      return false;
    }

    // Check for minimum prices
    for (const [quantity, min_price] of Object.entries(MINIMUM_PRICES)) {
      if (
        Number(quantity_or_duration) < Number(quantity) &&
        price < min_price
      ) {
        embeds.errorEmbed(
          interaction,
          `Price must be greater than $${min_price.toLocaleString()} for a quantity of ${quantity_or_duration}.`
        );

        return false;
      }
    }

    if (Number(quantity_or_duration) < 100) {
      if (Number(quantity_or_duration) < 15) {
        embeds.errorEmbed(
          interaction,
          "You do not have permission to drop items with a quantity of 15 or less."
        );

        return false;
      }

      const auto_dropper = (await getDatabase("ArcadeHaven")).collection(
        "auto_dropper"
      );
      const count = await auto_dropper.countDocuments({
        quantity: { $lte: 100 },
        dropped: { $ne: true },
      });
      const total = await auto_dropper.countDocuments({
        dropped: { $ne: true },
      });
      const ratio = count / total;

      if (ratio > 0.07) {
        embeds.errorEmbed(
          interaction,
          "There are too many rare items in the autodropper. Please try adding this again later."
        );

        return false;
      }

      return true;
    }

    return true;
  } else {
    try {
      functions.stringToDuration(quantity_or_duration);
    } catch (error) {
      embeds.errorEmbed(
        interaction,
        "You must provide a valid duration for the item."
      );

      return false;
    }

    return true;
  }
}
