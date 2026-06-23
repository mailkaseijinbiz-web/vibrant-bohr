import { kv } from '@vercel/kv';

const generatedTemplates = [
  '/posters/poster_takoyaki_1782184842429.png',
  '/posters/poster_negidako_1782184913396.png',
  '/posters/poster_mentai_1782184922839.png',
  '/posters/poster_takosen_1782184868897.png',
  '/posters/poster_drinks_1782184880492.png',
  '/posters/poster_kakigori_1782184890220.png',
];

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const gallery = await kv.get('vibrant-bohr-gallery') || generatedTemplates;
      return res.status(200).json(gallery);
    } else if (req.method === 'POST') {
      const gallery = req.body;
      await kv.set('vibrant-bohr-gallery', gallery);
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error("Vercel KV Error:", error);
    if (req.method === 'GET') {
      return res.status(200).json(generatedTemplates);
    }
    return res.status(500).json({ error: error.message });
  }
  res.status(405).send('Method Not Allowed');
}
