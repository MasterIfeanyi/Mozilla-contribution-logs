# Firefox Contribution Tracker

A minimal, production-ready web app to log and display Mozilla Firefox codebase contributions.

---

## Project Structure

```
firefox-tracker/
├── netlify/
│   └── functions/
│       ├── patches-get.js      # GET /patches (public)
│       └── patches-admin.js    # POST, PATCH, DELETE /patches (protected)
├── public/
│   ├── index.html              # Public contribution log
│   └── admin/
│       └── index.html          # Admin interface (login-gated)
├── patches.json                # Data store
├── netlify.toml                # Netlify config
├── package.json
└── README.md
```

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Create a `.env` file at the project root (never commit this):

```
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_secure_password
```

### 3. Run locally

```bash
npx netlify dev
```

This starts a local server at `http://localhost:8888`.

- Public view: `http://localhost:8888/`
- Admin: `http://localhost:8888/admin`

---

## Netlify Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOU/firefox-tracker.git
git push -u origin main
```

### 2. Connect to Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **Add new site → Import an existing project**
3. Connect your GitHub repository
4. Build settings (auto-detected from `netlify.toml`):
   - **Publish directory:** `public`
   - **Functions directory:** `netlify/functions`

### 3. Set environment variables on Netlify

In your Netlify site dashboard:

**Site configuration → Environment variables → Add variable**

| Key              | Value                  |
|------------------|------------------------|
| `ADMIN_USERNAME` | your chosen username   |
| `ADMIN_PASSWORD` | your chosen password   |

### 4. Deploy

Netlify auto-deploys on every push to `main`. Or trigger manually from the dashboard.

---

## API Endpoints

| Method | Path                              | Auth     | Description              |
|--------|-----------------------------------|----------|--------------------------|
| GET    | `/.netlify/functions/patches-get` | None     | Returns all patches      |
| POST   | `/.netlify/functions/patches-admin` | Basic  | Creates a new patch      |
| PATCH  | `/.netlify/functions/patches-admin?id=<id>` | Basic | Edits a patch  |
| DELETE | `/.netlify/functions/patches-admin?id=<id>` | Basic | Deletes a patch|

Authentication uses HTTP Basic Auth. Credentials are validated server-side against environment variables — never exposed to the frontend.

---

## Data Model

`patches.json` stores an array of patch objects:

```json
{
  "id": "1746000000000",
  "title": "Fix memory leak in WebRTC handler",
  "description": "Full description of the bug and fix.",
  "link": "https://phabricator.services.mozilla.com/D12345",
  "createdAt": "2025-04-20T10:30:00.000Z"
}
```

---

## Important Notes on Data Persistence

Netlify's serverless functions run in ephemeral containers — **writes to `patches.json` will not persist between deploys** on a standard Netlify setup, since the filesystem resets.

**For a free, persistent solution, migrate data to one of:**

- **[Netlify Blobs](https://docs.netlify.com/blobs/overview/)** — Netlify's own key-value store, free tier, no extra setup
- **[PlanetScale](https://planetscale.com/)** — free MySQL (hobby tier)
- **[Supabase](https://supabase.com/)** — free PostgreSQL + REST API
- **[Fauna](https://fauna.com/)** — serverless database, free tier

The function files are structured to make this migration straightforward — replace `readPatches()` and `writePatches()` with your store's SDK calls.

For low-volume personal use (a few writes per week), the JSON file approach works fine during local dev and testing.

---

## Security

- Admin credentials are stored only in environment variables
- Auth is validated server-side on every protected request
- Basic Auth credentials are sent over HTTPS (never plaintext in production)
- Admin page has `X-Robots-Tag: noindex` to discourage crawling
- No credentials are ever present in frontend code
