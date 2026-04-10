# Radius Map — Nav Redesign: Option 3 (FAB + Contextual Popovers)
**Implementation Guide for Claude Code**
**Version 2 — Updated with pre-implementation fixes**

---

## Pre-Implementation Notes (Read First)

The following issues were identified during review and must be addressed during implementation:

1. **Search bar placement** — The header search bar must move to a floating search bar at the top-center of the map. See "Floating Search Bar" section below for full spec.
2. **Settings FAB** — A 4th FAB (gear icon ⚙) must be added for Settings. It owns: color picker, fill opacity, pins list, share link, copy coordinates, QR code, embed code, download JSON. See "Settings Popover" section below.
3. **State mapping** — The `state` object in this spec must map to existing variables (`currentLat`, `currentLng`, `currentUnit`, etc.) — do NOT create a parallel state system. Wire state.radius → existing radius value, state.unit → currentUnit, etc.
4. **Print function** — Line referencing `window.print()` in toolsPopoverHTML must call the existing `printMap()` function instead.
5. **Elevation in HUD** — Add elevation as a 7th HUD stat. Pull from the existing elevation display value.

---

## Overview & Goal

Replace the existing left sidebar navigation with a zero-chrome, Apple Maps–style interface built around four Floating Action Buttons (FABs) and contextual popovers. The map becomes the primary surface. All controls are accessible on demand; nothing is permanently visible except the FABs, the Stats HUD, the floating search bar, and the map pin.

This document is the authoritative specification. Follow it exactly. Do not invent alternative layouts, simplify controls, or omit any feature listed here.

---

## Design Philosophy

- **Map-first.** The sidebar is gone entirely. No persistent panel, no drawer.
- **On-demand chrome.** Controls appear only when the user explicitly requests them.
- **Contextual popovers.** Each FAB owns one domain (Radius, Tools, Style, Settings). Tapping a FAB opens its popover beside it. Tapping the same FAB again closes it. Only one popover is open at a time.
- **Always-visible HUD.** A slim frosted-glass bar anchored to the bottom of the map always shows all seven statistics. It never hides.
- **Apple aesthetic.** SF Pro / system-ui font. Frosted glass (`rgba(255,255,255,0.92)` on light, `rgba(18,26,18,0.95)` on satellite). `#007AFF` as the primary accent. Smooth spring transitions (`cubic-bezier(0.4,0,0.2,1)`, 220ms). Corner radius 14px on FABs, 16px on popovers.

---

## What to Remove

Remove the following from the existing codebase entirely:

- The entire left sidebar `<div>` / `<nav>` element and all its children.
- Any CSS that controls the sidebar: width, flex layout, background, scrolling, section headers, collapse/expand logic.
- Any JS that manages sidebar open/close state.
- The `margin-left` or `padding-left` offset applied to the map container to accommodate the sidebar. **The map must now fill 100% of the viewport width.**
- The existing header bar (logo, title, tagline, header search bar) — the search bar moves to a floating element on the map.
- The existing "Statistics" section from the sidebar (it moves to the HUD).
- The existing "Radius" section from the sidebar (it moves to the Radius popover).
- The existing "Map Style" section from the sidebar (it moves to the Style popover).
- The existing "Tools" section from the sidebar (it moves to the Tools popover).
- The existing gear icon Settings modal (it moves to the Settings popover).
- The existing Lat/Lng display (it moves to the HUD).

Do not remove any underlying business logic, event handlers, or state variables — only the DOM structure and associated CSS.

---

## New DOM Structure

Insert the following structure as a **direct child of the map container element**. All elements use `position: absolute` and sit in an overlay layer above the map.

