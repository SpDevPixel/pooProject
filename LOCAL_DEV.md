# Frontend Local and AWS Development

The frontend always calls `/api`.

- Vercel keeps using the rewrite in `vercel.json`, so deployed traffic goes to the AWS backend.
- `npm run dev` runs the Vite dev server and proxies `/api` to `http://localhost:8080`.
- `npm run dev:aws` runs the Vite dev server and proxies `/api` to `http://52.79.148.88`.

## Local API testing

```powershell
cd frontend
npm run dev
```

Use this when your local API server is already running on `http://localhost:8080`.

## AWS API testing

```powershell
cd frontend
npm run dev:aws
```

Use this when you want to test local frontend changes against the current AWS API server.
