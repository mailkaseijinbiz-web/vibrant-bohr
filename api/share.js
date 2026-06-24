import crypto from 'crypto';
import { getRedis, storeGet, storeSet } from './_store.js';

const newId = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { state } = req.body || {};
      if (!state) {
        return res.status(400).json({ error: 'Missing state data' });
      }

      let id;
      if (getRedis()) {
        id = newId();
        await storeSet(`vibrant-bohr-share:${id}`, state);
      } else {
        // Fallback: upload state JSON to paste.rs
        const response = await fetch('https://paste.rs/', {
          method: 'POST',
          body: JSON.stringify(state)
        });
        if (!response.ok) {
          throw new Error(`Failed to save state to paste.rs fallback: ${response.statusText}`);
        }
        const pasteUrl = await response.text();
        id = pasteUrl.trim().split('/').pop();
      }
      return res.status(200).json({ id });
    } else if (req.method === 'GET') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Missing id parameter' });
      }

      let state;
      if (getRedis()) {
        state = await storeGet(`vibrant-bohr-share:${id}`);
      } else {
        // Fallback: fetch state JSON from paste.rs
        const response = await fetch(`https://paste.rs/${id}`);
        if (response.ok) {
          const text = await response.text();
          state = JSON.parse(text);
        }
      }

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