```html
<!-- Floating Search Bar -->
<div id="search-bar">
  <input id="search-input" type="text" placeholder="Address or lat, lng coordinates…" autocomplete="off">
  <button id="search-clear" style="display:none">×</button>
  <button id="search-btn">⌕</button>
  <div id="search-suggestions"></div>
</div>

<!-- FAB Stack -->
<div id="fab-stack">
  <div class="fab fab-active" id="fab-radius"   data-target="pop-radius"   role="button" tabindex="0">⊙</div>
  <div class="fab"            id="fab-tools"    data-target="pop-tools"    role="button" tabindex="0">🔧</div>
  <div class="fab"            id="fab-style"    data-target="pop-style"    role="button" tabindex="0">🗺</div>
  <div class="fab"            id="fab-settings" data-target="pop-settings" role="button" tabindex="0">⚙</div>
</div>

<!-- Popovers (one per FAB) -->
<div class="popover" id="pop-radius"></div>
<div class="popover" id="pop-tools"    style="top: 64px;"></div>
<div class="popover" id="pop-style"    style="top: 116px;"></div>
<div class="popover" id="pop-settings" style="top: 168px;"></div>

<!-- Stats HUD (always visible) -->
<div id="stats-hud">
  <div class="hud-stat"><span class="hud-val" id="hud-radius">—</span><span class="hud-key">Radius</span></div>
  <div class="hud-stat"><span class="hud-val" id="hud-diameter">—</span><span class="hud-key">Diameter</span></div>
  <div class="hud-stat"><span class="hud-val" id="hud-area-mi">—</span><span class="hud-key">Area mi²</span></div>
  <div class="hud-stat"><span class="hud-val" id="hud-area-km">—</span><span class="hud-key">Area km²</span></div>
  <div class="hud-stat"><span class="hud-val" id="hud-perim">—</span><span class="hud-key">Perimeter</span></div>
  <div class="hud-stat"><span class="hud-val" id="hud-elev">—</span><span class="hud-key">Elevation</span></div>
  <div class="hud-stat"><span class="hud-val" id="hud-ring2">—</span><span class="hud-key">2nd Ring</span></div>
</div>

<!-- Coordinates label (always visible, bottom-right) -->
<div id="coords-label">Lat: — &nbsp; Lng: —</div>
```

**Popover `top` offsets:**
- Radius popover: `top: 12px`
- Tools popover: `top: 64px` (12 + 44 + 8)
- Style popover: `top: 116px` (64 + 44 + 8)
- Settings popover: `top: 168px` (116 + 44 + 8)

---

## Floating Search Bar Spec

The search bar floats at the top-center of the map. It replicates all existing search functionality.

```css
#search-bar {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: min(480px, calc(100vw - 140px));
  background: rgba(255, 255, 255, 0.96);
  border: 0.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.14);
  display: flex;
  align-items: center;
  padding: 0 10px;
  gap: 6px;
  z-index: 1001;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

#search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  font-family: system-ui, -apple-system, sans-serif;
  color: rgba(0, 0, 0, 0.85);
  padding: 11px 0;
}

#search-input::placeholder { color: rgba(0, 0, 0, 0.35); }

#search-clear, #search-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.4);
  padding: 4px;
  line-height: 1;
}

#search-btn { color: #007AFF; font-size: 18px; }

#search-suggestions {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  border: 0.5px solid rgba(0, 0, 0, 0.11);
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  display: none;
  z-index: 1002;
}

.suggestion-item {
  padding: 10px 14px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.78);
  cursor: pointer;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.06);
}

.suggestion-item:last-child { border-bottom: none; }
.suggestion-item:hover { background: rgba(0, 122, 255, 0.05); }

/* Satellite theme overrides for search bar */
.satellite-theme #search-bar {
  background: rgba(18, 26, 18, 0.92);
  border-color: rgba(255, 255, 255, 0.12);
}
.satellite-theme #search-input { color: rgba(255, 255, 255, 0.9); }
.satellite-theme #search-input::placeholder { color: rgba(255, 255, 255, 0.35); }
```

**Wire existing search logic** to `#search-input`, `#search-btn`, `#search-clear`, and `#search-suggestions` — same Nominatim calls, same autocomplete, same `applyResult()` handler. Only the DOM element IDs change.

---

## Settings Popover Spec

The Settings popover (4th FAB ⚙) contains all features previously in the gear modal.

