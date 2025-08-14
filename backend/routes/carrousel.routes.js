// npm i express @google-cloud/storage
// Requires the VM's service account to have:
// - roles/storage.objectViewer (list/get objects)
// - roles/iam.serviceAccountTokenCreator (to sign V4 URLs when using ADC)

const express = require('express');
const { Storage } = require('@google-cloud/storage');

const carrouselRouter = express.Router();
const storage = new Storage(); // uses Application Default Credentials (ADC)

const BUCKET = process.env.BUCKET;            // required

carrouselRouter.get('/', async (req, res) => {
  try {
    if (!BUCKET) {
      return res.status(400).json({ error: 'BUCKET env var is required' });
    }

    const bucket = storage.bucket(BUCKET);

    // List files (optionally under a prefix like "images/")
    const [files] = await bucket.getFiles(PREFIX ? { prefix: PREFIX } : {});

    // Keep only .jpg files (case-insensitive)
    const jpgFiles = files.filter(f => f.name.toLowerCase().endsWith('.jpg'));

    // Generate signed (v4) READ URLs that expire in 60 seconds
    const urls = await Promise.all(
      jpgFiles.map(f =>
        f.getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 60 * 1000, // 60s
        }).then(([url]) => ({ url }))
      )
    );

    res.json(urls);
  } catch (err) {
    console.error('Error generating carousel URLs:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = carrouselRouter;