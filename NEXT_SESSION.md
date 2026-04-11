# NEXT_SESSION.md — DrawRadius

## Session Closed ✅
**Date:** 2026-04-10
**Session:** Sprint 14 — Drive Time Extensions (fully closed)

---

## App is Live
- **Live:** https://drawradius.com
- **Vercel:** https://radius-map-psi.vercel.app
- **GitHub:** `haystackz12/radius-map`
- **Local:** `/Users/michaelhastings/Projects/radius-map`

---

## What Was Done This Session

### Sprint 12 — Unfinished Business
Built 6 tickets falsely marked done in Sprint 7 (reset, custom radius input, fullscreen, undo/redo, CSV import, population estimate). QA fixes: undo/redo root cause, CSV template, WorldPop CORS removal.

### Sprint 13 — Drive Time Zones
RM-058/059: ORS isochrone API with 3 transport modes, global Radius/Drive Time mode toggle. File splits (tools.js + ui.js → pins.js). QA fixes: center pin, isochrone cleanup, global mode switching, sequential pin rebuild, generation counter, reset button, dashed pinned circles.

### Sprint 14 — Drive Time Extensions
- **RM-060** Side-by-side comparison — checkbox overlays dashed radius circle on isochrone
- **RM-061** Per-pin travel time — pins store travelTime/transportMode, "Refresh all pins" button
- **RM-062** Nearest place finder — 8 amenity types via Overpass API, red marker + dashed line

---

## Current File Structure

| File | Lines | Purpose |
|---|---|---|
| `index.html` | 161 | Markup — FABs, popovers, HUD, search bar, animated splash, about modal |
| `redesign.css` | 443 | All styles (over 400 — CSS split candidate) |
| `app.js` | 391 | Core — map, circle, isochrone fetch, radius, search, geocoding, tiles |
| `tools.js` | 393 | Tools — search, distance, click mode, elevation, export, QR, print, nearest place finder, tool pill |
| `pins.js` | 361 | Pins — CRUD, fetchIsochroneLayer, rebuildPinLayers, compare circle, undo/redo, reset, CSV, overlaps, concentric |
| `ui.js` | 397 | UI — FAB toggle, popover renderers, HUD, event delegation, keyboard shortcuts, splash, init |
| `config.js` | 5 | Mapbox + ORS API tokens (gitignored) |
| `build.sh` | 3 | Vercel build — injects MAPBOX_TOKEN and ORS_API_KEY |

---

## Critical Technical Notes

**Drive time mode (radiusMode):**
- Global: `'radius'` or `'drivetime'` — affects active circle, all pins, search, map clicks
- `rebuildPinLayers(newMode)` — two-pass sequential rebuild
- `fetchIsochroneLayer()` shared helper in pins.js
- Generation counter (`_isoGeneration`) discards stale responses
- `drawCenterMarker()` persists blue dot in both modes

**Compare circle (RM-060):**
- `showCompareCircle` boolean, `drawCompareCircle()`/`removeCompareCircle()` in pins.js
- Dashed circle at 50% opacity drawn after each isochrone fetch

**Per-pin travel time (RM-061):**
- Pin objects have optional `travelTime` and `transportMode` fields
- `renderPinList()` shows mode-appropriate meta text
- "Refresh all pins" calls `rebuildPinLayers(radiusMode)`

**Nearest place finder (RM-062):**
- `findNearest(amenityType)` in tools.js, `clearNearestResult()` cleans up
- Overpass API: 5km → 20km fallback, red marker + dashed line
- Reset button also calls `clearNearestResult()`

**API keys:** Vercel env vars → build.sh → config.js. Never hardcoded.

**vercel.json:** `{ "handle": "filesystem" }` before SPA catch-all.

---

## Next Session — Sprint 15

### Persistence & Data
| Ticket | Priority | Description |
|---|---|---|
| RM-063 | High | Full URL state encoding — all state in share URL, restore from URL |
| RM-064 | High | Saved maps (localStorage) — save/restore/delete, cap 10 |
| RM-065 | Medium | Address favorites — star icon, appears in recent searches |
| RM-066 | Medium | Demographic overlay (US) — Census API population density |
| RM-067 | Low | Population estimate — Vercel serverless proxy for WorldPop |

### Also consider
- CSS split (redesign.css at 443 lines)
- Mobile QA pass on drive time + nearest place features

---

## Repo Commands Reference
```bash
cd /Users/michaelhastings/Projects/radius-map
git pull origin main
git add -A && git commit -m "feat: description" && git push origin main
npx serve . -p 3000
```
