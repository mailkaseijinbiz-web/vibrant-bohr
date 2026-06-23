import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const presets = await kv.get('vibrant-bohr-presets') || [];
      return res.status(200).json(presets);
    } else if (req.method === 'POST') {
      const presets = req.body;
      await kv.set('vibrant-bohr-presets', presets);
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error("Vercel KV Error:", error);
    // Fallback if KV is not configured
    if (req.method === 'GET') {
      return res.status(200).json([]);
    }
    return res.status(500).json({ error: error.message });
  }
  res.status(405).send('Method Not Allowed');
}
