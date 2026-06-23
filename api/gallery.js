import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const gallery = await kv.get('vibrant-bohr-gallery') || [];
      return res.status(200).json(gallery);
    } else if (req.method === 'POST') {
      const gallery = req.body;
      await kv.set('vibrant-bohr-gallery', gallery);
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error("Vercel KV Error:", error);
    if (req.method === 'GET') {
      return res.status(200).json([]);
    }
    return res.status(500).json({ error: error.message });
  }
  res.status(405).send('Method Not Allowed');
}
