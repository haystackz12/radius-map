# SPRINT.md — Radius Map

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
RM-046 through RM-057 + multiple QA fixes.

| Ticket | Description |
|---|---|
| RM-046 | Named circle labels — prompt on pin, pill label on map, editable in pins list |
| RM-047 | Search by coordinates — regex detection, skips Nominatim |
| RM-048 | Dark/light mode toggle — CSS vars, localStorage persistence |
| RM-049 | Concentric circles — 2nd ring, independent sliders, green dashed style |
| RM-050 | Print / Save PDF — Mapbox Static Images API, landscape, auto-zoom |
| RM-051 | Undo / redo — 10-state stack, Ctrl+Z/Y, header buttons |
| RM-052 | Custom radius text input — type exact value, validates range |
| RM-053 | CSV address import — geocode up to 20 addresses, progress bar |
| RM-054 | Fullscreen mode — panel slides away, floating toolbar |
| RM-055 | Population estimate — WorldPop API, stats panel |
| RM-056 | Clear button (×) in search bar |
| RM-057 | Reset button — clears all pins, rings, settings, re-runs geolocation |
| QA fixes | userHasSearched race condition fix, address comma formatting, print centering (multiple iterations), elevation API switch to Open-Meteo, floating cancel pill for measure/set-center modes |

**Export simplification:** Removed Save as PNG and all leaflet-image/html2canvas code. Print = Mapbox Static Images → browser print dialog → Save as PDF.

---

## Sprint 8 — Power User Features ✅ COMPLETE
RM-051 through RM-055 (noted above, shipped during Sprint 7 session).

---

## Sprint 9 — Drive Time & Routing 📋 PLANNED
See SPRINT9_ADDITIONS.md for full specs.

| Ticket | Description |
|---|---|
| RM-058 | Drive time zone (isochrone) — OpenRouteService API, driving profile |
| RM-059 | Walking and cycling isochrones — 3 transport mode profiles |
| RM-060 | Side-by-side comparison — radius circle + drive time zone simultaneously |
| RM-061 | Isochrone per pinned location |
| RM-062 | Nearest place finder — hospital, grocery, gas station via Overpass API |

Requires free OpenRouteService API key at openrouteservice.org.

---

## Sprint 10 — Nav Redesign ✅ COMPLETE
**Goal:** Replace left sidebar with Apple Maps–style FAB + popover interface. Map-first layout.

### Key changes
- Entire sidebar removed — map fills 100% viewport
- 4 FABs (Radius, Tools, Style, Settings) with animated popovers
- Floating search bar top-center
- Stats HUD always visible across bottom (7 stats: Radius, Diameter, Area mi², Area km², Perimeter, Elevation, 2nd Ring)
- Coordinates label bottom-right
- Backdrop pattern for closing popovers (fixes detached DOM close bug)
- Floating cancel pill for Measure Distance and Set Map Center modes
- Print includes all pinned circles (capped at 4 for URL length)
- Elevation switched to Open-Meteo API (reliable, no key needed)

### Files after Sprint 10
| File | Purpose |
|---|---|
| `index.html` | Markup — FABs, popovers, HUD, floating search, hidden legacy inputs |
| `redesign.css` | Apple Maps aesthetic — FABs, popovers, HUD, satellite theme |
| `app.js` | Core map logic — unchanged from pre-redesign |
| `tools.js` | Tools — distance, pins, export, elevation, geocoding |
| `ui.js` | FAB/popover logic, HUD, settings, print, event delegation |
| `config.js` | Mapbox token (gitignored real value, placeholder committed) |

All files under 400-line cap.

---

## Sprint 11 — QA & Polish (Current)
**Goal:** Full QA pass on Sprint 10 nav redesign. Fix any remaining issues. Then plan next feature sprint.

### Acceptance criteria to verify (from RADIUS_MAP_NAV_REDESIGN_v2.md)
- [ ] Old sidebar completely gone — no leftover DOM
- [ ] Map fills 100% viewport
- [ ] 4 FABs visible top-left, stacked vertically
- [ ] Tapping FAB opens popover, tapping again closes
- [ ] Only one popover open at a time
- [ ] Radius popover: big number, unit toggle, slider, presets, 2nd ring, fit circle
- [ ] Tools popover: Print/PDF, Set Center, Measure Distance, Fit, Zoom In/Out
- [ ] Style popover: Street/Satellite/Topo with swatches
- [ ] Settings popover: colors, opacity, pins, all export actions
- [ ] HUD shows 7 stats always, updates live
- [ ] Coordinates label bottom-right always visible
- [ ] Floating cancel pill appears for Measure and Set Center modes
- [ ] Clicking map closes popovers (backdrop)
- [ ] Escape key closes popovers and cancels active tool modes
- [ ] Satellite theme: dark FABs/popovers/HUD
- [ ] Search bar adapts to satellite theme
- [ ] Print includes active circle + pinned circles
- [ ] Elevation shows ft value after load (Open-Meteo)
- [ ] userHasSearched flag prevents geolocation overwriting searched location

---

## File Size Policy
- Hard cap: 400 lines per file
- Deploy after every ticket: `git add -A && git commit -m "feat/fix: RM-0XX description" && git push origin main`
- New static files must be added to `vercel.json` builds array
- `{ "handle": "filesystem" }` must appear before SPA catch-all in vercel.json routes
