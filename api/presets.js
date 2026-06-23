import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const presets = await kv.get('vibrant-bohr-presets') || [
        {
          id: 'default',
          name: 'たこ焼き屋台セット',
          images: {
            'a2--1.5': '/posters/poster_takoyaki_1782184842429.png',
            'a2--0.5': '/posters/poster_negidako_1782184913396.png',
            'a2-0.5': '/posters/poster_mentai_1782184922839.png',
            'a2-1.5': '/posters/poster_takosen_1782184868897.png',
            'a1-left': '/posters/poster_drinks_1782184880492.png',
            'a1-middle': '/posters/poster_kakigori_1782184890220.png',
          }
        }
      ];
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
