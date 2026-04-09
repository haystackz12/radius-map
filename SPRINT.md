# SPRINT.md — Radius Map

## Sprint 1 — Foundation ✅ COMPLETE
All tickets done. App live at https://radius-map-psi.vercel.app

---

## Sprint 2 — Features (Current)
**Goal:** Ship all high-value UX improvements. Deploy after each ticket via `git push origin main`.

File split complete: `index.html` / `style.css` / `app.js`.

---

### 🔲 IN QUEUE (work in this order)

| Ticket | Priority | Description |
|---|---|---|
| RM-014 | High | **Share link** — encode `lat`, `lng`, `radius`, `unit` as URL params (`?lat=39.739&lng=-104.984&r=5&unit=mi`). Restore state on load. Add "Copy share link" button to Export section. |
| RM-015 | High | **Reverse geocode on click** — when user clicks map in click-to-center mode, call Nominatim `/reverse` and populate the address input with the result. |
| RM-013 | High | **Multiple circles** — "Pin this location" button saves current circle to a `pins[]` array. Each pin renders on map with its own color, radius, label. Panel lists all pins with remove (×) buttons. |
| RM-016 | Medium | **Tile layer switcher** — toggle Street (OSM), Satellite (Esri World Imagery), Topo (OpenTopoMap). Small control group in panel or above map. |
| RM-017 | Medium | **Save as PNG** — export current map view + circle as downloadable PNG using `leaflet-image` or `html2canvas`. Button in Export section. |

---

### ✅ DONE (Sprint 2)

| Ticket | Description |
|---|---|
| RM-018 | Radius presets — 1/3/5/10/25 quick-select buttons, unit-aware |
| RM-019 | Distance tool — click two points, dashed line + mi/km label |
| RM-020 | Mobile layout — collapsible bottom drawer below 768px |

### ✅ DONE (Sprint 1)

| Ticket | Description |
|---|---|
| RM-001 through RM-012 | Full foundation — map, search, radius, stats, export, dark UI, Vercel deploy, all session docs |
