# NEXT_SESSION.md — Radius Map

## Session Closed ✅
**Date:** 2026-04-10
**Session:** 10 — Nav Redesign (Sprint 10) + extensive QA

---

## App is Live
- **Vercel:** https://radius-map-psi.vercel.app
- **GitHub:** `haystackz12/radius-map`
- **Local:** `/Users/michaelhastings/Projects/radius-map`

---

## Current State
- Sprints 1–10 complete
- Nav redesign shipped — Apple Maps FAB + popover UI, map fills full viewport
- All core features working: search, radius, pins, distance, tile switcher, print, stats, elevation, QR, embed, share
- Known working: print with all pins (capped at 4), elevation via Open-Meteo, floating cancel pill for tool modes
- No known critical bugs as of session close

---

## Current File Structure

| File | Purpose |
|---|---|
| `index.html` | Markup — FABs, popovers, stats HUD, floating search bar, hidden legacy inputs for JS compatibility |
| `redesign.css` | All styles for new nav — FABs, popovers, HUD, search bar, satellite theme, responsive |
| `app.js` | Core — map init, circle draw, radius, search, geocoding, tile layers, presets, colors, status |
| `tools.js` | Tools — distance mode, pins, export (share/coords/QR/JSON/embed), elevation (Open-Meteo), reverse geocode, breadcrumb, recent searches, print |
| `ui.js` | FAB toggle, 4 popover renderers (radius/tools/style/settings), HUD compute + update, event delegation, backdrop, floating pill |
| `config.js` | Mapbox token — placeholder committed, real token in gitignored local change |
| `build.sh` | Vercel build script — injects MAPBOX_TOKEN env var into config.js at deploy time |

---

## Critical Technical Notes

**Mapbox token (print feature):**
- Local: run `sed -i '' 's/REPLACE_ME/YOUR_TOKEN/' config.js` after every `git pull`
- Vercel: token set as environment variable `MAPBOX_TOKEN` in Vercel dashboard → injected by build.sh
- Never commit real token — GitHub push protection will block it

**Backdrop pattern (popovers):**
- `#popover-backdrop` div sits at z-index 998, behind popovers (999) and FABs (1000)
- When popover opens → backdrop shows. Clicking backdrop → closeAll()
- When Measure/Set Center activated → backdrop hides so map clicks pass through
- DO NOT add a document-level click listener to close popovers — this was the root cause of the detached DOM bug

**userHasSearched flag:**
- Set to true in applyResult(), map click handler, coordinate detection
- detectLocation() checks this flag before overwriting currentLat/currentLng
- Prevents geolocation race condition from snapping circle away from searched location

**vercel.json:**
- `{ "handle": "filesystem" }` MUST appear before SPA catch-all route
- Any new .js or .css file must be added to the builds array
- Removing this causes 404 on static assets (past bug that broke the app)

**Event delegation pattern:**
- All popover button clicks handled via event delegation on popover containers
- renderPopover() rebuilds innerHTML — listeners on child elements are lost
- Listeners on the CONTAINER survive innerHTML changes — this is why delegation works
- disableMapPropagation() called after every renderPopover() to prevent Leaflet intercepting slider drags

**Distance mode 400ms guard:**
- handleDistanceClick() ignores clicks within 400ms of mode activation
- Prevents the button click itself from registering as first measurement point

**Elevation:**
- API: `https://api.open-meteo.com/v1/elevation?latitude={lat}&longitude={lng}`
- Called from drawCircle() → fetchElevation() in tools.js
- updateHUD() called again after elevation resolves so HUD shows real value
- HUD reads ft value from elevation-box textContent via regex `/([\d,]+)\s*ft/`

**Print:**
- Mapbox Static Images URL — active circle + up to 4 pinned circles
- 32-point polygon per circle (reduced from 64 to stay under URL limit)
- auto zoom fits all circles in viewport
- Opens new tab → img onload → window.print() → window.close()

---

## Next Session — Sprint 11

### Step 1 — QA pass first
Before any new features, verify the Sprint 10 acceptance criteria in RADIUS_MAP_NAV_REDESIGN_v2.md. Check every item on the list against the live site.

### Step 2 — Fix any remaining issues from QA

### Step 3 — Plan Sprint 11 features
Candidates (discuss with Mike before committing):
- Drive time zones (Sprint 9 plan — needs OpenRouteService API key)
- Undo/redo (RM-051)
- CSV address import (RM-053)
- Fullscreen mode (RM-054)
- Population estimate via WorldPop (RM-055)
- drawradius.com custom domain setup

---

## Custom Domain
`drawradius.com` purchased on Namecheap. Not yet connected to Vercel.

To connect:
1. `vercel domains add drawradius.com`
2. Add DNS records Vercel provides to Namecheap Advanced DNS
3. SSL auto-provisioned by Vercel

---

## Repo Commands Reference
```bash
# Start session
cd /Users/michaelhastings/Projects/radius-map
git pull origin main
sed -i '' 's/REPLACE_ME/YOUR_MAPBOX_TOKEN/' config.js

# Deploy
git add -A && git commit -m "feat: description" && git push origin main

# Local dev server (needed for OSM tiles)
npx serve . -p 3000
```
