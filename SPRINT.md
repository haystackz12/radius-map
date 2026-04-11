# SPRINT.md — DrawRadius (drawradius.com)

---

## Sprint 1 — Foundation ✅ COMPLETE
RM-001 through RM-012. Full foundation — map, search, radius, stats, export, dark UI, Vercel deploy, all session docs.

---

## Sprint 2 — Features ✅ COMPLETE
RM-013 through RM-020. Share link, reverse geocode, multiple circles, tile switcher, PNG export, radius presets, distance tool, mobile layout.

---

## Sprint 3 — QA Pass ✅ COMPLETE
RM-021 through RM-026. PNG export fix, copy confirmation toast, settings gear modal, header search bar, PNG centering fix, worldwide coverage header label.

---

## Sprint 4 — Polish & UX ✅ COMPLETE
RM-027 through RM-034. Smart geolocation, help modal, onboarding walkthrough, empty state, address labels on pins, fit circle button, keyboard shortcuts, feet unit.

---

## Sprint 5 — Data & Shareability ✅ COMPLETE
RM-035 through RM-040. Perimeter stat, about modal, elevation (Open-Meteo API), circle overlap shading, QR code, embed code.

---

## Sprint 6 — UX Refinements ✅ COMPLETE
RM-041 through RM-045. Recent searches, collapsible panel sections, active map style indicator, unit-aware range labels, location breadcrumb.

---

## Sprint 7 — Power Features ✅ COMPLETE
RM-046 through RM-057. Named circle labels, coordinate search, dark/light mode, concentric circles, print/PDF, undo/redo, custom radius input, CSV import, fullscreen, reset button, clear button.

---

## Sprint 10 — Nav Redesign ✅ COMPLETE
Full sidebar replaced with Apple Maps–style FAB + popover interface. Map fills 100% viewport. 4 FABs, floating search bar, stats HUD, backdrop pattern, floating cancel pill.

---

## Sprint 11 — QA, Branding & Domain ✅ COMPLETE
Full QA pass on nav redesign. DrawRadius branding — animated splash screen, brand badge, About modal. drawradius.com live with SSL.

---

## Sprint 12 — Unfinished Business ✅ COMPLETE
Built tickets falsely marked done in Sprint 7: undo/redo, custom radius input, CSV import with template, fullscreen, reset button. Removed population estimate (WorldPop CORS — deferred to Sprint 15).

---

## Sprint 13 — Drive Time Zones ✅ COMPLETE
Drive time isochrone zones via OpenRouteService API. Global Radius/Drive Time mode toggle. Three transport modes (Drive/Walk/Cycle). Generation counter for race conditions. Two-pass pin rebuild. Dashed pinned circles. drawradius.com live.

---

## Sprint 14 — Drive Time Extensions ✅ COMPLETE
**Goal:** Extend drive time with comparison mode, per-pin travel time display, and nearest place finder.

### Shipped
| Ticket | Status | Description |
|---|---|---|
| RM-060 | ✅ | **Side-by-side comparison** — "Show radius circle for comparison" checkbox in Drive Time mode. Dashed circle (dashArray: '8,4', opacity 0.5) overlays the isochrone. Auto-draws after each fetch, cleans up on mode switch. |
| RM-061 | ✅ | **Per-pin travel time display** — Pins store travelTime and transportMode. Pin list shows "15 min · 🚗" in drivetime mode, radius in radius mode. "Refresh all pins" button re-fetches all pin layers at current settings. |
| RM-062 | ✅ | **Nearest place finder** — "Find Nearest" section in Tools popover with 8 amenity types (Overpass API). Red marker + dashed line from center. 5km search radius, expands to 20km if empty. Name and distance in status bar. |

### Code housekeeping
- Removed unused `buildColorOptions()` from app.js
- Moved `showToolPill`/`hideToolPill` from ui.js to tools.js
- Moved `drawCompareCircle`/`removeCompareCircle` from app.js to pins.js
- All JS files under 400 lines

---

## Sprint 15 — Persistence & Data (Planned)
**Goal:** Give users a reason to come back. Saved maps, favorites, richer data.

### 🔲 IN QUEUE

| Ticket | Priority | Description |
|---|---|---|
| RM-063 | High | **Full URL state encoding** — Encode ALL state in share URL: center, radius, unit, color, opacity, mode, travel time, transport mode, all pins (lat, lng, name, radius/travelTime, color). Restoring from URL rebuilds the entire session. |
| RM-064 | High | **Saved maps (localStorage)** — "Save this map" button in Settings. Prompts for a name. Saves full state to localStorage. "My saved maps" list with restore and delete. Cap at 10 saved maps. |
| RM-065 | Medium | **Address favorites** — Star icon next to searched addresses. Favorites appear top of recent searches dropdown. One click to re-center. Cap at 10. |
| RM-066 | Medium | **Demographic overlay (US)** — Toggle in Style popover. Fetches population density by zip from Census API. Color-coded heat map layer. US only label. |
| RM-067 | Low | **Population estimate (retry)** — Re-implement via Vercel serverless function proxy to avoid WorldPop CORS. Function builds GeoJSON, calls WorldPop, returns result. Display in HUD. |

---

## File Size Policy
- Hard cap: 400 lines per file
- Deploy after every ticket: `git add -A && git commit -m "feat: RM-0XX description" && git push origin main`
- New static files → add to `vercel.json` builds + `{ "handle": "filesystem" }` before SPA catch-all
- ORS and Mapbox tokens → Vercel env vars + build.sh, never hardcoded

---

## Lessons Learned
- Claude Code sometimes marks tickets complete without implementing — always verify in actual codebase
- After major refactors, re-audit all previous features
- Async race conditions need generation counters, not just debouncing
- Drive time pin rebuilds must be sequential (for...of with await), not parallel
