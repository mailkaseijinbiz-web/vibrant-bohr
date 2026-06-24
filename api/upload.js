import crypto from 'crypto';
import { getRedis, storeSet } from './_store.js';

const newId = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image } = req.body || {};
    if (!image) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    let id;
    if (getRedis()) {
      id = newId();
      await storeSet(`vibrant-bohr-image:${id}`, image);
    } else {
      // Fallback: upload to paste.rs
      const response = await fetch('https://paste.rs/', {
        method: 'POST',
        body: image
      });
      if (!response.ok) {
        throw new Error(`Failed to upload to paste.rs fallback: ${response.statusText}`);
      }
      const pasteUrl = await response.text();
      id = pasteUrl.trim().split('/').pop();
    }

    return res.status(200).json({ url: `/api/image?id=${id}` });
  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
