const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const yaml = require('yaml');
const embeds = require('../../util/embed');

async function getBufferFromUrl(url) {
    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'arraybuffer',
        });
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error('Error fetching the buffer from URL:', error);
        throw error;
    }
}

module.exports = {
    async execute(interaction, client) {
        const file = interaction.options.getAttachment('file');
        const buffer = await getBufferFromUrl(file.url);
        const upload_id = crypto.randomBytes(5).toString('hex');
        const extension = path.extname(file.name);
        const filePath = path.join(
            '/var/www/irity-content/',
            `${upload_id}${extension}`,
        );
        const metadataFilePath = path.join(
            '/var/www/irity-content/metadata/',
            `${upload_id}.yaml`,
        );

        const metadata = {
            uploader_id: interaction.user.id,
            uploader_name: interaction.user.username,
            uploaded_at: new Date().toISOString(),
            original_filename: file.name,
            file_id: upload_id,
        };

        fs.writeFile(filePath, buffer, (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return embeds.errorEmbed(
                    interaction,
                    'Something went wrong while saving the file. Please try again.',
                    null,
                    false,
                );
            }
            const yamlMetadata = yaml.stringify(metadata);

            fs.writeFile(metadataFilePath, yamlMetadata, (err) => {
                if (err) {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            return embeds.errorEmbed(
                                interaction,
                                'Something went wrong while saving the metadata. Please try again.',
                                null,
                                false,
                            );
                        }
                    });

                    try {
                        return embeds.errorEmbed(
                            interaction,
                            'Something went wrong while saving the metadata. Please try again.',
                            null,
                            false,
                        );
                    } catch (error) {}
                }

                interaction.editReply({
                    content: `https://cdn.noxirity.com/${upload_id}`
                })
            });
        });
    },
};
