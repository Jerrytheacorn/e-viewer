const fetch = require('node-fetch');

async function test(url) {
  console.log('Testing direct ->', url);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'e621-viewer-react/0.1 (+https://example.com)' } });
    console.log('Status:', res.status);
    const ct = res.headers.get('content-type') || '';
    console.log('Content-Type:', ct);
    const txt = await res.text();
    console.log('Body length:', txt.length);
    console.log('Body preview:', txt.slice(0, 300));
  } catch (e) {
    console.error('Error:', e && e.message ? e.message : e);
  }
}

(async () => {
  await test('https://e621.net/posts.json?limit=1&tags=wolf');
  console.log('\n---\n');
  await test('https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=1&tags=wolf');
})();
