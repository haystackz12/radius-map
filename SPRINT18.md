# SPRINT 18 — Mobile Bottom Sheet Redesign
## DrawRadius — drawradius.com

---

## Goal
Replace the desktop FAB + popover UI on mobile with a native-feeling bottom sheet. Desktop layout (≥769px) completely untouched. Mobile (≤768px) gets a purpose-built bottom sheet. All mobile code goes in new files: `mobile.css` and `mobile.js`.

---

## Design — Three Sheet States

### State 1 — Collapsed (default on load)
- Sheet height: 72px
- Shows: drag handle + radius number + Radius/Drive Time mode pills
- Map visible: ~85%
- Trigger to expand: tap sheet or swipe up

### State 2 — Half open (primary use state)
- Sheet height: 220px
- Shows: mode toggle, big radius number, unit toggle, slider, 5 presets, 3 stat cards (Radius, Area mi², Elevation), Pin button + Print button
- Map visible: ~45%
- Trigger: swipe up from collapsed

### State 3 — Full open (advanced)
- Sheet height: 85vh, scrollable
- Shows: everything in half + pinned locations list, Find Nearest, Export/Share, Map style selector, Reset
- Map visible: ~15% strip at top
- Trigger: swipe up from half

### Always visible
- Search bar pinned at top, full width
- Tap map → collapses sheet to State 1

---

## Files

| File | Action |
|---|---|
| `mobile.css` | All mobile overrides — must stay under 400 lines |
| `mobile.js` | Sheet logic, gesture handling, content rendering — under 400 lines |
| `index.html` | Add `#mobile-sheet` div, link `mobile.js` |
| `ui.js` | Add `refreshMobileSheet()` calls after `updateHUD()` |
| `app.js` | Add `refreshMobileSheet()` call after `drawCircle()` |
| `vercel.json` | Add `mobile.js` and `mobile.css` to builds array |

**DO NOT modify `redesign.css` — desktop layout is frozen.**

---

## RM-089 — Layout Foundation

### Add to index.html (after #stats-hud):
```html
<div id="mobile-sheet">
  <div id="mobile-sheet-handle"></div>
  <div id="mobile-sheet-content"></div>
</div>
```

### Add mobile.js script tag after ui.js:
```html
<script src="mobile.js" defer></script>
```

### mobile.css — hide desktop, show mobile:
```css
@media (max-width: 768px) {
  #fab-stack { display: none !important; }
  #pop-radius, #pop-tools, #pop-style, #pop-settings { display: none !important; }
  #popover-backdrop { display: none !important; }
  #stats-hud { display: none !important; }
  #coords-label { display: none !important; }
  #brand-badge { display: none !important; }
  #mobile-sheet { display: block !important; }

  #search-bar {
    top: max(10px, env(safe-area-inset-top, 10px));
    left: 10px;
    right: 10px;
    width: auto;
    transform: none;
    border-radius: 14px;
  }
}

#mobile-sheet { display: none; }
```

---

## RM-090 — Bottom Sheet CSS

