# SPRINT 17 — Mobile First
## DrawRadius — drawradius.com

---

## Goal
Make DrawRadius a first-class mobile experience. Every feature that works on desktop must work correctly on iPhone SE (375px), iPhone 14 (390px), and iPad (768px). No new features — mobile fixes only.

---

## RM-080 — iOS Safe Area Support
**Problem:** On iPhones with home indicator (all Face ID phones), the HUD sits behind the home bar. On iPhones with notch/Dynamic Island, the search bar may be partially hidden.

**Fix in redesign.css:**
```css
/* Add to viewport meta in index.html */
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">

/* HUD safe area */
#stats-hud {
  padding-bottom: env(safe-area-inset-bottom);
  height: calc(54px + env(safe-area-inset-bottom));
}

/* Search bar safe area */
#search-bar {
  top: max(12px, env(safe-area-inset-top));
}

/* FAB stack safe area */
#fab-stack {
  top: max(12px, env(safe-area-inset-top));
}

/* Brand badge safe area */
#brand-badge {
  bottom: calc(62px + env(safe-area-inset-bottom));
}

/* Coords label safe area */
#coords-label {
  bottom: calc(60px + env(safe-area-inset-bottom));
}
```

---

## RM-081 — Touch Target Sizes
**Problem:** Preset buttons (1mi, 3mi, 5mi etc) have `padding: 4px 8px` — approximately 24px tall. Apple HIG minimum is 44px. Action buttons are 34px tall. These are hard to tap accurately on mobile.

**Fix:**
```css
@media (max-width: 768px) {
  .preset-btn {
    padding: 8px 12px;
    font-size: 12px;
    min-height: 36px;
  }
  
  .action-btn {
    padding: 12px 10px;
    font-size: 13px;
    min-height: 44px;
  }
  
  .seg-btn {
    padding: 8px 4px;
    font-size: 12px;
    min-height: 36px;
  }
  
  /* Color swatches in Settings */
  .color-swatch {
    width: 36px;
    height: 36px;
  }
}
```

---

## RM-082 — PWA Manifest
**Problem:** DrawRadius cannot be properly added to iPhone home screen. No app icons, no standalone mode, browser chrome shows when launched from home screen.

