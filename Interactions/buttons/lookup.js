const embeds = require("../../util/embed");
const {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const { getDatabase } = require("../../services/databaseService");
const functions = require("../../util/functions");

module.exports = {
  name: "release_item",
  aliases: ["toggle_projected", "edit_value"],
  async execute(interaction, client) {
    if (interaction.user.id !== interaction.message.interaction.user.id)
      return embeds.errorEmbed(
        interaction,
        "You cannot use this button.",
        null,
        true
      );

    if (interaction.customId === "release_item") {
      if (
        !functions.validateRoles(
          interaction.member,
          ["1182048570216546395"],
          "all"
        )
      ) {
        return embeds.errorEmbed(
          interaction,
          "You do not have the required clearance to use this button.",
          null,
          true
        );
      }

      const description = interaction.message.embeds[0].description;
      const name = interaction.message.embeds[0].title;
      const modal = new ModalBuilder()
        .setTitle(`Drop Item`)
        .setCustomId("release_item")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setLabel("Item Name")
              .setPlaceholder("Enter the name of the item")
              .setCustomId("name")
              .setRequired(true)
              .setStyle(TextInputStyle.Short)
              .setValue(name)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setLabel("Description")
              .setPlaceholder("Enter a description of the item")
              .setCustomId("description")
              .setRequired(true)
              .setStyle(TextInputStyle.Paragraph)
              .setValue(description)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setLabel("Quantity or Duration")
              .setPlaceholder("Enter the quantity or duration of the item")
              .setCustomId("quantity")
              .setRequired(true)
              .setStyle(TextInputStyle.Short)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setLabel("Price")
              .setPlaceholder("Enter the Price of the item")
              .setCustomId("price")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setLabel("Drop Method")
              .setPlaceholder('Either "Now" or "Later"')
              .setCustomId("method")
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
          )
        );

      interaction.showModal(modal);
    } else if (interaction.customId === "toggle_projected") {
      const db = await getDatabase("ArcadeHaven");
      const items = db.collection("items");

      const item = await items.findOne(
        {
          name: {
            $regex: `^\\s*${interaction.message.embeds[0].title}\\s*$`,
          },
        },
        {
          projection: { projected: 1, name: 1, itemId: 1 },
        }
      );

      if (!item) {
        return embeds.errorEmbed(interaction, "Item not found.", null, true);
      }

      await items.updateOne(
        { name: interaction.message.embeds[0].title },
        { $set: { projected: !item.projected } }
      );

      return embeds.successEmbed(
        interaction,
        `The \`projected\` tag has been ${
          item.projected ? "removed from" : "added to"
        } **${item.name}**.`,
        null,
        true
      );
    } else if (interaction.customId === "edit_value") {
      // if (
      //   !functions.validateRoles(
      //     interaction.member,
      //     ["1182048570216546395"],
      //     "all"
      //   )
      // ) {
      //   return embeds.errorEmbed(
      //     interaction,
      //     "You do not have the required clearance to use this button.",
      //     null,
      //     true
      //   );
      // }

      const db = await getDatabase("ArcadeHaven");
      const items = db.collection("items");

      const item = await items.findOne(
        {
          name: {
            $regex: `^\\s*${interaction.message.embeds[0].title.replace(
              /\$/g,
              "\\$"
            )}\\s*$`,
          },
        },
        {
          projection: { projected: 1, name: 1, itemId: 1 },
        }
      );

      if (!item) {
        return embeds.errorEmbed(interaction, "Item not found.", null, true);
      }

      const modal = new ModalBuilder()
        .setTitle(`Edit Value`)
        .setCustomId("edit_value")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setLabel("New Value")
              .setPlaceholder(`${(item.value || 0).toLocaleString()}`)
              .setCustomId("value")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setLabel("Reason")
              .setPlaceholder("Why are you changing the value?")
              .setCustomId("reason")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setLabel("Trade Proofs")
              .setPlaceholder(
                "Message links to trade proofs or value discussion, if any. Not required for changes under 5,000,000"
              )
              .setCustomId("proof")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(false)
          )
        );

      return interaction.showModal(modal);
    }
  },
};
