const express = require('express');
const carrouselRouter = express.Router();

const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

const BUCKET_NAME = process.env.BUCKET;

carrouselRouter.get('', async (req, res) => {
    try {
        const [files] = await storage.bucket(BUCKET_NAME).getFiles();

        const jpgImages = files.filter(file => file.name.endsWith('.jpg'));

        // Generate signed URLs for each image
        const images = await Promise.all(
            jpgImages.map(async (file) => {
                const [url] = await file.getSignedUrl({
                    action: 'read',
                    expires: Date.now() + 60 * 1000, // 1 minute
                });
                return { url };
            })
        );

        res.json(images);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = carrouselRouter;