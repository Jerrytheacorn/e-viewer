
## One-command development

To start both the proxy and the frontend in one step, run:

```
npm run dev:all
```

This will launch both the proxy (for CORS and User-Agent) and the Vite dev server. Open the URL shown in the terminal (usually http://localhost:5173 or 5174).

If you want to customize the proxy URL, set `.env` as before:

```
VITE_PROXY_URL=http://localhost:3001/proxy?url=
```

When deploying to production, prefer a server-side proxy or configure CORS properly on your backend. Do NOT expose credentials or API keys in the frontend.

Rule34 credentials (proxy)
--------------------------------
If you want the proxy to attach Rule34 credentials for authenticated API access, set the following environment variables when starting the proxy (do NOT put these in the frontend `.env`):

```
RULE34_USER=your_user
RULE34_KEY=your_key
```

Start the proxy with those env vars in the same environment, for example (PowerShell):

```powershell
$env:RULE34_USER='your_user'; $env:RULE34_KEY='your_key'; npm run proxy
```

The proxy will append `user` and `key` query parameters to `api.rule34.xxx` requests when these variables are present.
