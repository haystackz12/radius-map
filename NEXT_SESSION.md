# NEXT_SESSION.md — Radius Map

## Session Closed
**Date:** 2026-04-09
**Session:** 1 — Foundation + Project Setup

---

## App is Live
https://radius-map-psi.vercel.app

## Current State
- `index.html` — single-file app, ~245 lines, fully working
- OSM tiles working correctly from Vercel
- No known bugs
- All session docs in place
- Vercel auto-deploy connected to `main` branch on `haystackz12/radius-map`

---

## Sprint 2 Kickoff Instructions

### Step 1 — File split (do this before any features)
`index.html` will exceed 400 lines during Sprint 2. Split it at the top of the session:

```
index.html   → markup only (link to style.css and app.js)
style.css    → all <style> content extracted
app.js       → all <script> content extracted
```

Update `index.html` to reference:
```html
<link rel="stylesheet" href="style.css">
<script src="app.js" defer></script>
```

Commit the split before touching any features:
```bash
git add -A && git commit -m "refactor: split index.html into style.css + app.js"
```

### Step 2 — Work tickets in order
See SPRINT.md. Order: RM-018 → RM-014 → RM-015 → RM-013 → RM-016 → RM-017 → RM-019 → RM-020

Push after each ticket:
```bash
git add -A && git commit -m "feat: RM-0XX description" && git push origin main
```

---

## Key Technical Notes
- Nominatim reverse geocode endpoint: `https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}`
- Esri satellite tiles: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
- OpenTopoMap tiles: `https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png`
- For share links: use `URLSearchParams` to read/write — no library needed
- For PNG export: try `leaflet-image` from cdnjs first; fall back to `html2canvas` if canvas taint issues arise
- Nominatim rate limit: 1 req/sec — debounce at 400ms, do not lower

## Repo
- **GitHub:** `haystackz12/radius-map`
- **Local:** `/Users/michaelhastings/Projects/radius-map`
- **Live:** https://radius-map-psi.vercel.app
