# CLAUDE.md — Radius Map

## Project Overview
**Radius Map** is a single-page web tool that lets users draw a configurable radius circle around any address on an interactive map. Built with Leaflet.js + OpenStreetMap. Hosted on Vercel. No backend, no API keys, no database.

## Repo
- **GitHub:** `haystackz12/radius-map`
- **Live URL:** `https://radius-map.vercel.app` (or assigned Vercel URL)
- **Local:** `/Users/michaelhastings/Projects/radius-map`

## Stack
| Layer | Technology |
|---|---|
| Map engine | Leaflet.js 1.9.4 (cdnjs) |
| Tiles | OpenStreetMap (tile.openstreetmap.org) |
| Geocoding | Nominatim (nominatim.openstreetmap.org) |
| Hosting | Vercel (static) |
| Build | None — single HTML file |

## Architecture
This is intentionally a **single-file application** (`index.html`). All HTML, CSS, and JS live in one file. There is no build step, no npm, no bundler.

**Hard rules:**
- `index.html` must stay under **400 lines**. If it grows past that, split CSS into `style.css` and JS into `app.js`.
- CSS variables only — no hardcoded hex colors in style rules (hex is allowed in JS for the color swatches array and Leaflet circle options).
- No external dependencies beyond Leaflet (cdnjs) and Google Fonts.
- Nominatim API: always include `Accept-Language: en` header. Never exceed 1 request/second (debounce is set to 400ms).
- OpenStreetMap tile policy: tiles only work from HTTP/HTTPS origins (not `file://`). Vercel hosting resolves this.

## Deploy
```bash
git add -A && git commit -m "your message" && git push origin main
```
Vercel auto-deploys on every push to `main`. No build command. Output directory: `/` (root).

## Session Protocol
Always read SPRINT.md at the start of a session to understand current tickets.
Always update NEXT_SESSION.md at the end of a session before closing.

## Key Files
| File | Purpose |
|---|---|
| `index.html` | Entire application |
| `CLAUDE.md` | This file — project rules |
| `SPRINT.md` | Active sprint tickets |
| `NEXT_SESSION.md` | State handoff between sessions |
| `USER_GUIDE.md` | End-user documentation |
| `vercel.json` | Vercel config (headers, rewrites) |
