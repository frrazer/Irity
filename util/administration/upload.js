const { EmbedBuilder } = require("discord.js");
const sharp = require("sharp");
const databaseService = require("../../services/databaseService");
const embeds = require("../../util/embed");

module.exports = {
    async execute(interaction, client) {
        const url = interaction.options.getString("url");

        if (!url.startsWith("http")) {
            return embeds.errorEmbed(
                interaction,
                "The URL provided is not a valid URL."
            );
        }

        await interaction.deferReply();

        try {
            const response = await fetch(url);
            let content_type = response.headers.get("content-type").toLowerCase();
            const [format, type] = content_type.split("/");

            if (format === "image") {
                if (type !== "png" && type !== "jpeg" && type !== "gif" && type !== "webp") {
                    return embeds.errorEmbed(
                        interaction,
                        "The image must be in PNG, JPEG, GIF or WebP format."
                    );
                }

                const image_data = await response.arrayBuffer();
                const image_buffer = Buffer.from(image_data);
                const image_id = require("crypto").randomBytes(4).toString("hex");
                const image_path = `/var/www/irity-content/images/${image_id}.${type}`;
                require("fs").writeFileSync(image_path, image_buffer);

                const database = await databaseService.getDatabase("DiscordServer");
                const collection = database.collection("Files");
                await collection.insertOne({
                    id: image_id,
                    path: image_path,
                    uploader: interaction.user.id,
                    date: new Date(),
                });

                return interaction.editReply({
                    content: `<https://cdn.noxirity.com/${image_id}>`,
                });

            } else if (format === "video") {
                if (type !== "mkv" && type !== "avchd" && type !== "mp4" && type !== "webm") {
                    return embeds.errorEmbed(
                        interaction,
                        "The video must be in MKV, AVCHD, MP4 or WebM format."
                    );
                }

                const video_data = await response.arrayBuffer();
                const video_buffer = Buffer.from(video_data);
                const video_id = require("crypto").randomBytes(4).toString("hex");
                const video_path = `/var/www/irity-content/videos/${video_id}.${type}`;
                require("fs").writeFileSync(video_path, video_buffer);

                // save the video to the database
                const database = await databaseService.getDatabase("DiscordServer");
                const collection = database.collection("Files");
                await collection.insertOne({
                    id: video_id,
                    path: video_path,
                    uploader: interaction.user.id,
                    date: new Date(),
                });

                return interaction.editReply({
                    content: `<https://cdn.noxirity.com/${video_id}>`,
                });
            } else {
                return embeds.errorEmbed(
                    interaction,
                    "The URL provided is not a valid image or video."
                );
            }
        } catch (error) {
            console.error(error);
        }
    }
}