**Create manifest.json in repo root:**
```json
{
  "name": "DrawRadius",
  "short_name": "DrawRadius",
  "description": "Draw a radius. Know your area.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007AFF",
  "orientation": "any",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-192-maskable.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**Add to index.html <head>:**
```html
<link rel="manifest" href="/manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="DrawRadius">
<meta name="theme-color" content="#007AFF">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
```

**Create icons:** Generate from the Option A SVG logo mark at 192×192 and 512×512 PNG. Blue #007AFF background, white logo mark centered. Add to /icons/ folder in repo. Add icons folder to vercel.json builds array.

**Add to vercel.json builds:**
```json
{ "src": "manifest.json", "use": "@vercel/static" },
{ "src": "icons/**", "use": "@vercel/static" }
```

---

## RM-083 — Keyboard Handling
**Problem:** When the iOS keyboard opens, the visual viewport shrinks but the layout viewport doesn't. The HUD and popovers can overlap the keyboard or get hidden.

**Fix in ui.js:**
```javascript
// Listen for visual viewport resize (keyboard open/close)
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    const hud = document.getElementById('stats-hud');
    const keyboardHeight = window.innerHeight - window.visualViewport.height;
    if (keyboardHeight > 100) {
      // Keyboard is open — nudge HUD up
      hud.style.transform = `translateY(-${keyboardHeight}px)`;
    } else {
      hud.style.transform = '';
    }
  });
}
```

Also: on mobile, blur the search input when a suggestion is selected so keyboard dismisses automatically after search. In applyResult() add `document.getElementById('address-input').blur()` after setting value.

---

## RM-084 — iOS Scroll Fix
**Problem:** Popovers don't scroll smoothly on iOS Safari — they feel sticky or janky.

**Fix in redesign.css:**
```css
.popover {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
```

Also ensure popover has `overflow-y: auto` not `overflow-y: scroll` — auto is more performant on iOS.

---

## RM-085 — Disable Backdrop Blur on Mobile
**Problem:** `backdrop-filter: blur(10px)` on the HUD and search bar causes GPU thrashing during map pan on older iPhones (iPhone X, XR, 11). Results in dropped frames and janky map interaction.

**Fix in redesign.css:**
```css
@media (max-width: 768px) {
  #stats-hud {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: rgba(255,255,255,0.97);
  }
  
  #search-bar {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: rgba(255,255,255,0.97);
  }
  
  .popover {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  
  .satellite-theme #stats-hud {
    background: rgba(18,26,18,0.97);
  }
}
```

---

## RM-086 — Landscape Layout
**Problem:** On iPhone in landscape orientation, popovers at 55vh take up almost the entire screen height. The map is barely visible. Preset buttons wrap awkwardly.

**Fix in redesign.css:**
```css
@media (max-width: 768px) and (orientation: landscape) {
  .popover {
    max-height: 80vw;
    bottom: 54px;
    left: 60px;
    width: 280px;
  }
  
  #stats-hud {
    height: 44px;
  }
  
  .hud-val { font-size: 11px; }
  .hud-key { font-size: 7px; }
  
  #search-bar {
    width: calc(100vw - 200px);
  }
}
```

---

## RM-087 — Font Size Floor
**Problem:** Several elements render text below 11px on mobile which is illegible on small screens.

**Audit and fix:**
- `.hud-key` is 8px — increase to 10px minimum
- `.preset-btn` is 10px — increase to 12px on mobile
- `.action-btn` is 11px — increase to 13px on mobile
- `.pop-title` section headers — fine at current size
- Brand badge is 11px — fine

```css
@media (max-width: 768px) {
  .hud-key { font-size: 10px; }
  .preset-btn { font-size: 12px; }
  .action-btn { font-size: 13px; }
}
```

---

## RM-088 — Swipe to Close Popovers
**Problem:** On mobile there is no gesture to dismiss popovers. Desktop uses click-outside. Mobile users expect swipe-down to dismiss.

**Fix in ui.js:**
```javascript
function addSwipeToClose(el) {
  let startY = 0;
  el.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
  el.addEventListener('touchend', e => {
    const dy = e.changedTouches[0].clientY - startY;
    if (dy > 60) closeAll(); // swipe down 60px to close
  }, { passive: true });
}

// Call after each renderPopover()
document.querySelectorAll('.popover').forEach(addSwipeToClose);
```

Also add a visible drag handle at the top of each popover on mobile:
```css
@media (max-width: 768px) {
  .popover::before {
    content: '';
    display: block;
    width: 36px;
    height: 4px;
    background: rgba(0,0,0,0.15);
    border-radius: 2px;
    margin: 0 auto 12px;
  }
}
```

---

## Testing Checklist — Must Pass Before Sprint 17 Close

### iPhone SE (375px) — smallest target
- [ ] HUD visible above home indicator
- [ ] Search bar not hidden by notch
- [ ] All 4 FABs tappable without mis-taps
- [ ] Popovers scroll smoothly
- [ ] Preset buttons tappable without zooming
- [ ] Keyboard dismisses after selecting suggestion
- [ ] Map pans smoothly without HUD lag

### iPhone 14 (390px)
- [ ] Safe area insets correct
- [ ] Landscape mode usable
- [ ] PWA: Add to home screen → launches standalone
- [ ] Swipe down closes popover

### iPad (768px)
- [ ] Popovers don't take full width
- [ ] Touch targets adequate
- [ ] Landscape and portrait both work

---

## Implementation Order
1. RM-080 iOS safe area (highest impact, fixes home indicator overlap)
2. RM-085 disable backdrop blur (performance)
3. RM-081 touch targets (usability)
4. RM-087 font sizes (readability)
5. RM-083 keyboard handling (UX)
6. RM-084 iOS scroll fix (smoothness)
7. RM-086 landscape layout (edge case)
8. RM-082 PWA manifest (home screen install)
9. RM-088 swipe to close (polish)

---

## Notes for Claude Code
- Test every CSS change at 375px viewport width in Chrome DevTools before committing
- Use `env(safe-area-inset-bottom)` with a fallback: `calc(54px + env(safe-area-inset-bottom, 0px))`
- Never use `100vh` on mobile — use `100dvh` (dynamic viewport height) or `window.innerHeight`
- Do not use `position: fixed` on any new elements
- Commit after each ticket
- Run `wc -l redesign.css ui.js` after each change to check 400-line cap