### mobile.css — sheet structure:
```css
@media (max-width: 768px) {
  #mobile-sheet {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    background: #ffffff;
    border-radius: 20px 20px 0 0;
    z-index: 1000;
    transition: height 0.35s cubic-bezier(0.4,0,0.2,1);
    height: 72px;
    overflow: hidden;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    box-shadow: 0 -2px 20px rgba(0,0,0,0.12);
  }

  #mobile-sheet.sheet-half { height: 220px; }
  #mobile-sheet.sheet-full { height: 85dvh; overflow-y: auto; -webkit-overflow-scrolling: touch; }

  #mobile-sheet-handle {
    width: 36px; height: 4px;
    background: rgba(0,0,0,0.15);
    border-radius: 2px;
    margin: 10px auto 0;
  }

  #mobile-sheet-content { padding: 8px 14px 16px; }

  .satellite-theme #mobile-sheet { background: rgba(18,26,18,0.97); }

  .m-mode-toggle { display:flex; background:rgba(0,0,0,0.06); border-radius:10px; padding:2px; margin-bottom:10px; }
  .m-mode-btn { flex:1; text-align:center; font-size:13px; font-weight:500; padding:7px; border-radius:8px; color:rgba(0,0,0,0.4); cursor:pointer; }
  .m-mode-btn.active { background:#fff; color:#007AFF; font-weight:600; box-shadow:0 1px 4px rgba(0,0,0,0.12); }

  .m-bignum { font-size:32px; font-weight:700; color:#007AFF; letter-spacing:-1.5px; line-height:1; cursor:pointer; }
  .m-unit-toggle { display:flex; gap:4px; margin-left:auto; align-items:center; }
  .m-unit-btn { font-size:11px; font-weight:600; padding:4px 9px; border-radius:7px; cursor:pointer; }
  .m-unit-btn.active { background:#007AFF; color:#fff; }
  .m-unit-btn.inactive { background:rgba(0,0,0,0.05); color:rgba(0,0,0,0.4); }

  .m-slider { width:100%; height:4px; -webkit-appearance:none; appearance:none; background:rgba(0,0,0,0.10); border-radius:2px; outline:none; cursor:pointer; margin:10px 0 12px; }
  .m-slider::-webkit-slider-thumb { -webkit-appearance:none; width:24px; height:24px; border-radius:50%; background:#fff; box-shadow:0 1px 6px rgba(0,0,0,0.28); border:0.5px solid rgba(0,0,0,0.12); }

  .m-presets { display:grid; grid-template-columns:repeat(5,1fr); gap:5px; margin-bottom:12px; }
  .m-preset { text-align:center; font-size:12px; font-weight:600; padding:7px 0; border-radius:9px; cursor:pointer; }
  .m-preset.active { background:#007AFF; color:#fff; }
  .m-preset.inactive { background:rgba(0,122,255,0.08); color:#007AFF; border:0.5px solid rgba(0,122,255,0.2); }

  .m-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin-bottom:12px; }
  .m-stat { background:rgba(0,122,255,0.06); border-radius:10px; padding:8px 6px; text-align:center; }
  .m-stat-val { font-size:13px; font-weight:700; color:#007AFF; }
  .m-stat-key { font-size:10px; color:rgba(0,0,0,0.38); margin-top:2px; }

  .m-actions { display:flex; gap:8px; }
  .m-action-primary { flex:1; height:44px; background:#007AFF; border-radius:13px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:14px; font-weight:600; border:none; cursor:pointer; }
  .m-action-secondary { height:44px; padding:0 16px; background:rgba(0,0,0,0.05); border-radius:13px; display:flex; align-items:center; justify-content:center; color:rgba(0,0,0,0.65); font-size:14px; font-weight:500; border:0.5px solid rgba(0,0,0,0.1); cursor:pointer; }

  .m-section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:rgba(0,0,0,0.3); margin:14px 0 6px; }
  .m-menu-row { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:0.5px solid rgba(0,0,0,0.06); cursor:pointer; }
  .m-menu-row:last-child { border-bottom:none; }
  .m-menu-icon { width:32px; height:32px; border-radius:9px; background:rgba(0,122,255,0.1); display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:15px; }
  .m-menu-label { font-size:14px; font-weight:500; color:rgba(0,0,0,0.8); }
  .m-menu-arrow { margin-left:auto; font-size:16px; color:rgba(0,0,0,0.25); }
  .m-destructive { color:#FF3B30 !important; }
  .m-icon-destructive { background:rgba(255,59,48,0.1) !important; }

  .m-peek-row { display:flex; align-items:center; justify-content:space-between; padding:6px 14px 0; }
  .m-peek-num { font-size:20px; font-weight:700; color:#007AFF; letter-spacing:-0.5px; }
  .m-peek-unit { font-size:12px; color:rgba(0,0,0,0.4); margin-left:3px; }
  .m-peek-pill { font-size:11px; font-weight:600; padding:4px 10px; border-radius:20px; cursor:pointer; }
  .m-peek-pill.active { background:#007AFF; color:#fff; }
  .m-peek-pill.inactive { background:rgba(0,0,0,0.06); color:rgba(0,0,0,0.45); }
}
```

