# Circle Of Light

## Signup process

- `credentials: "include"` is required
- No verification is required yet
- JWT token based authentication

#### request

```json
POST http://localhost:8000/api/v1/signup HTTP/1.1
Content-Type: application/json

{
	"first_name": "test",
	"last_name": "test",
	"phone_number": "0987654321",
	"email": "something@gmail.com",
	"password": "#78sfsfASff"
}
```

#### Response

```json
{
  "message": "Success",
  "code": 200,
  "status": "OK"
}
```

## Get User Data

#### request

```json
GET http://localhost:8000/api/v1/me HTTP/1.1
Content-Type: application/json
Cookie: _access=eyJhbGciOiJIUzI1NiIsInR5
```

#### Response

```json
{
  "code": "387356",
  "first_name": "test",
  "last_name": "test",
  "phone_number": "0987654321",
  "email": "something@gmail.com"
}
```

## Login process

#### request

```json
POST http://localhost:8000/api/v1/login HTTP/1.1
Content-Type: application/json

{
	"code": "387356"
}
```

#### Response

```json
{
  "message": "Success",
  "code": 200,
  "status": "OK"
}
```

## Deployment (Render.com)

### Overview

The project now supports containerized deployment for both the Django API and the React UI. You can either:

1. Use two separate Render services (recommended):
   - API: Docker (uses `API/Dockerfile`)
   - UI: Static site (builds Vite and serves the `dist` folder)
2. Or run both as Docker services if you need custom Nginx tweaks.

### API Service (Docker)

Dockerfile: `API/Dockerfile`

Key runtime expectations:

- Port: 8000
- Entry script runs migrations automatically, then starts Gunicorn.
- Uses SQLite by default. For persistence across deploys, attach a Render Disk and set env var:
  - `SQLITE_PATH=/data/db.sqlite3`
  - Attach disk mounted at `/data` (configure in Render UI). The Dockerfile creates that path.

Essential environment variables (add in Render Dashboard):

```
DJANGO_SECRET_KEY=your-secret
JWT_SECRET_KEY=your-jwt-secret
TOKEN_ACCESS_NAME=_access
TOKEN_REFRESH_NAME=_refresh
TOKEN_ACCESS_LIFETIME=15
TOKEN_REFRESH_LIFETIME=10080  # 7 days in minutes
ENVIRONMENT=production
DEBUG=False
SQLITE_PATH=/data/db.sqlite3
```

Optional mail settings: `GOOGLE_EMAIL_SENDER, SMTP_APP_PASSWORD, SMTP_USERNAME, SMTP_SERVER, SMTP_PORT`.

### UI Service (Static Site Recommended)

Configure as a "Static Site" on Render:

- Build Command: `npm install && npm run build`
- Publish Directory: `UI/app/dist`
- Set env var if API is on a different domain:
  - `VITE_API_BASE_URL=https://<your-api-service>.onrender.com/api/v1`

If you prefer Docker (e.g., for custom headers), it uses `UI/dockerfile` and exposes port `80`.

### Cross-Origin / Cookies

The frontend uses `credentials: 'include'` for JWT cookies. Ensure both services share the same apex domain or configure CORS & cookie attributes (e.g. `SameSite=None; Secure`) if you later split domains. Currently no explicit CORS middleware is configured; requests will work if both services share protocol/domain.

### render.yaml (Optional Infrastructure as Code)

You can add a `render.yaml` at repo root to declare services so Render auto-detects them. See included example if present.

### Local Dev (Docker Compose)

`docker-compose.yml` can still be used locally:

```
docker compose up --build
```

API: http://localhost:8000/api/v1
UI: http://localhost:3000

### Troubleshooting

- 502 on API: check logs; ensure migrations ran (they run in entrypoint) and `DJANGO_SECRET_KEY` set.
- Static site missing API responses: confirm `VITE_API_BASE_URL` matches deployed API URL and includes `/api/v1`.
- Database resets: you forgot to attach a persistent disk or set `SQLITE_PATH`.

### Future Improvements

- Migrate to PostgreSQL (Render managed DB) using `DATABASE_URL` pattern.
- Add explicit CORS handling if separating domains.
- Add health endpoint (`/api/v1/health`) for Render health checks.
