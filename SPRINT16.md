# SPRINT 16 — Code Audit, Security & Mobile
## DrawRadius — drawradius.com

---

## Goal
Before public launch: eliminate dead code, fix security issues, improve performance, and make the mobile experience first-class. No new features until this sprint is complete.

---

## Section 1 — Code Audit & Dead Code

### RM-068 — Dead code elimination
**What to check:**
- Functions defined but never called (grep for function names, verify call sites)
- CSS classes defined in redesign.css that don't exist in any HTML or JS-generated markup
- Variables declared but never read
- Event listeners attached to elements that no longer exist in the DOM (old sidebar IDs)
- Commented-out code blocks that should be deleted
- Old CSS files (style.css, components.css, features.css) — are these still loaded? Do they conflict with redesign.css?
- Duplicate function definitions across files (e.g. clearSearchInput defined in both tools.js and ui.js)

**Tool:** Have Claude Code run a grep audit across all JS files for:
```bash
grep -n "function " *.js | sort
grep -n "getElementById" *.js | awk -F"'" '{print $2}' | sort | uniq
```
Then cross-reference against index.html to find orphaned IDs.

---

## Section 2 — Security Audit

### RM-069 — API key exposure audit
**What to check:**
- config.js — is REPLACE_ME placeholder always committed, never real tokens?
- build.sh — does it correctly inject tokens at deploy time only?
- Git history — run `git log --all --full-history -- config.js` to check if real tokens were ever committed
- Vercel env vars — confirm MAPBOX_TOKEN and ORS_API_KEY are set in Vercel dashboard
- .gitignore — verify config.js real value changes are ignored

**Fix if needed:**
```bash
git filter-repo --path config.js --invert-paths  # nuclear option if tokens in history
```

### RM-070 — Input sanitization
**What to check:**
- Search input: is user text ever inserted into innerHTML without sanitization?
- Pin names (from prompt()): are they inserted into map labels via innerHTML?
- CSV import: are address strings from uploaded files sanitized before geocoding?
- URL params (restoreFromURL): are lat/lng/color/mode params validated before use?

**Specific risks:**
- XSS via pin name: `pin.name` inserted into `html: \`<div class="pin-map-label">${name}</div>\`` — if name contains `<script>`, it executes
- XSS via URL param: color param `?color=<script>alert(1)</script>` passed to circle style
- CSV injection: CSV file containing `=cmd|'/C calc'!A0` style payloads

**Fix pattern:**
```javascript
function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```
Apply to: pin names, CSV address strings, URL params before DOM insertion.

### RM-071 — Content Security Policy (CSP)
**What to check:**
- vercel.json headers — is there a Content-Security-Policy header?
- If not, add one that allows: self, cdnjs.cloudflare.com, OSM tiles, Nominatim, ORS, Mapbox, Open-Meteo, Overpass, ipapi.co

