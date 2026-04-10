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

## Sprint 13 — Drive Time Zones (Planned)
See SPRINT12.md for full ORS isochrone spec. OpenRouteService API key already obtained.

| Ticket | Description |
|---|---|
| RM-058 | Drive time zone — ORS isochrone API, driving profile, travel time slider |
| RM-059 | Walking and cycling modes — 3 transport profiles |
| RM-060 | Side-by-side comparison — radius circle + isochrone simultaneously |
| RM-061 | Isochrone per pinned location |
| RM-062 | Nearest place finder — Overpass API |

---

## File Size Policy
- Hard cap: 400 lines per file
- Current files: `index.html`, `redesign.css`, `app.js`, `tools.js`, `ui.js`, `config.js`
- Deploy after every ticket: `git add -A && git commit -m "feat: RM-0XX description" && git push origin main`
- New static files → add to `vercel.json` builds array
- `{ "handle": "filesystem" }` must appear before SPA catch-all in vercel.json routes

---

## Lessons Learned
- Claude Code sometimes marks tickets complete without implementing them — always verify in the actual codebase
- After any major refactor, re-audit all previous features still work
- Session docs are only reliable if Claude Code updates them based on actual code, not assumed progress
