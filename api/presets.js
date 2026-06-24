import { getRedis, storeGet, storeSet } from './_store.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const presets = getRedis()
        ? ((await storeGet('vibrant-bohr-presets')) || [])
        : [];
      return res.status(200).json(presets);
    } else if (req.method === 'POST') {
      const presets = req.body;
      if (getRedis()) {
        await storeSet('vibrant-bohr-presets', presets);
      }
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error("Presets Store Error:", error);
    return res.status(500).json({ error: error.message });
  }
  res.status(405).send('Method Not Allowed');
}
