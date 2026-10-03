# RobloxHacksForums

**Fictional community / demo project** for researching modern forum UI, backend APIs, Roblox public API integration, and anonymous comment systems.

> **⚠️ IMPORTANT DISCLAIMER**  
> This project does **not** verify whether an exploit actually works against Roblox or a specific Roblox account.  
> Compatibility results are **simulated / demo data** only.  
> RobloxHacksForums is a fictional community/demo project. Exploit compatibility results are simulated and should not be treated as verified security or compatibility information.

---

## Architecture

```
Browser (HTML/CSS/JS)
        |
        +------ PHP API  ------ SQLite (forum.db)
        |         comments, threads, search proxy, rate limit
        |
        +------ Python (Flask) API
                  |
                  +-- Roblox Public APIs (users, thumbnails, presence)
                  +-- Compatibility simulation
                  +-- Exploit list / player cache
```

- **Frontend**: pure HTML + CSS + vanilla JS (dark mode, responsive, toasts, skeletons, modals)
- **PHP**: comments, threads, search proxy, basic rate limiting, XSS/SQL injection protection
- **Python**: Roblox public API client, player lookup, simulated compatibility, SQLite helpers
- **Database**: SQLite (`database/forum.db`) – no external MySQL required

---

## Project Structure

```
RobloxHacksForums/
├── frontend/
│   ├── index.html
│   ├── forum.html
│   ├── player.html
│   ├── search.html
│   ├── css/style.css
│   └── js/ (app.js, player.js, forum.js, comments.js)
├── php/
│   ├── config.php
│   ├── comments.php
│   ├── threads.php
│   ├── player.php
│   └── search.php
├── python/
│   ├── app.py
│   ├── roblox_api.py
│   ├── compatibility.py
│   ├── database.py
│   └── requirements.txt
├── database/
│   └── forum.db          (created on first run)
├── README.md
└── LICENSE
```

---

## Requirements (Windows)

- **Python 3.10+** (https://www.python.org/downloads/) – check “Add to PATH”
- **PHP 8.x** (https://windows.php.net/download/) – or XAMPP / Laragon
- Modern browser (Chrome / Edge / Firefox)

---

## Setup & Run on Windows

### 1. Clone / extract the project

```powershell
cd path\to\RobloxHacksForums
```

### 2. Python backend

```powershell
cd python
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Initialize database + seed demo data
python database.py

# Start Flask API (default port 5000)
python app.py
```

Leave this terminal open. You should see:
```
Database initialized at ...\database\forum.db
 * Running on http://127.0.0.1:5000
```

### 3. PHP backend

Open a **new** terminal:

**Option A – PHP built-in server (recommended for demo)**

```powershell
cd path\to\RobloxHacksForums
php -S 127.0.0.1:8080
```

Then open: http://127.0.0.1:8080/frontend/index.html

**Option B – XAMPP / Laragon**

- Copy the whole `RobloxHacksForums` folder into `htdocs` (or Laragon `www`)
- Start Apache
- Browse to `http://localhost/RobloxHacksForums/frontend/`

> PHP endpoints live under `/php/*.php`. The frontend is configured with:
> ```js
> window.PHP_API_BASE = '../php';
> window.PYTHON_API_BASE = 'http://127.0.0.1:5000';
> ```

### 4. Verify

1. Home page loads with dark theme and recent threads.
2. **Player Lookup** → enter a real username (e.g. `Roblox`) → should show public profile data from Roblox APIs.
3. **Compatibility Checker** → fill any values → receive a **SIMULATED** status badge.
4. **Forum** → open a thread → post an anonymous comment (stored in SQLite).
5. **Search** → search for a username or “ExampleExecutor”.

---

## API Endpoints

### Python (port 5000)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET/POST | `/api/player?username=` or `?user_id=` | Real Roblox public lookup |
| POST | `/api/compatibility` | Simulated compatibility result |
| GET | `/api/exploits` | List demo exploit records |
| GET | `/api/search?q=` | Unified search (player + threads + exploits) |

### PHP

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/php/comments.php` | List / create anonymous comments |
| GET/POST | `/php/threads.php` | List / view / create threads |
| GET | `/php/player.php` | Proxy to Python player lookup |
| GET | `/php/search.php?q=` | Proxy search + local fallback |

---

## Security notes (demo level)

- Input sanitization + `htmlspecialchars` before render (XSS mitigation)
- Prepared statements (SQL injection protection)
- Username forced to `Anonymous` on comments – client cannot spoof names
- Simple IP + endpoint rate limiting
- No Roblox credentials stored or requested
- CORS enabled for local development only

This is **not** production-hardened. Do not expose to the public internet without additional hardening.

---

## Simulation system

- Compatibility statuses: `SIMULATED`, `UNKNOWN`, `NOT TESTED`, `DEMO PASS`, `DEMO FAIL`
- Results are deterministic per input combination (hash-based) but **purely fictional**
- Exploit database rows are seeded with `is_demo = 1`
- Demo users are prefixed `[DEMO]` or `[SIMULATION]`

---

## Limitations

- Presence / avatar data depends on public Roblox endpoints and may be incomplete
- Rate limits of Roblox public APIs apply
- No real authentication / user accounts
- No real exploit testing of any kind
- SQLite is single-file – fine for demo, not for high concurrency

---

## License

MIT – see [LICENSE](LICENSE)

---

**Again:**  
This project does not verify whether an exploit actually works against Roblox or a specific Roblox account. Compatibility results are simulated/demo data.

---

## Deploy to GitHub Pages (static demo)

GitHub Pages **cannot** run PHP or Python. A fully static version lives in the `docs/` folder:

- Player lookup → browser → public Roblox APIs (CORS proxy fallback)
- Forum / comments → **localStorage** in the visitor’s browser
- Compatibility → pure client-side simulation

### Steps

1. Create a new GitHub repository (e.g. `RobloxHacksForums`).
2. Upload the whole project (or at least the `docs/` folder).
3. **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: `main` (or `master`)
   - Folder: **/docs**
4. Save. After 1–2 minutes the site is at:

```
https://YOUR_USERNAME.github.io/RobloxHacksForums/
```

### Local preview of static build

```powershell
cd RobloxHacksForums\docs
# Python
python -m http.server 5500
# or PHP
php -S 127.0.0.1:5500
```

Open http://127.0.0.1:5500

### Limitations on GitHub Pages

| Feature | Behavior |
|---------|----------|
| Player lookup | Real public Roblox data (may need CORS proxy) |
| Compatibility | Simulated only |
| Forum / comments | Per-browser localStorage (not shared between users) |
| PHP / Python APIs | Not available |

For full shared SQLite backend, run the PHP + Python stack locally as described above.
