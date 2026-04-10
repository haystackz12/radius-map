# SPRINT.md — Radius Map

## Sprint 1 — Foundation ✅ COMPLETE
All tickets done. App live at https://radius-map-psi.vercel.app

## Sprint 2 — Features ✅ COMPLETE
All 8 tickets shipped. File split + 7 user-facing features deployed.

## Sprint 3 — QA & Polish ✅ COMPLETE
All 4 tickets shipped. UI reorganization + robust PNG export.

---

### ✅ DONE (Sprint 3)

| Ticket | Description |
|---|---|
| RM-021 | Fix PNG export — leaflet-image with html2canvas fallback, never fails silently |
| RM-022 | Copy confirmation toast notification |
| RM-023 | Gear icon + settings modal (Appearance / Pins / Export tabs) |
| RM-024 | Move address search into header bar |

### ✅ DONE (Sprint 2)

| Ticket | Description |
|---|---|
| refactor | Split single-file `index.html` into `index.html` + `style.css` + `app.js` |
| RM-013 | Multiple circles — pin locations with color/label/radius, removable list |
| RM-014 | Share link — URL params (`?lat=&lng=&r=&unit=`) restored on load + copy button |
| RM-015 | Reverse geocode on map click — populates address input via Nominatim `/reverse` |
| RM-016 | Tile layer switcher — Street (OSM), Satellite (Esri), Topo (OpenTopoMap) |
| RM-017 | Save as PNG — `leaflet-image` export, tile layers use `crossOrigin: true` |
| RM-018 | Radius presets — 1/3/5/10/25 quick-select buttons, unit-aware |
| RM-019 | Distance tool — click two points, dashed polyline + mi/km label |
| RM-020 | Mobile layout — collapsible bottom drawer below 768px |

### ✅ DONE (Sprint 1)

| Ticket | Description |
|---|---|
| RM-001 through RM-012 | Full foundation — map, search, radius, stats, export, dark UI, Vercel deploy, all session docs |