```js
function settingsPopoverHTML() {
  return `
    <div class="pop-title">Appearance</div>
    <div class="pop-title" style="font-size:9px;margin-bottom:6px;">Circle color</div>
    <div id="color-swatches" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
      <!-- render 8 color swatches here using existing COLORS array -->
    </div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
      <span style="font-size:10px;color:rgba(0,0,0,0.45);flex:1;">Fill opacity</span>
      <input type="range" id="opacity-slider" min="0" max="40" step="1" value="${Math.round(currentOpacity * 100)}" style="flex:2;">
      <span style="font-size:10px;color:#007AFF;width:28px;text-align:right;" id="opacity-val">${Math.round(currentOpacity * 100)}%</span>
    </div>
    <hr class="pop-divider">
    <div class="pop-title">Pins</div>
    <button class="action-btn" id="btn-pin">📍 &nbsp;Pin this location</button>
    <div id="pins-list"><!-- render existing pins list here --></div>
    <hr class="pop-divider">
    <div class="pop-title">Export</div>
    <button class="action-btn" id="btn-share">🔗 &nbsp;Copy share link</button>
    <button class="action-btn" id="btn-coords">📋 &nbsp;Copy coordinates</button>
    <button class="action-btn" id="btn-qr">⬛ &nbsp;Generate QR code</button>
    <button class="action-btn" id="btn-json">⬇ &nbsp;Download as JSON</button>
    <button class="action-btn" id="btn-embed">‹› &nbsp;Copy embed code</button>
  `;
}
```

Wire all buttons to their existing handler functions. No new logic — only new DOM location.

---

## CSS Specification

