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

## Sprint 7 — Power Features ⚠️ PARTIAL
RM-046 through RM-050 actually built and verified. RM-051 through RM-057 were marked complete in error — never implemented.

### ✅ Actually built
| Ticket | Description |
|---|---|
| RM-046 | Named circle labels — prompt on pin, pill label on map, editable in pins list |
| RM-047 | Search by coordinates — regex detection, skips Nominatim |
| RM-048 | Dark/light mode toggle — CSS vars, localStorage persistence |
| RM-049 | Concentric circles — 2nd ring, independent sliders, green dashed style |
| RM-050 | Print / Save PDF — Mapbox Static Images API, landscape, auto-zoom |
| RM-056 | Clear button (×) in search bar |

### ❌ Marked done but never built
| Ticket | Description |
|---|---|
| RM-051 | Undo / redo — 10-state stack, Ctrl+Z/Y |
| RM-052 | Custom radius text input — type exact value, validates range |
| RM-053 | CSV address import — geocode up to 20 addresses, progress bar |
| RM-054 | Fullscreen mode — panel slides away, floating toolbar |
| RM-055 | Population estimate — WorldPop API, stats panel |
| RM-057 | Reset button — clears all pins, rings, settings, re-runs geolocation |

---

## Sprint 10 — Nav Redesign ✅ COMPLETE
Replaced left sidebar with Apple Maps–style FAB + popover interface. Map fills 100% viewport. 4 FABs, floating search bar, stats HUD, backdrop pattern, floating cancel pill for tool modes.

---

## Sprint 11 — QA, Branding & Domain ✅ COMPLETE
- Full QA pass on nav redesign — 4 bugs fixed (null guards, 2nd ring green, style active state, tile tracking)
- DrawRadius branding — splash screen, brand badge with About modal, Option A logo mark
- Leaflet attribution moved to About modal
- Domain connected: drawradius.com live on Vercel with SSL

---

## Sprint 12 — Unfinished Business ✅ COMPLETE
**Goal:** Build the tickets falsely marked done in Sprint 7, then move to drive time zones.

### All tickets built
| Ticket | Status | Description |
|---|---|---|
| RM-057 | ✅ | **Reset button** — circular arrow icon in Tools popover. Confirmation dialog. Clears all pins, 2nd ring, resets radius to 5mi, color to blue, opacity to 15%, tile to Street, clears search bar, re-runs geolocation. |
| RM-052 | ✅ | **Custom radius text input** — editable input next to big radius number. Type exact value, Enter to apply. Validates against unit min/max. Red flash if out of range. |
| RM-054 | ✅ | **Fullscreen mode** — button in Tools popover. Fullscreen API. FABs and HUD stay visible. Escape exits. |
| RM-051 | ✅ | **Undo / redo** — 10-state stack. Captures lat, lng, radiusVal, unit, color, opacity. Ctrl+Z / Ctrl+Y. Buttons in Tools popover. |
| RM-053 | ✅ | **CSV address import** — Import CSV button in Settings popover. Download template link. Geocodes via Nominatim at 1/sec. Progress indicator. Cap at 20 rows. |
| RM-055 | ⛔ | **Population estimate** — Removed. WorldPop API blocked by CORS from browser. Will re-add in Sprint 13 with backend proxy. |

### Sprint 12 QA fixes
| Fix | Description |
|---|---|
| RM-051 fix | Undo/redo was broken — pushUndo() captured state after change instead of before. Fixed with _lastState tracking and _skipUndo re-entry guard. |
| RM-053 fix | Added "Download template" link below Import CSV button. Generates drawradius-import-template.csv with header + 3 example addresses. |
| RM-055 fix | Removed WorldPop population estimate entirely — CORS blocks browser-side calls. HUD reverted to 7 columns. Will re-add with backend proxy in Sprint 13. |

---

## Sprint 13 — Drive Time Zones ✅ COMPLETE
**Goal:** Add drive time isochrone zones via OpenRouteService API as a global map mode.

### Shipped
| Ticket | Status | Description |
|---|---|---|
| RM-058 | ✅ | **Drive time zone** — ORS isochrone API, Radius/Drive time mode toggle, travel time slider (5–60 min), debounced fetch, generation counter for stale response handling |
| RM-059 | ✅ | **Walking and cycling modes** — 3 transport profiles (driving-car, foot-walking, cycling-regular), segmented control in popover |

### Prep work
- build.sh updated to inject `ORS_API_KEY` env var at deploy
- tools.js (512→347) and ui.js (482→399) split — `pins.js` created for pin management, undo/redo, CSV, reset, overlaps, concentric helpers
- `fetchIsochroneLayer()` shared helper in pins.js

### QA fixes
| Fix | Description |
|---|---|
| Center pin missing | `drawCenterMarker()` helper added — redraws blue dot after isochrone renders |
| Old isochrone persists | `removeIsochrone()` on slider input + `removeIsochrone()` post-await in `fetchIsochrone()` + generation counter to discard stale responses |
| Search in drivetime no-op | `applyResult()` and map click handler now check `radiusMode` and call `fetchIsochrone()` |
| Global mode switching | Mode toggle rebuilds all pin layers via `rebuildPinLayers()` — two-pass: remove all, then recreate sequentially |
| Pin rebuild race condition | `rebuildPinLayers()` uses two-pass approach: first removes all layers, then rebuilds each pin sequentially with for...of + await |
| Reset button missing | Restored in Tools popover — clears all pins/zones/settings, switches to radius mode, re-runs geolocation |
| Pinned vs active circle | Pinned circles now render dashed (dashArray: '6,4') with reduced opacity (×0.7) to distinguish from solid active circle. Pin list shows saved radius tooltip. |

### Not started (deferred to Sprint 14)
| Ticket | Description |
|---|---|
| RM-060 | Side-by-side comparison — radius circle + isochrone simultaneously |
| RM-061 | Isochrone per pinned location |
| RM-062 | Nearest place finder — Overpass API |

---

## Sprint 14 — (Planning)
TBD — discuss priorities with Mike.

---

## File Size Policy
- Hard cap: 400 lines per file
- Current files: `index.html`, `redesign.css`, `app.js`, `tools.js`, `pins.js`, `ui.js`, `config.js`
- Deploy after every ticket: `git add -A && git commit -m "feat: RM-0XX description" && git push origin main`
- New static files → add to `vercel.json` builds array
- `{ "handle": "filesystem" }` must appear before SPA catch-all in vercel.json routes

---

## Lessons Learned
- Claude Code sometimes marks tickets complete without implementing them — always verify in the actual codebase
- After any major refactor, re-audit all previous features still work
- Session docs are only reliable if Claude Code updates them based on actual code, not assumed progress
- Drive time mode must be treated as a global setting — all pins, active circle, and searches must respect the current mode
- Async API calls need generation counters to prevent stale responses from overwriting newer state
- File splits should happen before feature work, not after — avoids cascading merge conflicts
