# NEXT_SESSION.md — Radius Map

## Session Closed
**Date:** 2026-04-09
**Session:** 3 — QA Pass (Sprint 3)

---

## App is Live
https://radius-map-psi.vercel.app

## What Was Completed This Session
- RM-022 — Copy confirmation toast (animated, slides in from top)
- RM-024 — Address search moved into header bar
- RM-023 — Gear icon + settings modal (Appearance / Pins / Export tabs)
- RM-021 — PNG export fixed (leaflet-image → html2canvas fallback, never silent)
- RM-025 — PNG centering fixed (captures #map only, invalidateSize before export)
- RM-026 — Worldwide coverage label added to header

## Current State
- 3 files: `index.html`, `style.css`, `app.js`
- All Sprint 3 tickets complete
- No known bugs
- Vercel auto-deploy on `main` — live and working
- `vercel.json` has `{ "handle": "filesystem" }` before SPA fallback — do not remove

---

## Sprint 4 Kickoff Instructions

### Step 1 — Check file sizes before touching anything
```bash
wc -l index.html style.css app.js
```
If any file exceeds 400 lines, split it first and commit before any feature work.

### Step 2 — Work tickets in order
RM-027 → RM-028 → RM-029 → RM-030 → RM-031 → RM-032 → RM-033 → RM-034

Commit and push after each ticket:
```bash
git add -A && git commit -m "feat: RM-0XX description" && git push origin main
```

---

## Key Technical Notes for Sprint 4

**RM-027 Smart geolocation:**
```javascript
// Step 1 — browser geolocation
navigator.geolocation.getCurrentPosition(
  pos => initMap(pos.coords.latitude, pos.coords.longitude, 13),
  () => tryIPGeolocation()
);
// Step 2 — IP fallback
async function tryIPGeolocation() {
  try {
    const r = await fetch('https://ipapi.co/json/');
    const d = await r.json();
    initMap(d.latitude, d.longitude, 11);
  } catch {
    initMap(39.5, -98.35, 4); // US center
  }
}
```

**RM-029 Onboarding localStorage flag:**
```javascript
if (!localStorage.getItem('rm_onboarded')) showOnboarding();
// On complete or skip:
localStorage.setItem('rm_onboarded', 'true');
```

**RM-033 Keyboard shortcuts — attach to document:**
```javascript
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAllModals();
  if (e.key === '?') openHelpModal();
  if (e.key === '+' || e.key === '=') adjustRadius(1);
  if (e.key === '-') adjustRadius(-1);
});
```

**RM-034 Feet unit:**
- Slider range: min=100, max=5280, step=10
- To meters: ft * 0.3048
- Display in radius-display and all stat cards

---

## Repo
- **GitHub:** `haystackz12/radius-map`
- **Local:** `/Users/michaelhastings/Projects/radius-map`
- **Live:** https://radius-map-psi.vercel.app

## Sprint 5 Preview
After Sprint 4 ships: perimeter stat, about modal, elevation data, circle overlap shading, QR code, embed code. See SPRINT.md for full specs.