```css
/* ── Map container must fill full viewport ── */
#map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* ── FAB Stack ── */
#fab-stack {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;
}

.fab {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  border: 0.5px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.12s ease, transform 0.1s ease;
  user-select: none;
  -webkit-user-select: none;
}

.fab:hover  { background: #ffffff; transform: scale(1.04); }
.fab:active { transform: scale(0.96); }

.fab.fab-active {
  background: #007AFF;
  border-color: #007AFF;
  box-shadow: 0 2px 12px rgba(0, 122, 255, 0.35);
}

/* ── Popovers ── */
.popover {
  position: absolute;
  left: 66px;
  width: 208px;
  max-height: 420px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.96);
  border: 0.5px solid rgba(0, 0, 0, 0.11);
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.14);
  z-index: 999;
  display: none;
  transform-origin: top left;
  animation: popIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.popover.pop-open { display: block; }

@keyframes popIn {
  from { opacity: 0; transform: scale(0.92) translateX(-6px); }
  to   { opacity: 1; transform: scale(1)    translateX(0);     }
}

/* ── Stats HUD ── */
#stats-hud {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 54px;
  background: rgba(255, 255, 255, 0.90);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 0.5px solid rgba(0, 0, 0, 0.08);
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  align-items: center;
  padding: 0 16px;
  gap: 4px;
  z-index: 1000;
}

.hud-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hud-val {
  font-size: 12px;
  font-weight: 700;
  color: #007AFF;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-align: center;
}

.hud-key {
  font-size: 8px;
  color: rgba(0, 0, 0, 0.38);
  text-align: center;
  margin-top: 2px;
  white-space: nowrap;
}

/* ── Coordinates label ── */
#coords-label {
  position: absolute;
  bottom: 62px;
  right: 10px;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(0, 0, 0, 0.35);
  padding: 3px 8px;
  border-radius: 6px;
  z-index: 1001;
  pointer-events: none;
}

/* ── Shared popover typography & controls ── */
.pop-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.32);
  margin-bottom: 10px;
}

.pop-bignum {
  font-size: 38px;
  font-weight: 700;
  color: #007AFF;
  letter-spacing: -2px;
  line-height: 1;
}

.pop-unit-sub {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.35);
  margin-bottom: 10px;
}

.seg-ctrl {
  display: flex;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 2px;
  margin-bottom: 10px;
}

.seg-btn {
  flex: 1;
  text-align: center;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 2px;
  border-radius: 6px;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.45);
  transition: all 0.1s;
  user-select: none;
}

.seg-btn.active {
  background: #ffffff;
  color: #007AFF;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.pop-slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(0, 0, 0, 0.10);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  margin: 6px 0 10px;
}

.pop-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.25);
  border: 0.5px solid rgba(0, 0, 0, 0.12);
}

.presets-row {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.preset-btn {
  font-size: 10px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 7px;
  background: rgba(0, 122, 255, 0.08);
  color: #007AFF;
  cursor: pointer;
  border: 0.5px solid rgba(0, 122, 255, 0.2);
  transition: background 0.1s;
}

.preset-btn:hover  { background: rgba(0, 122, 255, 0.15); }
.preset-btn.active { background: #007AFF; color: #ffffff; border-color: #007AFF; }

.action-btn {
  width: 100%;
  font-size: 11px;
  font-weight: 500;
  padding: 8px 10px;
  border-radius: 9px;
  border: 0.5px solid rgba(0, 0, 0, 0.11);
  background: rgba(0, 0, 0, 0.03);
  color: rgba(0, 0, 0, 0.75);
  cursor: pointer;
  margin-bottom: 6px;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1.3;
  transition: background 0.1s;
}

.action-btn:hover         { background: rgba(0, 0, 0, 0.06); }
.action-btn.action-active { border-color: #007AFF; color: #007AFF; background: rgba(0, 122, 255, 0.05); }

.pop-divider {
  border: none;
  border-top: 0.5px solid rgba(0, 0, 0, 0.07);
  margin: 9px 0;
}

.ring2-box {
  background: rgba(52, 199, 89, 0.07);
  border: 0.5px solid rgba(52, 199, 89, 0.25);
  border-radius: 10px;
  padding: 8px 10px;
  margin: 4px 0 8px;
}

.ring2-label {
  font-size: 10px;
  font-weight: 700;
  color: #34C759;
  margin-bottom: 6px;
}

.style-opt {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px;
  border-radius: 10px;
  border: 0.5px solid rgba(0, 0, 0, 0.09);
  cursor: pointer;
  margin-bottom: 6px;
  background: rgba(0, 0, 0, 0.02);
  transition: all 0.1s;
}

.style-opt:hover  { background: rgba(0, 0, 0, 0.04); }
.style-opt.active { border-color: #007AFF; background: rgba(0, 122, 255, 0.06); }

.style-swatch {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.style-name { font-size: 11px; font-weight: 600; color: rgba(0,0,0,0.78); }
.style-desc { font-size: 10px; color: rgba(0,0,0,0.38); }

/* ── Satellite theme overrides ── */
.satellite-theme .fab:not(.fab-active) {
  background: rgba(20, 30, 20, 0.88);
  border-color: rgba(255,255,255,0.15);
}
.satellite-theme .popover          { background: rgba(18,26,18,0.96); border-color: rgba(255,255,255,0.10); }
.satellite-theme .pop-title        { color: rgba(255,255,255,0.35); }
.satellite-theme .pop-unit-sub     { color: rgba(255,255,255,0.35); }
.satellite-theme .seg-ctrl         { background: rgba(255,255,255,0.09); }
.satellite-theme .seg-btn          { color: rgba(255,255,255,0.45); }
.satellite-theme .seg-btn.active   { background: rgba(255,255,255,0.14); color: #5AC8FA; }
.satellite-theme .pop-slider       { background: rgba(255,255,255,0.15); }
.satellite-theme .action-btn       { border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.75); }
.satellite-theme .action-btn.action-active { border-color:#5AC8FA; color:#5AC8FA; background: rgba(90,200,250,0.06); }
.satellite-theme .pop-divider      { border-color: rgba(255,255,255,0.08); }
.satellite-theme .style-name       { color: rgba(255,255,255,0.85); }
.satellite-theme .style-desc       { color: rgba(255,255,255,0.38); }
.satellite-theme .style-opt        { border-color:rgba(255,255,255,0.10); background:rgba(255,255,255,0.04); }
.satellite-theme .style-opt.active { border-color:#5AC8FA; background:rgba(90,200,250,0.08); }
.satellite-theme #stats-hud        { background: rgba(18,26,18,0.90); border-top-color: rgba(255,255,255,0.08); }
.satellite-theme .hud-key          { color: rgba(255,255,255,0.38); }
.satellite-theme .hud-val          { color: #5AC8FA; }

/* ── Responsive: popovers go above HUD on narrow screens ── */
@media (max-width: 480px) {
  .popover {
    left: 12px;
    top: auto !important;
    bottom: 64px;
    width: calc(100vw - 24px);
    max-height: 55vh;
  }
  #search-bar {
    width: calc(100vw - 80px);
  }
}
```

