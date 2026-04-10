# SPRINT 12 — Drive Time Zones
## For Claude Code — read this at session start

---

## Context
Sprint 12 adds drive time isochrone zones to DrawRadius. This is the killer feature that differentiates the app from every other radius tool. Instead of a straight-line circle, users can see the actual area reachable by driving, walking, or cycling in X minutes.

## API
**OpenRouteService (ORS)** — free tier, 2,000 requests/day
- Key stored as: `const ORS_API_KEY = 'YOUR_KEY_HERE';` at top of app.js
- Endpoint: `https://api.openrouteservice.org/v2/isochrones/{profile}`
- Profiles: `driving-car`, `foot-walking`, `cycling-regular`
- Method: POST
- Body: `{ locations: [[lng, lat]], range: [seconds], range_type: 'time' }`
- Note: ORS uses [lng, lat] order — NOT [lat, lng]

## Tickets

### RM-058 — Drive time zone (isochrone) — HIGH
Add drive time mode as an alternative to radius mode.

**UI changes (ui.js):**
- Add a mode toggle at the top of the Radius popover: two pills — "Radius" and "Drive time"
- Store mode in a global: `let radiusMode = 'radius'; // 'radius' | 'drivetime'`
- When "Drive time" is selected:
  - Hide the radius slider and presets
  - Show a travel time slider: min=5, max=60, step=5, default=15
  - Show transport mode buttons: 🚗 Driving, 🚶 Walking, 🚲 Cycling
  - Show the big number as "15 min" instead of "5.0 mi"
  - Store transport mode: `let transportMode = 'driving-car';`
- When "Radius" is selected: restore normal slider UI

**Map logic (app.js or ui.js):**
```javascript
let isochroneLayer = null;
let travelTimeMinutes = 15;
let transportMode = 'driving-car';
let radiusMode = 'radius';

async function fetchIsochrone() {
  if (isochroneLayer) { map.removeLayer(isochroneLayer); isochroneLayer = null; }
  setStatus('Calculating drive time zone…', 'loading');
  try {
    const resp = await fetch(`https://api.openrouteservice.org/v2/isochrones/${transportMode}`, {
      method: 'POST',
      headers: { 'Authorization': ORS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locations: [[currentLng, currentLat]],
        range: [travelTimeMinutes * 60],
        range_type: 'time'
      })
    });
    if (!resp.ok) throw new Error('API error ' + resp.status);
    const geojson = await resp.json();
    isochroneLayer = L.geoJSON(geojson, {
      style: { color: currentColor, weight: 2, fillColor: currentColor, fillOpacity: currentOpacity }
    }).addTo(map);
    map.fitBounds(isochroneLayer.getBounds(), { padding: [40, 40] });
    setStatus(`Drive time zone: ${travelTimeMinutes} min`, 'success');
    updateHUD();
  } catch(e) {
    setStatus('Drive time unavailable — check API key or try again', 'error');
  }
}
```

**HUD update:**
- When in drive time mode, `hud-radius` shows "15 min 🚗" instead of "5.0 mi"
- Other stats (area, perimeter) show "—" since they don't apply to isochrones

**drawCircle hook:**
- Modify the drawCircle hook in ui.js: if `radiusMode === 'drivetime'`, call `fetchIsochrone()` instead of drawing the circle

---

### RM-059 — Walking and cycling isochrones — HIGH
Extend RM-058 with transport mode selector.

Already included in RM-058 UI spec above (🚗 🚶 🚲 buttons).

When transport mode changes → call `fetchIsochrone()` again with new profile.

Profiles:
- 🚗 Driving → `driving-car`
- 🚶 Walking → `foot-walking`  
- 🚲 Cycling → `cycling-regular`

---

### RM-060 — Side-by-side comparison — MEDIUM
Show radius circle AND isochrone simultaneously.

Add a "Compare" checkbox in the drive time section of the Radius popover.
When checked: draw both the straight-line circle (dashed, lower opacity) and the isochrone (solid).
This visually shows how misleading a straight-line radius can be vs actual drive time.

---

## Implementation Order
1. RM-058 + RM-059 together (transport mode is part of the same UI)
2. RM-060 after the basics work
3. Test with real addresses before committing

## Key Notes
- ORS free tier rate limit: be careful not to call on every slider drag — only call on slider `change` (mouseup), not `input` (drag)
- Always remove previous isochroneLayer before adding a new one
- Handle the case where user switches back to radius mode: remove isochroneLayer from map
- The isochrone GeoJSON from ORS wraps the polygon in a FeatureCollection — L.geoJSON handles this natively
- Print: when in drive time mode, the Mapbox print needs to use the isochrone polygon instead of the circle GeoJSON

## Files to modify
- `app.js` — add ORS_API_KEY constant, add radiusMode/transportMode/travelTimeMinutes globals, add fetchIsochrone()
- `ui.js` — update radiusPopoverHTML() with mode toggle + travel time slider + transport buttons, update computeStats() HUD for drive time mode, update drawCircle hook
- `tools.js` — update printMap() to handle drive time mode

## Commit pattern
```bash
git add -A && git commit -m "feat: RM-058/059 drive time isochrone zones (ORS API)" && git push origin main
```
