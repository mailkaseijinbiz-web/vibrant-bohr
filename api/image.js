import { getRedis, storeGet } from './_store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Missing image id' });
    }

    let base64;
    if (getRedis()) {
      base64 = await storeGet(`vibrant-bohr-image:${id}`);
    } else {
      // Fallback: fetch from paste.rs
      const response = await fetch(`https://paste.rs/${id}`);
      if (response.ok) {
        base64 = await response.text();
      }
    }

    if (!base64) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      const buffer = Buffer.from(base64, 'base64');
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.status(200).send(buffer);
    }

    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Image Fetch Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