---

## JavaScript: State Model

Map ALL state properties to existing variables — do not create a parallel state system.

```js
const state = {
  // These must read from / write to the existing variables:
  get radius()    { return parseFloat(document.getElementById('radius-slider')?.value || 5); },
  get unit()      { return currentUnit; },         // existing var
  get mapStyle()  { return currentTileLayer; },    // existing var name — use whatever it is
  get ring2()     { return secondaryCircle !== null; },
  get ring2R()    { return parseFloat(document.getElementById('radius-slider-2')?.value || 0); },
  get setCtrMode(){ return clickModeActive; },     // existing var
  get measureMode(){ return measureModeActive; },  // existing var
  activeFab: 'radius',
};
```

---

## JavaScript: Computed Statistics

```js
function computeStats() {
  const r = state.radius;
  const rMi = state.unit === 'mi'  ? r
             : state.unit === 'km' ? r * 0.621371
             :                       r / 5280;

  const areaMi = Math.PI * rMi * rMi;
  const areaKm = areaMi * 2.58999;

  return {
    radius:   `${r.toFixed(state.unit === 'ft' ? 0 : 1)} ${state.unit}`,
    diameter: `${(r * 2).toFixed(state.unit === 'ft' ? 0 : 1)} ${state.unit}`,
    areaMi:   `${areaMi.toFixed(2)} mi²`,
    areaKm:   `${areaKm.toFixed(2)} km²`,
    perim:    `${(2 * Math.PI * r).toFixed(state.unit === 'ft' ? 0 : 2)} ${state.unit}`,
    elev:     document.getElementById('stat-elevation')?.textContent || '—',
    ring2:    state.ring2 ? `${state.ring2R.toFixed(state.unit === 'ft' ? 0 : 1)} ${state.unit}` : '—',
  };
}
```

---

## JavaScript: HUD Update

Call `updateHUD()` any time radius, unit, ring2, ring2R, or elevation changes.

```js
function updateHUD() {
  const s = computeStats();
  document.getElementById('hud-radius').textContent   = s.radius;
  document.getElementById('hud-diameter').textContent = s.diameter;
  document.getElementById('hud-area-mi').textContent  = s.areaMi;
  document.getElementById('hud-area-km').textContent  = s.areaKm;
  document.getElementById('hud-perim').textContent    = s.perim;
  document.getElementById('hud-elev').textContent     = s.elev;
  document.getElementById('hud-ring2').textContent    = s.ring2;

  // Update coordinates label
  const coordsEl = document.getElementById('coords-label');
  if (coordsEl) coordsEl.textContent = `Lat: ${currentLat.toFixed(5)}  Lng: ${currentLng.toFixed(5)}`;
}
```

---

## JavaScript: FAB & Popover Logic

```js
function closeAll() {
  document.querySelectorAll('.popover').forEach(p => p.classList.remove('pop-open'));
  document.querySelectorAll('.fab').forEach(f => f.classList.remove('fab-active'));
  state.activeFab = null;
}

function toggleFab(name) {
  if (state.activeFab === name) {
    closeAll();
  } else {
    closeAll();
    state.activeFab = name;
    document.getElementById('fab-' + name).classList.add('fab-active');
    const pop = document.getElementById('pop-' + name);
    pop.classList.add('pop-open');
    renderPopover(name);
  }
}

document.getElementById('fab-radius').addEventListener('click',   () => toggleFab('radius'));
document.getElementById('fab-tools').addEventListener('click',    () => toggleFab('tools'));
document.getElementById('fab-style').addEventListener('click',    () => toggleFab('style'));
document.getElementById('fab-settings').addEventListener('click', () => toggleFab('settings'));

document.getElementById('map').addEventListener('click', (e) => {
  if (!e.target.closest('#fab-stack') && !e.target.closest('.popover') && !e.target.closest('#search-bar')) {
    closeAll();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAll();
});
```

