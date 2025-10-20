# e621 Viewer (React)

A modern rewrite of the e-viewer app using React + TypeScript + Vite.

Quick start:

1. Install dependencies

```powershell
cd viewer-react
npm install
```

2. Run dev server

```powershell
npm run dev
```

Notes:
- e621 requires a proper User-Agent header. For CORS issues you may need a proxy.
- Keep your API key private; if you need to use an API key add it to the fetch headers in `src/services/api.ts`.

