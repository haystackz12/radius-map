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

## Sprint 4 — Polish & UX (Current)
**Goal:** Make the app feel complete and self-explanatory for a new user landing for the first time.

### ⚠️ DO THIS FIRST
Check current line counts on `index.html`, `style.css`, `app.js`. If any file exceeds 400 lines, split before starting feature work.

---

### 🔲 IN QUEUE (work in this order)

| Ticket | Priority | Description |
|---|---|---|
| RM-027 | High | **Smart default location** — On load: (1) try `navigator.geolocation` — ask browser permission, center map on user if granted. (2) If denied/unavailable, call `https://ipapi.co/json/` to get city-level location from IP. (3) If both fail, fall back to geographic center of US (lat: 39.5, lng: -98.35, zoom: 4). Show a subtle status message during detection. Never hard-code Denver. |
| RM-028 | High | **In-app user guide** — `?` button in the header (right of gear icon). Opens a clean help modal with sections: Search, Radius, Pins, Settings, Export, Distance Tool, Share Link. Each section has a short description and keyboard shortcut if applicable. Close with × or Escape. |
| RM-029 | High | **Onboarding walkthrough** — First-time visitors (detected via `localStorage` flag `rm_onboarded`) see a 3-step overlay on load: Step 1 "Search an address" (highlights search bar), Step 2 "Set your radius" (highlights slider), Step 3 "Explore the tools" (highlights gear icon). Skip button available. Sets `rm_onboarded = true` on completion so it never shows again. |
| RM-030 | High | **Empty state prompt** — On first load before any address is searched, show a centered overlay on the map: large pin icon, heading "Search an address to get started", subtext "Enter any address, city, or place in the search bar above." Disappears the moment the first circle is drawn. |
| RM-031 | Medium | **Address labels on pins** — Each pinned location marker shows a small label with the address name (first 2 segments of display name). Label visible by default, not just on hover. Dark background, white text, small font — matches dark UI. |
| RM-032 | Medium | **Zoom to radius button** — Small "Fit circle" button (target icon) near the radius slider. One click calls `map.flyToBounds(circle.getBounds(), { padding: [40,40] })` to snap viewport back to the active circle. Useful after panning away. |
| RM-033 | Medium | **Keyboard shortcuts** — `Escape` closes any open modal. `Enter` in search bar triggers search. `+`/`=` increases radius by 1 unit. `-` decreases radius by 1 unit. `?` opens help modal. Add shortcut reference at bottom of help modal (RM-028). |
| RM-034 | Medium | **Feet unit option** — Add `ft` as third unit alongside `mi` and `km`. Slider range in feet: 100–5280 ft. Conversion: 1 mi = 5280 ft. Stats panel and radius display update accordingly. Useful for small radius use cases (a city block, a property boundary). |

---

## Sprint 5 — Data & Shareability (Planned)
**Goal:** Deepen the data shown and expand how the map can be shared and embedded.

### 🔲 IN QUEUE

| Ticket | Priority | Description |
|---|---|---|
| RM-035 | High | **Perimeter stat** — Add circumference (2πr) to the stats panel in selected unit. Label: "Perimeter". Place below area stats. |
| RM-036 | High | **About / attribution modal** — `i` button far right in header. Credits OpenStreetMap, Nominatim, Leaflet.js, CARTO, Open-Elevation. One-paragraph description, GitHub link, version number. |
| RM-037 | Medium | **Elevation at center point** — After circle is drawn, call `https://api.open-elevation.com/api/v1/lookup?locations={lat},{lng}`. Display in stats panel in both feet and meters. Handle failure gracefully — show "Unavailable", not an error. |
| RM-038 | Medium | **Circle overlap indicator** — When two pinned circles overlap, shade the intersection area in a distinct semi-transparent color using a Leaflet polygon layer. Only compute when distance between centers < sum of radii. |
| RM-039 | Medium | **QR code for share link** — "Generate QR Code" button in Export tab. Uses `qrcode.js` from cdnjs. Renders QR inline in modal. "Download QR" saves as PNG. |
| RM-040 | Low | **Embed code** — "Embed this map" section in Export tab. Generates `<iframe>` snippet with current share URL. "Copy embed code" button with confirmation toast (reuse RM-022 pattern). |

---

## File Size Policy
- Hard cap: 400 lines per file
- Current files: `index.html`, `style.css`, `app.js`
- If any file exceeds 400 lines during Sprint 4, split immediately and commit before continuing
- Deploy after every ticket: `git add -A && git commit -m "feat: RM-0XX description" && git push origin main`