---

## JavaScript: Popover Content Renderers

```js
function renderPopover(name) {
  const el = document.getElementById('pop-' + name);
  if (!el || !el.classList.contains('pop-open')) return;
  const renderers = {
    radius:   radiusPopoverHTML,
    tools:    toolsPopoverHTML,
    style:    stylePopoverHTML,
    settings: settingsPopoverHTML,
  };
  el.innerHTML = renderers[name]();
  bindPopoverEvents(name);
}

function radiusPopoverHTML() {
  const maxR  = state.unit === 'ft' ? 264000 : 50;
  const step  = state.unit === 'ft' ? 500 : 0.1;
  const presets = state.unit === 'ft'
    ? [5280, 15840, 26400, 52800, 132000]
    : [1, 3, 5, 10, 25];
  const presetLabels = state.unit === 'ft'
    ? ['1 mi', '3 mi', '5 mi', '10 mi', '25 mi']
    : presets.map(p => `${p} ${state.unit}`);

  const presetsHTML = presets.map((p, i) => {
    const isActive = Math.abs(state.radius - p) < (state.unit === 'ft' ? 200 : 0.05);
    return `<div class="preset-btn ${isActive ? 'active' : ''}" data-preset="${p}">${presetLabels[i]}</div>`;
  }).join('');

  const unitBtns = ['mi','km','ft'].map(u =>
    `<div class="seg-btn ${state.unit === u ? 'active' : ''}" data-unit="${u}">${u}</div>`
  ).join('');

  const ring2Section = state.ring2 ? `
    <div class="ring2-box">
      <div class="ring2-label">2nd Ring · ${state.ring2R.toFixed(state.unit === 'ft' ? 0 : 1)} ${state.unit}</div>
      <input class="pop-slider" id="ring2-slider" type="range"
        min="0.1" max="${maxR}" step="${step}" value="${state.ring2R}">
    </div>` : '';

  return `
    <div class="pop-title">Radius</div>
    <div class="pop-bignum">${state.radius.toFixed(state.unit === 'ft' ? 0 : 1)}</div>
    <div class="pop-unit-sub">${state.unit}</div>
    <div class="seg-ctrl">${unitBtns}</div>
    <input class="pop-slider" id="radius-slider-new" type="range"
      min="0.1" max="${maxR}" step="${step}" value="${state.radius}">
    <div class="presets-row">${presetsHTML}</div>
    <hr class="pop-divider">
    <div class="pop-title">2nd Ring</div>
    <button class="action-btn ${state.ring2 ? 'action-active' : ''}" id="btn-ring2">
      <span>${state.ring2 ? '✓' : '+'}</span>
      ${state.ring2 ? 'Ring 2 Active' : 'Add 2nd Ring'}
    </button>
    ${ring2Section}
    <hr class="pop-divider">
    <button class="action-btn" id="btn-fit">⊡ &nbsp;Fit Circle in View</button>
  `;
}

function toolsPopoverHTML() {
  return `
    <div class="pop-title">Tools</div>
    <button class="action-btn" id="btn-print">🖨 &nbsp;Print / Save PDF</button>
    <button class="action-btn ${state.setCtrMode ? 'action-active' : ''}" id="btn-setctr">
      🎯 &nbsp;${state.setCtrMode ? 'Click map to set center…' : 'Set Map Center'}
    </button>
    <button class="action-btn ${state.measureMode ? 'action-active' : ''}" id="btn-measure">
      📐 &nbsp;${state.measureMode ? 'Measuring… (tap to stop)' : 'Measure Distance'}
    </button>
    <hr class="pop-divider">
    <div class="pop-title">View</div>
    <button class="action-btn" id="btn-fit2">⊡ &nbsp;Fit Circle in View</button>
    <button class="action-btn" id="btn-zoomin">＋ &nbsp;Zoom In</button>
    <button class="action-btn" id="btn-zoomout">－ &nbsp;Zoom Out</button>
  `;
}

function stylePopoverHTML() {
  const styles = [
    { id: 'street',    swatch: '#d6e4ef', name: 'Street',      desc: 'Roads & neighborhoods' },
    { id: 'satellite', swatch: '#182818', name: 'Satellite',   desc: 'Aerial imagery'        },
    { id: 'topo',      swatch: '#c9d9a8', name: 'Topographic', desc: 'Terrain & elevation'   },
  ];
  const optsHTML = styles.map(s => `
    <div class="style-opt ${state.mapStyle === s.id ? 'active' : ''}" data-style="${s.id}">
      <div class="style-swatch" style="background:${s.swatch}"></div>
      <div>
        <div class="style-name">${s.name}</div>
        <div class="style-desc">${s.desc}</div>
      </div>
    </div>`).join('');
  return `<div class="pop-title">Map Style</div>${optsHTML}`;
}
```

