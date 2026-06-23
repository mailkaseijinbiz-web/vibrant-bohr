import { kv } from '@vercel/kv';
import crypto from 'crypto';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { state } = req.body;
      if (!state) {
        return res.status(400).json({ error: 'Missing state data' });
      }

      const id = typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      await kv.set(`vibrant-bohr-share:${id}`, state);
      return res.status(200).json({ id });
    } else if (req.method === 'GET') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Missing id parameter' });
      }

      const state = await kv.get(`vibrant-bohr-share:${id}`);
      if (!state) {
        return res.status(404).json({ error: 'Shared layout not found' });
      }

      return res.status(200).json(state);
    } else {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error("Share API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
