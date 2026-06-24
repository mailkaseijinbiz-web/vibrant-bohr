import { getRedis, storeGet, storeSet } from './_store.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const gallery = getRedis()
        ? ((await storeGet('vibrant-bohr-gallery')) || [])
        : [];
      return res.status(200).json(gallery);
    } else if (req.method === 'POST') {
      const gallery = req.body;
      if (getRedis()) {
        await storeSet('vibrant-bohr-gallery', gallery);
      }
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error("Gallery Store Error:", error);
    return res.status(500).json({ error: error.message });
  }
  res.status(405).send('Method Not Allowed');
}
