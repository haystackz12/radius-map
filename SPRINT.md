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
All 8 tickets + 2 refactor commits + 2 RM-027 followup fixes shipped. App feels complete and self-explanatory for new users.

### ✅ DONE (Sprint 4)

| Ticket | Description |
|---|---|
| refactor | Split style.css + app.js into 4 files to stay under 400-line cap |
| RM-027 | Smart default location — geolocation → IP (ipapi.co) → US center fallback; followup: deferred initial draw until location resolves, console logs, clarified IP fallback status message |
| RM-028 | In-app help modal — ? button in header, keyboard shortcuts reference |
| RM-029 | Onboarding walkthrough — 3-step overlay, localStorage flag `rm_onboarded` |
| RM-030 | Empty state prompt — centered overlay before first search/click |
| RM-031 | Address labels on pinned locations — dark labels visible on map |
| RM-032 | Zoom to radius — "Fit circle in view" button near slider |
| RM-033 | Keyboard shortcuts — Esc, ?, +/-, Enter |
| RM-034 | Feet unit option — ft alongside mi/km, 100–5280 range, custom presets |
| refactor | Split components.css → features.css (400-line cap) |

---

## Sprint 5 — Data & Shareability ✅ COMPLETE
All 6 tickets + 1 refactor shipped. Stats deepened, sharing expanded.

### ✅ DONE (Sprint 5)

| Ticket | Description |
|---|---|
| RM-035 | Perimeter stat — circumference (2πr) in selected unit, full-width stat card |
| RM-036 | About / attribution modal — `i` button in header, credits OSM/Nominatim/Leaflet/Esri/OpenTopo/Open-Elevation, GitHub link, v2.0 |
| RM-037 | Elevation at center — open-elevation API, ft + m display, graceful "Unavailable" fallback |
| RM-038 | Circle overlap indicator — amber shaded intersection polygon using arc geometry |
| RM-039 | QR code for share link — qrcode.js, dark theme, generate + download as PNG |
| RM-040 | Embed code — copy `<iframe>` snippet with share URL, toast confirmation |
| refactor | Moved overlap geometry functions from app.js to tools.js (400-line cap) |

---

## Sprint 6 — UX Refinements (Next)
**Goal:** Improve discoverability and make the panel smarter and more responsive to user context.

### 🔲 IN QUEUE (work in this order)

| Ticket | Priority | Description |
|---|---|---|
| RM-041 | High | **Recent searches history** — Store last 8 searches in `localStorage` key `rm_recent_searches`. Show as dropdown list when search bar is focused (before typing). Each item clickable to re-search. Clear button to reset history. |
| RM-042 | High | **Collapsible panel sections** — Tools, Radius, Map Style, Statistics sections each get a clickable header (chevron icon) to expand/collapse. Collapsed state persisted in `localStorage` key `rm_collapsed`. Default: all expanded. |
| RM-043 | Medium | **Active map style indicator** — Stronger visual active state on Street/Satellite/Topo buttons. Small persistent badge on the map (bottom-left corner) showing current tile layer name (e.g. "Street"). |
| RM-044 | Medium | **Radius presets show current unit** — Preset buttons dynamically label with current unit: "5 mi", "5 km", "5 ft". Already partially done — verify labels update on unit switch and fix if not. |
| RM-045 | Medium | **Location breadcrumb** — Small fixed label on the map (top-left, below zoom controls) showing current city/state pulled from last reverse geocode result. Updates as user searches or clicks new locations. Disappears if no location set. |

---

## File Size Policy
- Hard cap: 400 lines per file
- Current files: `index.html`, `style.css`, `components.css`, `features.css`, `app.js`, `tools.js`
- Deploy after every ticket: `git add -A && git commit -m "feat: RM-0XX description" && git push origin main`