**Recommended CSP for vercel.json:**
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' cdnjs.cloudflare.com; img-src * data: blob:; connect-src 'self' nominatim.openstreetmap.org api.openrouteservice.org api.mapbox.com api.open-meteo.com overpass-api.de ipapi.co *.tile.openstreetmap.org *.basemaps.cartocdn.com server.arcgisonline.com *.tile.opentopomap.org; frame-ancestors 'none';"
}
```

### RM-072 — Rate limiting awareness
**What to check:**
- Nominatim: debounce is 400ms — is it respected everywhere? Check all fetch calls to nominatim
- ORS: debounce is 600ms — verify generation counter prevents parallel calls
- Open-Meteo: called on every drawCircle() — could fire rapidly during slider drag. Add debounce.
- Overpass: no rate limiting currently — add 500ms debounce to Find Nearest
- ipapi.co: only called once on load — fine

---

## Section 3 — Performance Audit

### RM-073 — Map layer cleanup
**What to check:**
- Are old Leaflet layers being properly removed before new ones are added?
- Memory leak check: every L.circle(), L.marker(), L.polyline(), L.geoJSON() call should have a corresponding removeLayer() when replaced
- overlapLayers array: is it being cleared properly? Could grow unbounded with many pin changes
- distanceMarkers array: cleared on mode change?
- isochroneLayer: verify removeIsochrone() covers all code paths

### RM-074 — localStorage size management
**What to check:**
- Saved maps: each save stores full pin data including coordinates and colors — estimate size per map
- Recent searches: capped at 8 — fine
- Favorites: capped at 10 — fine
- Saved maps: capped at 10 — but each map with many pins could be large
- Add size check before saving: if localStorage usage > 4MB, warn user

### RM-075 — Bundle size and load time
**What to check:**
- How many external scripts are loaded? Count all `<script src>` tags
- Leaflet CSS + JS from cdnjs — are correct versions pinned?
- QRCode.js — is it loaded even when QR is never used? Consider lazy loading
- Google Fonts (DM Sans, DM Mono) — still referenced? Or removed in redesign?
- Measure actual page load time in Chrome DevTools Network tab — target under 3 seconds on 4G

---

## Section 4 — Mobile Improvements

### RM-076 — Mobile touch interactions
**What to check and fix:**
- FAB buttons: are they 44×44px minimum touch target? (Apple HIG requirement)
- Popover width on small screens: does it overflow on iPhone SE (375px wide)?
- Slider thumb: is it large enough to drag comfortably on mobile? Should be at least 24px
- Search bar: does keyboard push the map up properly on iOS Safari?
- HUD at bottom: does it sit above the iOS home indicator bar? Add `padding-bottom: env(safe-area-inset-bottom)`
- Brand badge: does it overlap the HUD on small screens?

### RM-077 — Mobile popover position
**What to check:**
- On screens < 480px, popovers currently appear above HUD at full width — is this working?
- Test on actual iPhone: do popovers clip outside the viewport?
- Settings popover is the longest — does it scroll properly on mobile?
- The backdrop: does it properly prevent map interaction on mobile while popover is open?

### RM-078 — iOS Safari specific fixes
**Known iOS Safari issues to test:**
- `position: fixed` elements shifting when keyboard appears
- `backdrop-filter: blur()` — supported in iOS Safari 9+ but can cause performance issues
- Touch events on Leaflet map — verify map panning doesn't interfere with popover scrolling
- `navigator.clipboard.writeText()` — requires user gesture on iOS, verify copy buttons work
- `document.documentElement.requestFullscreen()` — NOT supported on iOS Safari, hide fullscreen button on iOS
- Print dialog — `window.print()` behavior on iOS opens share sheet, not print dialog — add iOS-specific messaging

### RM-079 — Responsive HUD
**What to check:**
- HUD shows 6 stats in a 6-column grid — on iPhone SE (375px) each column is ~50px
- At that width, values like "78.54 mi²" overflow their cell
- Fix: on screens < 480px, reduce HUD to 3 stats per row (2 rows) or abbreviate labels
- Consider hiding less-used stats (Perimeter, 2nd Ring) on mobile unless active

---

## Testing Checklist

### Browsers to test
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)  
- [ ] Safari (desktop)
- [ ] Chrome (Android)
- [ ] Safari (iOS)

### Devices to test
- [ ] Desktop 1920×1080
- [ ] Laptop 1280×800
- [ ] iPad (768px)
- [ ] iPhone 14 (390px)
- [ ] iPhone SE (375px)

### Feature checklist per device
- [ ] Search and geocoding
- [ ] Radius slider and presets
- [ ] Drive time mode
- [ ] Transport mode switching
- [ ] Pinning locations
- [ ] Settings popover (all tabs)
- [ ] Print/PDF
- [ ] Copy share link
- [ ] Saved maps
- [ ] Find nearest
- [ ] Reset

---

## Implementation Order
1. RM-070 input sanitization (security — highest priority)
2. RM-069 API key audit (security)
3. RM-068 dead code (cleanup)
4. RM-073 layer cleanup (performance)
5. RM-076 mobile touch (mobile)
6. RM-078 iOS Safari fixes (mobile)
7. RM-079 responsive HUD (mobile)
8. RM-077 mobile popover (mobile)
9. RM-071 CSP headers (security hardening)
10. RM-072 rate limiting (stability)
11. RM-074 localStorage size (edge case)
12. RM-075 bundle size (performance)

---

## Notes for Claude Code
- Do NOT add new features during this sprint
- Fix one ticket at a time, commit after each
- For security fixes: show the vulnerable code and the fix side by side in the commit message
- For mobile fixes: test each change at 375px viewport width before committing
- Run `wc -l *.js *.css *.html` after dead code removal to verify file sizes decreased
