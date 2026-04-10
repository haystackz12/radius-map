# SPRINT 9 ADDITIONS — append to SPRINT.md after Sprint 8

## Sprint 9 — Drive Time & Routing (Planned)
**Goal:** Add drive time isochrone zones — the killer feature that separates Radius Map from every other simple radius tool. A straight-line circle is an approximation. A drive time zone is reality.

---

### 🔲 IN QUEUE (work in this order)

| Ticket | Priority | Description |
|---|---|---|
| RM-058 | High | **Drive time zone (isochrone)** — Add a "Drive time" mode toggle in the Tools section alongside the existing radius mode. When active, replace the radius slider with a travel time slider (5–60 minutes, step 5). On search or map click, call the OpenRouteService Isochrones API: `https://api.openrouteservice.org/v2/isochrones/driving-car` with the center point and time range. Render the returned GeoJSON polygon as a Leaflet layer with the current circle color and fill opacity. Show travel time in the stats panel instead of radius distance. Label the mode clearly: "Drive time zone — 15 min". Free API key required — get one at openrouteservice.org (free tier: 2,000 requests/day, plenty for this tool). Store API key in a JS constant at top of app.js with a clear comment. |
| RM-059 | High | **Walking and cycling isochrones** — Extend RM-058 with a transport mode selector: Driving / Walking / Cycling. Each calls a different ORS profile: `driving-car`, `foot-walking`, `cycling-regular`. Add a small icon button group below the travel time slider. Default is Driving. Update the stats panel label to reflect mode: "Walking zone — 20 min" / "Cycling zone — 10 min". |
| RM-060 | Medium | **Side-by-side comparison** — Allow the user to show both a straight-line radius circle AND a drive time isochrone simultaneously from the same center point. Two distinct layers: the radius circle in one color (e.g. blue, dashed border) and the isochrone polygon in another (e.g. amber, solid border). Toggle each on/off independently with checkboxes in the Tools section. This is visually powerful — shows how misleading a straight-line radius can be vs actual drive time. |
| RM-061 | Medium | **Isochrone for pinned locations** — Extend the Pins feature so each pinned location can optionally show a drive time zone instead of (or in addition to) a straight-line radius circle. In the Pins list in Settings, add a small "Drive time" toggle per pin. When enabled, fetches and renders the isochrone for that pin's coordinates at the current travel time setting. |
| RM-062 | Low | **Nearest place finder** — In the Tools section, add a "Find nearest" input. User types a place type (e.g. "hospital", "grocery store", "gas station") and the app calls Nominatim or Overpass API to find the closest matching location to the current center point. Drops a special marker on the map at the nearest result and draws a line from center to that point showing the distance. Useful for property research, site selection, coverage analysis. |

---

## Implementation Notes for Sprint 9

**RM-058 OpenRouteService setup:**
- Free account at https://openrouteservice.org/dev/#/signup
- API key goes in app.js: `const ORS_API_KEY = 'your-key-here';`
- Isochrone request:
```javascript
const response = await fetch('https://api.openrouteservice.org/v2/isochrones/driving-car', {
  method: 'POST',
  headers: {
    'Authorization': ORS_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    locations: [[currentLng, currentLat]], // note: ORS uses [lng, lat] order
    range: [travelTimeSeconds], // e.g. 15 min = 900 seconds
    range_type: 'time'
  })
});
const geojson = await response.json();
isochroneLayer = L.geoJSON(geojson, {
  style: { color: currentColor, fillOpacity: currentOpacity, weight: 2 }
}).addTo(map);
```
- Always remove previous isochrone layer before drawing new one
- Show loading state in status bar: "Calculating drive time zone…"
- Handle API errors gracefully — show "Drive time unavailable" in status bar

**RM-059 Transport mode profiles:**
```javascript
const ORS_PROFILES = {
  driving: 'driving-car',
  walking: 'foot-walking',
  cycling: 'cycling-regular'
};
```

**RM-060 Side-by-side layer management:**
- `radiusLayer` — existing Leaflet circle, dashed border (`dashArray: '8, 4'`), lower opacity
- `isochroneLayer` — ORS GeoJSON polygon, solid border, complementary color
- Both controlled by independent checkboxes
- Stats panel shows both: "Radius: 5.0 mi straight-line / Drive time: 15 min"

**RM-062 Overpass API for nearest place:**
```javascript
const overpassQuery = `
  [out:json];
  node["amenity"="${placeType}"](around:5000,${lat},${lng});
  out 1;
`;
const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
```
- Start with 5km search radius, expand to 20km if no results
- Supported place types: hospital, pharmacy, supermarket, restaurant, school, gas_station, bank, hotel

---

## Why This Sprint Matters
Drive time zones are the feature that makes Radius Map genuinely useful for:
- **Franchise owners** — "How many people can reach my Parker salon in 15 minutes?"
- **Real estate** — "What's actually within a 20-minute drive of this house?"
- **Delivery businesses** — "What's my real delivery coverage, not just a circle on a map?"
- **Site selection** — Compare drive time zones from two candidate locations side by side

No free radius map tool currently offers this. It's the feature that would make someone choose Radius Map over calcmaps or mapdevelopers.
