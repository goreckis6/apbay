# APKBAY

A website for free MOD APK games and premium apps for Android. Built with Next.js 16, Prisma, SQLite, and Tailwind CSS.

## Features

- **Homepage** - News, Essential Apps, Editor's Choice, Games Mod - Latest, Premium Apps - Latest
- **Games & Apps** - Browse by category with detail pages, category sidebar
- **News** - Articles and news
- **Admin Panel** - Full CRUD for games, apps, articles, and categories
- **Responsive** - Mobile-friendly design

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Prisma** + SQLite
- **Tailwind CSS**

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Setup database (already done if you ran seed)

```bash
npx prisma migrate dev
npm run db:seed
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Admin Panel

Go to [http://localhost:3000/admin](http://localhost:3000/admin) to manage content.

**Note:** The admin panel has no authentication. For production, add auth and protect `/admin/*` routes.

## Project Structure

```
app/
├── admin/           # Admin panel
│   ├── entries/     # Games & Apps CRUD
│   ├── articles/    # Articles CRUD
│   └── categories/  # Categories
├── api/             # API routes
├── games/           # Games listing & detail
├── apps/            # Apps listing & detail
├── articles/        # Changelog
└── components/      # Layout components
```

## Database Schema

- **Entry** - Games and apps (slug, title, type, version, size, modInfo, etc.)
- **Category** - Genres for games/apps (Action, Arcade, etc.)
- **Article** - Articles and news for the changelog

## Adding New Content

1. Go to admin panel
2. Add categories first (Games > Action, Apps > Social, etc.)
3. Add games and apps with all metadata
4. Add articles for the changelog

Use image URLs for banners and icons (e.g., placeholder.com or your CDN).

## Production deploy (VPS z ytdown)

Ten projekt jest przygotowany do współdzielenia VPS z **ytdown** (`/opt/ytdown`, Caddy na `:80`/`:443`).

| Co | Wartość |
|---|---|
| Katalog na VPS | `/opt/apkbay` |
| Port aplikacji | `127.0.0.1:8081` → kontener `:3000` |
| Domena | `aphbay.com` (secret `DOMAIN` w GitHub) |
| HTTPS | Wspólny Caddy ytdown (`site-caddy`) |
| Baza | SQLite: `/opt/apkbay/data/prod.db` |
| Autostart | `systemd` → `apkbay.service` |
| Workflow | `.github/workflows/deploy.yml` |

### Architektura (bez konfliktu portów)

```
Internet → :80/:443 → Caddy (ytdown, site-caddy)
                          ├── yts.cool      → 127.0.0.1:8080  (ytdown)
                          └── aphbay.com    → 127.0.0.1:8081  (ten projekt)
```

APKBAY **nie** uruchamia własnego Caddy — `deploy/scripts/merge-caddy.sh` dopisuje blok domeny do `/opt/ytdown/deploy/caddy/Caddyfile`.

### Pierwsze wdrożenie na serwerze

1. Sklonuj/rsync repo do `/opt/apkbay`
2. Jednorazowo (root): `sudo bash deploy/scripts/server-setup.sh`
3. Opcjonalnie sekrety Ollama: `/opt/apkbay/data/.env.secrets`
4. Deploy: push na `main` albo ręcznie `DOMAIN=aphbay.com ./deploy/scripts/deploy.sh`

### GitHub Actions — secrets

| Secret | Przykład |
|---|---|
| `SSH_HOST` | `167.233.112.233` |
| `SSH_USER` | użytkownik SSH |
| `SSH_KEY` | klucz prywatny |
| `DOMAIN` | `aphbay.com` |

### Czego nie robić (ochrona ytdown)

- Nie kasuj `/opt/ytdown/backend/data/`
- Nie uruchamiaj `docker compose down -v` w ytdown
- Nie binduj APKBAY na `:8080`, `:80` ani `:443`
- rsync APKBAY idzie tylko do `/opt/apkbay/`
