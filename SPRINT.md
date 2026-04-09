# SPRINT.md — Radius Map

## Sprint 1 — Foundation (Current)
**Goal:** Ship a working, deployed, polished v1.0.

---

### ✅ DONE

| Ticket | Description |
|---|---|
| RM-001 | Core map rendering with Leaflet.js |
| RM-002 | Address search via Nominatim with autocomplete dropdown |
| RM-003 | Radius slider (0.1–50 mi / km) with live circle update |
| RM-004 | Unit toggle (miles ↔ km) with value conversion |
| RM-005 | Color picker (8 swatches) + fill opacity slider |
| RM-006 | Click-to-center mode (crosshair cursor, click map to reposition) |
| RM-007 | Stats panel (radius, diameter, area mi², area km²) |
| RM-008 | Coordinates display + copy to clipboard |
| RM-009 | Export to JSON download |
| RM-010 | Dark UI panel with DM Sans / DM Mono typography |
| RM-011 | Fix OSM tile referer block — switched to hosted Vercel deployment |
| RM-012 | Project scaffolding (CLAUDE.md, SPRINT.md, NEXT_SESSION.md, USER_GUIDE.md) |

---

### 🔲 BACKLOG — Sprint 2

| Ticket | Priority | Description |
|---|---|---|
| RM-013 | High | Multiple circles — pin more than one address at a time, each with its own radius and color |
| RM-014 | High | Share link — encode center + radius in URL params so a link recreates the map state |
| RM-015 | Medium | Reverse geocode — when user clicks map, show the address of the clicked point |
| RM-016 | Medium | Tile layer switcher — toggle between Street, Satellite (Esri), and Topo views |
| RM-017 | Medium | Print / Save as image — use Leaflet.print or html2canvas to export a PNG of the map + circle |
| RM-018 | Low | Radius presets — quick-select buttons: 1 mi, 5 mi, 10 mi, 25 mi |
| RM-019 | Low | Distance tool — click two points and show the straight-line distance between them |
| RM-020 | Low | Mobile layout — responsive panel that collapses to bottom drawer on small screens |

---

## Sprint Velocity Notes
- Single-file architecture: keep `index.html` under 400 lines. If Sprint 2 features push past that, split into `style.css` + `app.js` at the start of that sprint (ticket RM-021).
- Nominatim rate limit: 1 req/sec. Debounce is currently 400ms — do not lower it.