---

## RM-091 — mobile.js

Create `mobile.js` with:
- `isMobile()` — returns `window.innerWidth <= 768`
- `setSheetState(state)` — sets class and calls `renderSheetContent()`
- `renderSheetContent()` — renders collapsed/half/full HTML into `#mobile-sheet-content`
- `renderPeekRow()` — collapsed state HTML (radius number + mode pills)
- `renderHalfContent()` — half state HTML (mode toggle + slider + presets + stats + actions)
- `renderDriveTimeHalf()` — drive time variant of half state
- `renderFullContent()` — full state (half + pins list + tools + style + reset)
- `bindSheetEvents()` — event delegation for all sheet interactions
- `initSheetGestures()` — touchstart/move/end with snap-to-state logic
- `initMapTapCollapse()` — tap map collapses sheet
- `refreshMobileSheet()` — exported function called by ui.js/app.js after updates

### Snap logic:
- Drag handle is the primary drag target
- Snap points: 72px (collapsed), 220px (half), 85dvh (full)
- Snap to nearest on touchend
- `sheet.style.transition = 'none'` during drag, restore on touchend

### Sheet initializes after splash fades (2000ms delay).

---

## RM-092 — Hook into existing JS

In `ui.js` — after every `updateHUD()` call:
```javascript
if (typeof refreshMobileSheet === 'function') refreshMobileSheet();
```

In `app.js` — after `drawCircle()` resolves:
```javascript
if (typeof refreshMobileSheet === 'function') refreshMobileSheet();
```

In `pins.js` — after `pinCurrent()` completes:
```javascript
if (typeof refreshMobileSheet === 'function') refreshMobileSheet();
```

---

## RM-093 — Mobile search UX

In `app.js` `applyResult()`, after existing code, add:
```javascript
if (typeof isMobile === 'function' && isMobile()) {
  document.getElementById('address-input').blur();
  if (typeof setSheetState === 'function') setSheetState('half');
}
```

---

## Testing Checklist

### Desktop (1280px) — must be unchanged
- [ ] FABs visible, popovers work
- [ ] Mobile sheet not visible
- [ ] All existing features work

### Mobile (375px iPhone SE)
- [ ] FABs hidden, mobile sheet visible
- [ ] Loads in collapsed state after splash
- [ ] Drag handle visible in collapsed state
- [ ] Radius number and mode pills visible when collapsed
- [ ] Tap collapsed → expands to half
- [ ] Half state: slider updates circle, presets work, unit toggle works
- [ ] Stats cards show real values
- [ ] Pin button → pins location
- [ ] Swipe up to full → pins list, tools, reset visible
- [ ] Swipe down → snaps to half
- [ ] Swipe down again → snaps to collapsed
- [ ] Tap map → collapses to State 1
- [ ] Drive time mode → renders drive time controls
- [ ] Map style changes → tile layer switches
- [ ] Reset → confirmation, clears map
- [ ] Safe area → sheet respects home indicator bar
- [ ] Search → keyboard dismisses, sheet opens to half

---

## Hard Constraints
- `redesign.css` — zero changes
- `mobile.css` — under 400 lines
- `mobile.js` — under 400 lines (split into mobile-sheet.js if needed)
- No `position: fixed`
- No `100vh` — use `100dvh` or `window.innerHeight`
- All touch targets minimum 44px height
- Commit after each RM ticket: RM-089, RM-090, RM-091, RM-092, RM-093
