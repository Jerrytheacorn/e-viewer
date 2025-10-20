const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = 3001;

const ALLOWED_HOSTS = [
  'https://e621.net',
  'https://api.rule34.xxx'
];

// Optional credentials for rule34: set RULE34_USER and RULE34_KEY in environment
const RULE34_USER = process.env.RULE34_USER;
const RULE34_KEY = process.env.RULE34_KEY;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/proxy', async (req, res) => {
  let { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url param' });
  // Some clients may double-encode; normalize to a string
  if (Array.isArray(url)) url = url[0];
  try {
    const decoded = decodeURIComponent(url);
    if (!ALLOWED_HOSTS.some(h => decoded.startsWith(h))) {
      console.warn('Blocked proxy attempt to:', decoded);
      return res.status(400).json({ error: 'Invalid or disallowed host', url: decoded });
    }

    // If this is a rule34 request and credentials are provided, append them as query params
    let fetchUrl = decoded;
    if (decoded.startsWith('https://api.rule34.xxx') && (RULE34_USER || RULE34_KEY)) {
      const u = new URL(decoded);
      if (RULE34_USER) u.searchParams.set('user', RULE34_USER);
      if (RULE34_KEY) u.searchParams.set('key', RULE34_KEY);
      fetchUrl = u.toString();
      console.log('[proxy] appended rule34 credentials to URL');
    }

    console.log('[proxy] fetching upstream:', fetchUrl);
    const r = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'e621-viewer-react/0.1 (+https://example.com)'
      }
    });
    console.log(`[proxy] upstream status: ${r.status}`);
    const contentType = r.headers.get('content-type') || 'application/octet-stream';
    res.set('content-type', contentType);
    // Stream or buffer depending on response type
    const buffer = await r.buffer();
    res.status(r.status).send(buffer);
  } catch (e) {
    console.error('[proxy] error', e && e.message ? e.message : e);
    res.status(500).json({ error: (e && e.message) || String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
