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

## Sprint 5 — Data & Shareability (Next)
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
- Deploy after every ticket: `git add -A && git commit -m "feat: RM-0XX description" && git push origin main`
