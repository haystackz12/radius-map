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

## Sprint 6 — UX Refinements ✅ COMPLETE
All 5 tickets + 1 refactor shipped. Panel smarter, search history, breadcrumb.

### ✅ DONE (Sprint 6)

| Ticket | Description |
|---|---|
| RM-041 | Recent searches history — last 8 in localStorage, dropdown on focus, clear button |
| RM-042 | Collapsible panel sections — chevron toggle, state persisted in localStorage |
| RM-043 | Active map style indicator — glow on active button + tile layer badge on map |
| RM-044 | Radius presets + range labels update on unit switch |
| RM-045 | Location breadcrumb — city/state label on map from reverse geocode |
| refactor | Split tools.js → tools.js + ui.js (400-line cap), added ui.js to vercel.json |

---

## Export Simplification (Sprint 7 QA)
- Removed Save as PNG button and all `leaflet-image` / `html2canvas` code
- Print button renamed to "Print / Save PDF" — uses Mapbox Static Images API
- Users print or save as PDF via browser's native print dialog
- Removed 2 CDN dependencies (`leaflet-image`, `html2canvas`)

---

## Sprint 7 — Power Features (Next)
**Goal:** Add features that make the app genuinely more powerful for repeat and advanced users.

---

### 🔲 IN QUEUE (work in this order)

| Ticket | Priority | Description |
|---|---|---|
| RM-046 | High | **Named circle labels** — When pinning a location, prompt the user to enter a name (default: first segment of address). Label renders on the map above the pin marker in a small pill — dark background, white text, 11px font. Name is editable by clicking the label in the pins list inside the Settings modal. Useful when comparing multiple zones by name ("Parker Salon", "Delivery Zone A"). |
| RM-047 | High | **Search by coordinates** — Detect when the search input matches a lat/lng pattern (e.g. `39.7392, -104.9903` or `39.7392 -104.9903`). If matched, skip Nominatim entirely and plot the point directly. Populate the address input with the formatted coordinate string. Show "Coordinate detected" in the status bar. No geocoding request needed — works offline. |
| RM-048 | High | **Dark / light mode toggle** — Sun/moon icon button in the header. Toggles the panel UI between dark (current) and light mode using a `data-theme` attribute on `<body>`. Light mode CSS variables: white panel background, dark text, light borders. Auto-pairs tile layer: light mode defaults to Street tiles, dark mode defaults to a darker CARTO basemap (`dark_all`). State persisted in `localStorage` key `rm_theme`. Update `style.css` with full light mode variable overrides. |
| RM-049 | Medium | **Concentric circles (comparison mode)** — Add a second radius slider below the first, toggled on with a "Add inner ring" / "Add outer ring" button. Both circles share the same center point. Each has its own color (inner defaults to current color at higher opacity, outer at lower opacity). Stats panel shows both radii and both areas. Useful for primary/secondary zone planning (e.g. 3mi primary + 10mi secondary coverage). |
| RM-050 | Medium | **Print-friendly view** — Add a `@media print` stylesheet to `style.css` that: hides the panel, hides all modals and buttons, expands `#map` to full page width and height, injects a footer with the address, radius, stats, and today's date. Add a "Print map" button to the Export tab in Settings that calls `window.print()`. No library needed — pure CSS. |

---

## Implementation Notes for Sprint 7

**RM-046 Named labels:**
- Use Leaflet `L.tooltip` with `permanent: true` for the map label
- Store name in the pin object: `{ id, lat, lng, radiusM, color, label, name, circleLayer, markerLayer, tooltipLayer }`
- Input prompt: small inline text input in the pin modal or inline edit in the pins list

**RM-047 Coordinate detection regex:**
```javascript
const coordPattern = /^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/;
const match = query.trim().match(coordPattern);
if (match) {
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  // validate range: lat -90 to 90, lng -180 to 180
  if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    applyCoordinates(lat, lng);
    return;
  }
}
```

**RM-048 Theme toggle CSS pattern:**
```css
/* Dark (default) */
:root { --bg: #0f1117; --surface: #1a1d27; --text: #f0f2ff; }
/* Light override */
[data-theme="light"] { --bg: #ffffff; --surface: #f5f5f5; --text: #1a1a2e; }
```

**RM-049 Concentric circles:**
- Add `innerCircle` / `outerCircle` vars alongside existing `circle`
- Second slider: `id="radius-slider-2"`, range same as primary
- "Add ring" toggle button shows/hides the second slider
- Both sliders call `drawCircles()` which replaces current `drawCircle()`

**RM-050 Print stylesheet:**
```css
@media print {
  .panel, header button, .leaflet-control { display: none !important; }
  #map { width: 100vw !important; height: 85vh !important; }
  .print-footer { display: block !important; }
}
```

---

## File Size Policy
- Hard cap: 400 lines per file
- Current files: `index.html`, `style.css`, `components.css`, `features.css`, `app.js`, `tools.js`, `ui.js`
- Deploy after every ticket: `git add -A && git commit -m "feat: RM-0XX description" && git push origin main`
