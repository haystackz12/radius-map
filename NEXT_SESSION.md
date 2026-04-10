# NEXT_SESSION.md — Radius Map

## Session Closed ✅
**Date:** 2026-04-09
**Session:** 5 — Sprint 5 Data & Shareability (CLOSED)
**Next ticket:** RM-041 (recent searches history)

---

## App is Live
https://radius-map-psi.vercel.app

## Current State
- **Sprints 1–5 complete** — 40 tickets shipped (RM-001 through RM-040)
- No known bugs
- Full feature set: search, radius, pins, distance, tile switcher, export (JSON/PNG/QR/embed/share link), stats (area/perimeter/elevation), help, onboarding, keyboard shortcuts, about modal

---

## File Structure & Line Counts

| File | Lines | Purpose |
|---|---|---|
| `index.html` | 248 | Markup — header, panel, modals (settings/help/about), script tags |
| `style.css` | 383 | Base styles — layout, header, panel, forms, stats |
| `components.css` | 175 | UI components — buttons, tiles, pins, mobile drawer |
| `features.css` | 245 | Feature styles — modals, toast, onboarding, help, distance, empty state |
| `app.js` | 385 | Core — map, circle, radius, search, geocode, presets, colors, status, elevation |
| `tools.js` | 367 | Tools — distance, pins, export, modal, share, QR, embed, overlap geometry, keyboard shortcuts, onboarding |

All files under 400-line hard cap.

---

## Completed This Session
- **RM-035** — Perimeter stat: circumference (2πr) in selected unit, full-width card in stats grid
- **RM-036** — About modal: `i` button in header, credits for all data sources, GitHub link, v2.0
- **RM-037** — Elevation at center: open-elevation API, displays ft + m, "Unavailable" on failure
- **RM-038** — Circle overlap: amber intersection polygon computed via arc geometry (getBearing + destinationPoint)
- **RM-039** — QR code: qrcode.js from cdnjs, dark theme colors, generate + download as PNG
- **RM-040** — Embed code: copies `<iframe>` snippet with share URL, toast confirmation
- **refactor** — Moved overlap geometry from app.js to tools.js (400-line cap)

---

## Next Session — Sprint 6

### First ticket: RM-041 — Recent searches history
- Store last 8 searches in `localStorage` key `rm_recent_searches`
- Show as dropdown when search bar is focused (before typing)
- Each item clickable to re-search
- Clear button to reset history

### Full queue
1. RM-041 — Recent searches history
2. RM-042 — Collapsible panel sections
3. RM-043 — Active map style indicator
4. RM-044 — Radius presets show current unit (verify/fix)
5. RM-045 — Location breadcrumb on map

---

## Key Technical Notes
- Nominatim: `Accept-Language: en`, debounce ≥400ms, 1 req/sec limit
- Tile layers use `crossOrigin: true` for PNG export
- `leaflet-image` + `html2canvas` + `qrcode.js` loaded from cdnjs; guard with typeof checks
- Vercel: new static files must go in `vercel.json` builds array + filesystem handler before SPA catch-all
- Distance mode and click-to-center are mutually exclusive
- Unit conversion via `convertRadius(from, to, val)` in app.js — supports mi, km, ft
- Elevation: `fetchElevation(lat, lng)` called from `drawCircle()`, shows "Unavailable" on failure
- Overlap: `computeOverlaps()` called from `pinCurrent()` and `removePin()` in tools.js
- `initMap(skipInitialDraw)` — pass `true` when geolocation will run
- localStorage keys in use: `rm_onboarded`

## Repo
- **GitHub:** `haystackz12/radius-map`
- **Local:** `/Users/michaelhastings/Projects/radius-map`
- **Live:** https://radius-map-psi.vercel.app
