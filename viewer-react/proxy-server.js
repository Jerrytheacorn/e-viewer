const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = 3001;

const ALLOWED_HOSTS = [
  'https://e621.net',
  'https://api.rule34.xxx',
  'https://rule34.paheal.net',
  'https://rule34.us'
];

// Optional credentials for different platforms: set environment variables
const CREDENTIALS = {
  r34: {
    user: process.env.RULE34_USER,
    key: process.env.RULE34_KEY
  },
  paheal: {
    user: process.env.PAHEAL_USER,
    key: process.env.PAHEAL_KEY
  },
  r34us: {
    user: process.env.R34US_USER,
    key: process.env.R34US_KEY
  }
};

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

    // Determine which platform and add credentials if available
    let fetchUrl = decoded;
    let platformCreds = null;
    
    if (decoded.startsWith('https://api.rule34.xxx')) {
      platformCreds = CREDENTIALS.r34;
    } else if (decoded.startsWith('https://rule34.paheal.net')) {
      platformCreds = CREDENTIALS.paheal;
    } else if (decoded.startsWith('https://rule34.us')) {
      platformCreds = CREDENTIALS.r34us;
    }
    
    // Append credentials if they exist and aren't already in the URL
    if (platformCreds && (platformCreds.user || platformCreds.key)) {
      const u = new URL(decoded);
      if (platformCreds.user && !u.searchParams.has('user')) {
        u.searchParams.set('user', platformCreds.user);
      }
      if (platformCreds.key && !u.searchParams.has('key')) {
        u.searchParams.set('key', platformCreds.key);
      }
      fetchUrl = u.toString();
      console.log('[proxy] appended credentials to URL');
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
  console.log('Configured credentials:');
  console.log('  Rule34.xxx:', CREDENTIALS.r34.user ? '✓' : '✗');
  console.log('  Rule34 Paheal:', CREDENTIALS.paheal.user ? '✓' : '✗');
  console.log('  Rule34.us:', CREDENTIALS.r34us.user ? '✓' : '✗');
});