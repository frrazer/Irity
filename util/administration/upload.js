const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const yaml = require('yaml');

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

        // Metadata to save
        const metadata = {
            uploader: interaction.user.username, // Assuming interaction.user contains the user info
            uploaded_at: new Date().toISOString(),
            original_filename: file.name,
            file_id: upload_id,
        };

        fs.writeFile(filePath, buffer, (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return interaction.reply({
                    content: 'There was an error saving the file.',
                    ephemeral: true,
                });
            }
            const yamlMetadata = yaml.stringify(metadata);

            fs.writeFile(metadataFilePath, yamlMetadata, (err) => {
                if (err) {
                    console.error('Error writing metadata file:', err);
                    return interaction.reply({
                        content: 'There was an error saving the metadata.',
                        ephemeral: true,
                    });
                }

                console.log(
                    'File and metadata saved successfully:',
                    filePath,
                    metadataFilePath,
                );
                interaction.reply({
                    content: `File uploaded successfully with ID: ${upload_id}`,
                    ephemeral: true,
                });
            });
        });
    },
};
