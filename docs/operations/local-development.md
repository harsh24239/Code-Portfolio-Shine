# Running the portfolio locally

Install dependencies in both `backend` and `frontend` with `npm ci`.

## Backend with saved data

Create a private `backend/.env` from `backend/.env.example`. Set `NODE_ENV=development`, `PORT=5050`, and `ALLOWED_ORIGIN=http://localhost:3000,http://127.0.0.1:3000`. Supply your own `MONGO_URI`, session secret, MFA encryption key, and admin credentials. Never paste production secrets into chat or commit the file. Keep the existing MFA key when accessing a database with enrolled MFA accounts.

Run `npm run dev` inside `backend`. Check `http://localhost:5050/health` and open `http://localhost:5050/admin` for the admin panel. Port 5000 is commonly occupied by AirPlay on macOS.

The server intentionally refuses to start without MongoDB. An explicitly temporary preview can use `NODE_ENV=development ALLOW_IN_MEMORY_FALLBACK=true npm run dev`. This serves defaults; admin changes in that mode are lost on restart and do not recover your saved portfolio.

## Frontend

Run `npm run dev` inside `frontend` and open `http://localhost:3000`. No frontend environment file is needed locally: `/api` is proxied to port 5050. If the backend uses another port, set `API_PROXY_TARGET` in `frontend/.env.local`. An explicitly set `VITE_API_URL` bypasses that proxy.

## Vercel and Render

Set `VITE_API_URL=https://code-portfolio-backend.onrender.com` in Vercel before building. On Render, `ALLOWED_ORIGIN` must contain the exact active frontend origin, currently `https://codeinshadows.vercel.app`. Multiple origins are comma-separated. Changing `VITE_API_URL` requires rebuilding the frontend. Changes to Render environment variables require restarting/redeploying the backend.

Use `/health` as the Render health check path. A successful HTML response from the admin page does not prove that MongoDB is connected. A temporary database disconnection should produce HTTP 503 until the driver reconnects; the backend now restores readiness on the connection's `connected` event.

If live data cannot load, the frontend keeps its built-in content, retries for a waking backend, and exposes a retry action in the footer. It must not claim an operational connection after failed requests.
