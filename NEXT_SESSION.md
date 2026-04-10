# NEXT_SESSION.md — DrawRadius

## Session Closed ✅
**Date:** 2026-04-10
**Session:** Sprint 12 — Unfinished Business (fully closed)

---

## App is Live
- **Live:** https://drawradius.com
- **Vercel:** https://radius-map-psi.vercel.app
- **GitHub:** `haystackz12/radius-map`
- **Local:** `/Users/michaelhastings/Projects/radius-map`

---

## What Was Done This Session

### Sprint 12 features (all committed & pushed)
- **RM-057** Reset button — Tools popover, confirmation dialog, full state reset + geolocation re-run
- **RM-052** Custom radius text input — editable number input in Radius popover, validation with red flash
- **RM-054** Fullscreen mode — Fullscreen API toggle in Tools popover
- **RM-051** Undo/redo — 10-state stack, Ctrl+Z/Y, buttons in Tools popover
- **RM-053** CSV address import — file picker + download template link, 1 req/sec geocoding, 20 row cap
- **RM-055** Population estimate — built then removed (WorldPop CORS blocks browser calls)

### Sprint 12 QA fixes
- **RM-051 fix** — pushUndo captured state after change, not before. Fixed with _lastState + _skipUndo guard.
- **RM-053 fix** — Added download template link (drawradius-import-template.csv)
- **RM-055 fix** — Removed WorldPop entirely, reverted HUD to 7 columns

---

## File Sizes (action needed)
| File | Lines | Status |
|---|---|---|
| `app.js` | 351 | OK |
| `tools.js` | ~490 | **OVER 400 — needs split** |
| `ui.js` | ~500 | **OVER 400 — needs split** |
| `redesign.css` | 444 | **OVER 400 — needs split** |
| `index.html` | 152 | OK |

---

## Next Session — Sprint 13

### Step 1 — File splits (mandatory before new features)
- `tools.js` → split into `tools.js` + `pins.js` (pin/overlap/CSV logic)
- `ui.js` → split into `ui.js` + `popovers.js` (popover renderers + event delegation)
- `redesign.css` → split into `redesign.css` + `components.css` (modals, toast, splash, about)
- Update `index.html` script/link tags
- Update `vercel.json` builds array + ensure filesystem handler before catch-all

### Step 2 — RM-055 population estimate with backend proxy
- WorldPop API needs server-side proxy (Vercel serverless function or similar)
- Re-add HUD column when proxy is ready

### Step 3 — Drive time zones (RM-058 through RM-062)
- OpenRouteService API key already obtained
- See SPRINT.md Sprint 13 section for ticket details
- RM-058: ORS isochrone API, driving profile, travel time slider
- RM-059: Walking and cycling modes
- RM-060: Side-by-side radius + isochrone
- RM-061: Isochrone per pinned location
- RM-062: Nearest place finder (Overpass API)

---

## Critical Technical Notes

**Undo/redo implementation:**
- `_lastState` tracks the previous state; `pushUndo()` pushes it before updating to current
- `_skipUndo` flag prevents re-entry when `applyState()` calls `drawCircle()`
- Stack capped at 10 states; redo stack cleared on new actions

**Mapbox token (print feature):**
- Local: real token in config.js (gitignored local change)
- Vercel: `MAPBOX_TOKEN` env var → injected by build.sh at deploy
- Never commit real token — GitHub push protection blocks it

**Backdrop pattern:**
- `#popover-backdrop` at z-index 998, behind popovers (999) and FABs (1000)
- DO NOT add document-level click listener for closing popovers

**vercel.json:**
- `{ "handle": "filesystem" }` MUST appear before SPA catch-all route
- New .js/.css files must be added to builds array

---

## Repo Commands Reference
```bash
# Start session
cd /Users/michaelhastings/Projects/radius-map
git pull origin main

# Deploy
git add -A && git commit -m "feat: description" && git push origin main

# Local dev server (needed for OSM tiles)
npx serve . -p 3000
```