---

## JavaScript: Event Binding

```js
function bindPopoverEvents(name) {
  if (name === 'radius') {
    document.querySelectorAll('#pop-radius .seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentUnit = btn.dataset.unit;  // write to existing var
        renderPopover('radius');
        updateHUD();
        drawCircle();
      });
    });

    const rSlider = document.getElementById('radius-slider-new');
    if (rSlider) {
      rSlider.addEventListener('input', () => {
        // sync to existing radius slider or call drawCircle directly
        const existingSlider = document.getElementById('radius-slider');
        if (existingSlider) existingSlider.value = rSlider.value;
        drawCircle();
        updateHUD();
        const bignum = document.querySelector('#pop-radius .pop-bignum');
        if (bignum) bignum.textContent = parseFloat(rSlider.value).toFixed(currentUnit === 'ft' ? 0 : 1);
      });
      rSlider.addEventListener('change', () => renderPopover('radius'));
    }

    const r2Slider = document.getElementById('ring2-slider');
    if (r2Slider) {
      r2Slider.addEventListener('input', () => {
        const existingR2 = document.getElementById('radius-slider-2');
        if (existingR2) existingR2.value = r2Slider.value;
        drawSecondCircle();
        updateHUD();
      });
    }

    document.querySelectorAll('#pop-radius .preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const existingSlider = document.getElementById('radius-slider');
        if (existingSlider) existingSlider.value = btn.dataset.preset;
        drawCircle();
        renderPopover('radius');
        updateHUD();
      });
    });

    document.getElementById('btn-ring2')?.addEventListener('click', () => {
      // toggle existing secondary ring
      if (secondaryCircle) { removeSecondaryCircle(); } else { addSecondaryCircle(); }
      renderPopover('radius');
      updateHUD();
    });

    document.getElementById('btn-fit')?.addEventListener('click', () => fitCircleInView());
  }

  if (name === 'tools') {
    document.getElementById('btn-print')?.addEventListener('click', () => printMap());  // existing function
    document.getElementById('btn-setctr')?.addEventListener('click', () => {
      toggleClickMode();  // existing function
      renderPopover('tools');
    });
    document.getElementById('btn-measure')?.addEventListener('click', () => {
      toggleMeasureMode();  // existing function
      renderPopover('tools');
    });
    document.getElementById('btn-fit2')?.addEventListener('click',   () => fitCircleInView());
    document.getElementById('btn-zoomin')?.addEventListener('click', () => map.zoomIn());
    document.getElementById('btn-zoomout')?.addEventListener('click',() => map.zoomOut());
  }

  if (name === 'style') {
    document.querySelectorAll('#pop-style .style-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        applyMapStyle(opt.dataset.style);  // existing function
        renderPopover('style');
      });
    });
  }

  if (name === 'settings') {
    document.getElementById('btn-pin')?.addEventListener('click',    () => pinCurrentLocation());  // existing
    document.getElementById('btn-share')?.addEventListener('click',  () => copyShareLink());       // existing
    document.getElementById('btn-coords')?.addEventListener('click', () => copyCoords());          // existing
    document.getElementById('btn-qr')?.addEventListener('click',     () => generateQR());          // existing
    document.getElementById('btn-json')?.addEventListener('click',   () => exportJSON());          // existing
    document.getElementById('btn-embed')?.addEventListener('click',  () => copyEmbed());           // existing
    document.getElementById('opacity-slider')?.addEventListener('input', function() {
      currentOpacity = parseInt(this.value) / 100;
      if (circle) circle.setStyle({ fillOpacity: currentOpacity });
      document.getElementById('opacity-val').textContent = this.value + '%';
    });
    // Wire color swatches to existing color picker logic
    renderColorSwatches();
  }
}
```

