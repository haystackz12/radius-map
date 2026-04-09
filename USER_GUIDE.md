# Radius Map — User Guide

**Live app:** https://radius-map.vercel.app

Radius Map lets you draw a radius circle around any address to visualize coverage areas, delivery zones, search boundaries, or proximity ranges.

---

## Getting Started

### 1. Find an Address
Type any address, city, or place name into the search bar at the top of the left panel. As you type, a dropdown of matching locations will appear — click one to select it, or press **Enter** to use the top result.

The map will fly to the location and draw a circle centered on it.

### 2. Adjust the Radius
Use the **radius slider** to set the circle size from 0.1 to 50 miles (or km).

Toggle between **mi** and **km** using the unit buttons — the value converts automatically.

### 3. Set Center by Clicking the Map
Click **"Click map to set center"** to enter crosshair mode. Then click anywhere on the map to move the circle center to that point. Click the button again to exit crosshair mode.

This is useful when you want to center on a specific intersection, lot, or geographic feature rather than a named address.

---

## Panel Reference

### Address
| Control | What it does |
|---|---|
| Search input | Type to search — autocomplete appears after 3 characters |
| Search button | Manually trigger a search |
| Click map to set center | Toggle crosshair mode for click-based positioning |

### Radius
| Control | What it does |
|---|---|
| Radius slider | Drag to set the circle radius (0.1–50 units) |
| mi / km toggle | Switch units — value converts automatically |
| Large number display | Shows the current radius value |

### Appearance
| Control | What it does |
|---|---|
| Color swatches | 8 colors for the circle border and fill |
| Fill opacity slider | Controls how transparent the circle fill is (0–40%) |

### Statistics
Automatically updates whenever the radius or location changes.

| Stat | Description |
|---|---|
| Radius | Current radius in selected units |
| Diameter | Radius × 2 |
| Area (mi²) | Circle area in square miles |
| Area (km²) | Circle area in square kilometers |
| Coordinates | Lat/lng of the circle center |

### Export
| Button | What it does |
|---|---|
| Copy coordinates | Copies `lat, lng` to your clipboard |
| Download as JSON | Downloads a `.json` file with center coords, radius, and metadata |

**Sample JSON output:**
```json
{
  "center": { "lat": 39.739235, "lng": -104.984862 },
  "radius": { "value": 5.0, "unit": "mi" },
  "radius_meters": 8046.72,
  "address": "Denver, Colorado",
  "generated": "2026-04-09T18:00:00.000Z"
}
```

---

## Tips & Tricks

- **Zoom in** after setting your radius to see street-level detail inside the circle
- **Use click mode** when you want to center on a parcel or lot boundary that doesn't have a clean address
- **Adjust opacity to 0%** if you just want the circle outline with no fill
- **Export JSON** to bring coordinates into other tools (Google Maps, GIS software, spreadsheets)

---

## Data Sources
- **Map tiles:** OpenStreetMap contributors (© OpenStreetMap)
- **Geocoding:** Nominatim / OpenStreetMap
- **No account required. No data is stored or transmitted beyond the geocoding lookup.**

---

## Support
This tool is maintained by Mike Hastings. For issues or feature requests, open a GitHub issue at `github.com/haystackz12/radius-map`.
