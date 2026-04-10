# SPRINT 7 ADDITIONS — append to SPRINT.md after Sprint 6

## Sprint 7 — Power Features (Planned)
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
