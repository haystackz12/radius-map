# NEXT_SESSION.md — Radius Map

## Session Closed ✅
**Date:** 2026-04-09
**Session:** 2 — File split + first feature batch (CLOSED)
**Next ticket:** RM-014 (share link)

---

## App is Live
https://radius-map-psi.vercel.app

## Current State
- File split complete: `index.html` (markup), `style.css`, `app.js` — all under 400 lines
- Sprint 2 in progress: 3 of 8 tickets shipped
- No known bugs

---

## Completed This Session
- **refactor** — split single-file `index.html` into `index.html` + `style.css` + `app.js`
- **RM-018** — Radius presets (1/3/5/10/25), unit-aware, snaps slider and redraws
- **RM-019** — Distance tool: secondary click mode, two points, dashed polyline, mi+km label at midpoint. Mutually exclusive with click-to-center mode.
- **RM-020** — Mobile layout: panel becomes a bottom drawer below 768px with a drag handle (tap to open/close), map fills screen
- **hotfix** — `vercel.json` was missing `style.css` / `app.js` from `builds` and lacked a `filesystem` route handler, so the SPA catch-all rewrote them to HTML and `nosniff` killed them (symptom: black circle, no map). Fixed in `bde4f5d`. See CLAUDE.md → Deploy → "Adding new static files".

---

## Next Session — Start Here

### First ticket: RM-014 — Share link
- Encode state as URL params: `?lat=39.739&lng=-104.984&r=5&unit=mi`
- On page load, parse `URLSearchParams` and restore lat/lng/radius/unit before `initMap()` draws
- Add "Copy share link" button to the Export section in `index.html`
- Handler builds the URL from current state and writes to clipboard via `navigator.clipboard.writeText`
- Use `setStatus('Share link copied!', 'success')` for feedback

### Remaining Sprint 2 queue (in order)
1. RM-014 — Share link (next)
2. RM-015 — Reverse geocode on click
3. RM-013 — Multiple circles / pinned locations
4. RM-016 — Tile layer switcher (Street / Satellite / Topo)
5. RM-017 — Save as PNG

---

## Key Technical Notes
- Nominatim reverse endpoint: `https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}` — always send `Accept-Language: en`, debounce ≥400ms
- Esri satellite tiles: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
- OpenTopoMap tiles: `https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png`
- For PNG export: try `leaflet-image` from cdnjs first; fall back to `html2canvas` if canvas taint issues arise
- Distance mode and click-to-center mode are mutually exclusive — toggling one disables the other (see `toggleDistanceMode` / `toggleClickMode` in `app.js`)
- Mobile drawer toggled via `.panel.open` class on `<768px` — `toggleDrawer()` in `app.js`

## Repo
- **GitHub:** `haystackz12/radius-map`
- **Local:** `/Users/michaelhastings/Projects/radius-map`
- **Live:** https://radius-map-psi.vercel.app
