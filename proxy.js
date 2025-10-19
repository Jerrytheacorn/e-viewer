const express = require('express');
const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
const app = express();

// Simple proxy that forwards GET requests to e621.net and returns response body
// Usage: http://localhost:3000/proxy/posts.json?tags=...
app.get('/proxy/posts.json', async (req, res) => {
  try {
    const qs = req.originalUrl.replace('/proxy/posts.json','');
    const target = 'https://e621.net/posts.json' + qs;
    const r = await fetch(target, {
      headers: {
        'Accept': 'application/json',
        // some APIs require a User-Agent; set a generic one
        'User-Agent': 'e-viewer-local-proxy/1.0'
      }
    });
    const body = await r.text();
    res.status(r.status).set('Content-Type', 'application/json').send(body);
  } catch (err) {
    res.status(500).send({ error: String(err) });
  }
});

app.listen(3000, () => console.log('Proxy listening on http://localhost:3000'));