---

## JavaScript: Map Style

```js
function applyMapStyle(style) {
  const mapEl = document.getElementById('map');
  mapEl.classList.remove('satellite-theme');
  if (style === 'satellite') mapEl.classList.add('satellite-theme');
  // Call existing tile switching logic here
}
```

---

## JavaScript: Stub Functions

```js
function updateMapCircles() { drawCircle(); if (state.ring2) drawSecondCircle(); }
function fitCircleInView()  { if (circle) map.fitBounds(circle.getBounds(), { padding: [20,20] }); }
function setMapCenterMode(active) { /* wire to existing toggleClickMode() */ }
function setMeasureMode(active)   { /* wire to existing toggleMeasureMode() */ }
function mapZoomIn()  { map.zoomIn(); }
function mapZoomOut() { map.zoomOut(); }
```

---

## Initialization

```js
document.addEventListener('DOMContentLoaded', () => {
  toggleFab('radius');
  updateHUD();
  updateMapCircles();
});
```

---

## Acceptance Criteria

- [ ] Old sidebar completely gone — no leftover DOM, no orphaned CSS
- [ ] Old header bar completely gone
- [ ] Map fills 100% viewport width and height
- [ ] Floating search bar centered at top, all search functionality works
- [ ] Four FABs visible at top-left stacked vertically
- [ ] Tapping a FAB opens its popover; tapping again closes it
- [ ] Only one popover open at a time
- [ ] Radius popover: big number, mi/km/ft toggle, slider, presets, 2nd Ring toggle + slider, Fit Circle
- [ ] Tools popover: Print/Save PDF, Set Map Center, Measure Distance, Fit Circle, Zoom In/Out
- [ ] Style popover: Street, Satellite, Topographic with swatches
- [ ] Settings popover: color swatches, opacity slider, pins list, share link, copy coords, QR, JSON, embed
- [ ] Stats HUD always shows 7 values: Radius, Diameter, Area mi², Area km², Perimeter, Elevation, 2nd Ring
- [ ] HUD updates live as slider is dragged
- [ ] Coordinates label always visible bottom-right
- [ ] 2nd Ring shows green circle on map when active
- [ ] Set Center and Measure modes mutually exclusive
- [ ] Clicking map closes all popovers
- [ ] Escape key closes all popovers
- [ ] Satellite theme: FABs/popovers go dark, HUD goes dark, accent shifts to `#5AC8FA`
- [ ] Search bar adapts to satellite theme
- [ ] No horizontal scrollbar after sidebar removal
- [ ] Mobile (< 480px): popovers appear above HUD at full width

---

## Notes for Claude Code

- **Do not refactor the underlying map logic.** Only touch DOM structure, CSS, and event wiring. All circle drawing, tile switching, print, measure, geocoding, and set-center logic already exists — call it, don't rewrite it.
- **Wire to existing function names.** The stub function names in this doc are placeholders — use whatever the actual function names are in the existing codebase. Read the code before wiring.
- **400-line file cap.** If any file exceeds 400 lines after this change, split immediately before committing.
- **vercel.json.** If any new JS or CSS files are created, add them to vercel.json builds array and add `{ "handle": "filesystem" }` before the SPA catch-all route.
- **Commit after each major section:** (1) Remove sidebar + header, (2) Add FABs + HUD + search bar HTML/CSS, (3) Wire JS. Three commits minimum.
- **Do not add any third-party dependencies.** Vanilla CSS and JS only.
- **Test the acceptance criteria checklist** before closing the session and updating SPRINT.md.
