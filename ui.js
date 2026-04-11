/* ── FAB & Popover State ── */
let activeFab = null;

function closeAll() {
  document.querySelectorAll('.popover').forEach(p => p.classList.remove('pop-open'));
  document.querySelectorAll('.fab').forEach(f => f.classList.remove('fab-active'));
  activeFab = null;
  const bd = document.getElementById('popover-backdrop');
  if (bd) bd.style.display = 'none';
  // Note: do NOT hide suggestions here — handled separately
}

function toggleFab(name) {
  if (activeFab === name) { closeAll(); return; }
  closeAll();
  activeFab = name;
  document.getElementById('fab-' + name).classList.add('fab-active');
  const pop = document.getElementById('pop-' + name);
  pop.classList.add('pop-open');
  const bd = document.getElementById('popover-backdrop');
  if (bd) bd.style.display = 'block';
  renderPopover(name);
}

/* ── FAB Click Listeners ── */
document.getElementById('fab-radius').addEventListener('click', () => toggleFab('radius'));
document.getElementById('fab-tools').addEventListener('click', () => toggleFab('tools'));
document.getElementById('fab-style').addEventListener('click', () => toggleFab('style'));
document.getElementById('fab-settings').addEventListener('click', () => toggleFab('settings'));

/* ── Backdrop closes all popovers (unless a tool mode is active) ── */
const _backdrop = document.getElementById('popover-backdrop');
if (_backdrop) _backdrop.addEventListener('click', (e) => {
  if (distanceModeActive || clickModeActive) {
    // Pass click through to map for tool modes
    _backdrop.style.display = 'none';
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY }));
    _backdrop.style.display = 'block';
    return;
  }
  closeAll();
});

/* ── Popover Renderers ── */
function renderPopover(name) {
  const el = document.getElementById('pop-' + name);
  if (!el || !el.classList.contains('pop-open')) return;
  const renderers = { radius: radiusPopoverHTML, tools: toolsPopoverHTML, style: stylePopoverHTML, settings: settingsPopoverHTML };
  el.innerHTML = renderers[name]();
  disableMapPropagation();
}

function radiusPopoverHTML() {
  const mode = typeof radiusMode !== 'undefined' ? radiusMode : 'radius';
  const modeToggle = `<div class="pop-title">Map mode</div><div class="seg-ctrl" style="margin-bottom:10px;"><div class="seg-btn ${mode === 'radius' ? 'active' : ''}" data-mode="radius">Radius</div><div class="seg-btn ${mode === 'drivetime' ? 'active' : ''}" data-mode="drivetime">Drive time</div></div>`;
  if (mode === 'drivetime') return modeToggle + drivetimePopoverHTML();
  const r = parseFloat(document.getElementById('radius-slider').value);
  const u = currentUnit;
  const maxR = u === 'ft' ? 26400 : (u === 'km' ? 80 : 50);
  const step = u === 'ft' ? 10 : 0.1;
  const minR = u === 'ft' ? 100 : 0.1;
  const presets = u === 'ft' ? [500, 1000, 2640, 5280, 26400] : [1, 3, 5, 10, 25];
  const pLabels = u === 'ft' ? presets.map(p => p >= 5280 ? (p/5280) + ' mi' : p + ' ft') : presets.map(p => p + ' ' + u);
  const presetsHTML = presets.map((p, i) => {
    const val = u === 'km' ? +(p * 1.60934).toFixed(1) : p;
    const active = Math.abs(r - val) < (u === 'ft' ? 50 : 0.05);
    return `<div class="preset-btn ${active ? 'active' : ''}" data-preset="${val}">${pLabels[i]}</div>`;
  }).join('');
  const unitBtns = ['mi','km','ft'].map(uu => `<div class="seg-btn ${u === uu ? 'active' : ''}" data-unit="${uu}">${uu}</div>`).join('');
  const hasRing2 = concentricActive;
  const r2 = parseFloat(document.getElementById('radius-slider-2').value);
  const ring2Sec = hasRing2 ? `<div class="ring2-box"><div class="ring2-label">2nd Ring · ${u === 'ft' ? Math.round(r2) : r2.toFixed(1)} ${u}</div><input class="pop-slider" id="ring2-slider" type="range" min="${minR}" max="${maxR}" step="${step}" value="${r2}"></div>` : '';
  return modeToggle + `<div id="pop-bignum-wrap" style="margin-bottom:10px;"><span class="pop-bignum" id="pop-bignum" data-action="edit-radius" title="Click to enter exact value" style="cursor:pointer;">${u === 'ft' ? Math.round(r) : r.toFixed(1)}</span><span class="pop-unit-sub" style="margin-left:4px;">${u}</span></div><div class="seg-ctrl">${unitBtns}</div><input class="pop-slider" id="radius-slider-new" type="range" min="${minR}" max="${maxR}" step="${step}" value="${r}"><div class="presets-row">${presetsHTML}</div><hr class="pop-divider"><div class="pop-title">2nd Ring</div><button class="action-btn ${hasRing2 ? 'action-active' : ''}" data-action="ring2"><span>${hasRing2 ? '✓' : '+'}</span> ${hasRing2 ? 'Ring 2 Active' : 'Add 2nd Ring'}</button>${ring2Sec}<hr class="pop-divider"><button class="action-btn" data-action="fit">⊡  Fit Circle in View</button>`;
}

function drivetimePopoverHTML() {
  const t = typeof travelTimeMinutes !== 'undefined' ? travelTimeMinutes : 15;
  const tm = typeof transportMode !== 'undefined' ? transportMode : 'driving-car';
  const modes = [
    { id: 'driving-car', icon: '\uD83D\uDE97', label: 'Drive' },
    { id: 'foot-walking', icon: '\uD83D\uDEB6', label: 'Walk' },
    { id: 'cycling-regular', icon: '\uD83D\uDEB2', label: 'Cycle' }
  ];
  const modeBtns = modes.map(m => `<div class="seg-btn ${tm === m.id ? 'active' : ''}" data-transport="${m.id}">${m.icon} ${m.label}</div>`).join('');
  const presets = [5, 10, 15, 30, 60];
  const presetBtns = presets.map(p => `<div class="preset-btn ${t === p ? 'active' : ''}" data-time="${p}">${p} min</div>`).join('');
  return `<div class="pop-bignum" style="margin-bottom:2px;">${t}</div><div class="pop-unit-sub">minutes</div><div class="seg-ctrl">${modeBtns}</div><input class="pop-slider" id="travel-time-slider" type="range" min="5" max="60" step="5" value="${t}"><div class="presets-row">${presetBtns}</div><hr class="pop-divider"><button class="action-btn" data-action="fit-iso">⊡  Fit Zone in View</button>`;
}

function toolsPopoverHTML() {
  return `<div class="pop-title">Tools</div><button class="action-btn" data-action="print">🖨  Print / Save PDF</button><button class="action-btn ${clickModeActive ? 'action-active' : ''}" data-action="setctr">🎯  ${clickModeActive ? 'Click map to set center…' : 'Set Map Center'}</button><button class="action-btn ${distanceModeActive ? 'action-active' : ''}" data-action="measure">📐  ${distanceModeActive ? 'Measuring… (tap to stop)' : 'Measure Distance'}</button><hr class="pop-divider"><div class="pop-title">View</div><button class="action-btn" data-action="fit">⊡  Fit Circle in View</button><button class="action-btn" data-action="zoomin">＋  Zoom In</button><button class="action-btn" data-action="zoomout">－  Zoom Out</button>`;
}

function stylePopoverHTML() {
  const styles = [
    { id: 'street', swatch: '#d6e4ef', name: 'Street', desc: 'Roads & neighborhoods' },
    { id: 'satellite', swatch: '#182818', name: 'Satellite', desc: 'Aerial imagery' },
    { id: 'topo', swatch: '#c9d9a8', name: 'Topographic', desc: 'Terrain & elevation' }
  ];
  const curStyle = (typeof currentTileName !== 'undefined' ? currentTileName : null) || document.getElementById('map-style-badge')?.textContent?.toLowerCase() || 'street';
  return `<div class="pop-title">Map Style</div>` + styles.map(s => `<div class="style-opt ${curStyle === s.id ? 'active' : ''}" data-style="${s.id}"><div class="style-swatch" style="background:${s.swatch}"></div><div><div class="style-name">${s.name}</div><div class="style-desc">${s.desc}</div></div></div>`).join('');
}

function settingsPopoverHTML() {
  const swatches = COLORS.map(c => `<div class="color-sw ${c.hex === currentColor ? 'active' : ''}" data-color="${c.hex}" style="background:${c.hex}" title="${c.name}"></div>`).join('');
  const opVal = Math.round(currentOpacity * 100);
  const pinItems = pins.map(p => `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:11px;"><span style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0;"></span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:rgba(0,0,0,0.7);">${p.name || p.label}</span><span style="cursor:pointer;color:rgba(0,0,0,0.3);font-size:14px;" data-action="remove-pin" data-pin-id="${p.id}">×</span></div>`).join('');
  return `<div class="pop-title">Appearance</div><div class="pop-title" style="font-size:9px;margin-bottom:6px;">Circle color</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">${swatches}</div><div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><span style="font-size:10px;color:rgba(0,0,0,0.45);flex:1;">Fill opacity</span><input type="range" class="pop-slider" id="pop-opacity" min="0" max="40" step="1" value="${opVal}" style="flex:2;margin:0;"><span style="font-size:10px;color:#007AFF;width:28px;text-align:right;" id="pop-opacity-val">${opVal}%</span></div><hr class="pop-divider"><div class="pop-title">Pins</div><button class="action-btn" data-action="pin">📍  Pin this location</button><div style="font-size:9px;color:rgba(0,0,0,0.38);padding:2px 2px 6px;line-height:1.4;">Saves current circle. Search a new address to start a new radius.</div>${pinItems}<hr class="pop-divider"><div class="pop-title">Export</div><button class="action-btn" data-action="share">🔗  Copy share link</button><button class="action-btn" data-action="coords">📋  Copy coordinates</button><button class="action-btn" data-action="qr">⬛  Generate QR code</button><button class="action-btn" data-action="json">⬇  Download as JSON</button><button class="action-btn" data-action="embed">‹›  Copy embed code</button>`;
}

/* ── Floating tool cancel pill ── */
function showToolPill(label, onCancel) {
  let pill = document.getElementById('tool-pill');
  if (!pill) {
    pill = document.createElement('div');
    pill.id = 'tool-pill';
    pill.style.cssText = 'position:absolute;top:70px;left:50%;transform:translateX(-50%);background:rgba(0,122,255,0.92);color:#fff;font-family:system-ui,sans-serif;font-size:12px;font-weight:600;padding:8px 16px;border-radius:20px;box-shadow:0 2px 12px rgba(0,122,255,0.4);cursor:pointer;z-index:1002;display:flex;align-items:center;gap:8px;white-space:nowrap;backdrop-filter:blur(8px);';
    document.getElementById('map').appendChild(pill);
  }
  pill.innerHTML = `<span>${label}</span><span style="background:rgba(255,255,255,0.25);border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:14px;line-height:1;">×</span>`;
  pill.style.display = 'flex';
  pill.onclick = onCancel;
}

function hideToolPill() {
  const pill = document.getElementById('tool-pill');
  if (pill) pill.style.display = 'none';
}
document.getElementById('pop-radius').addEventListener('click', function(e) {
  const modeBtn = e.target.closest('[data-mode]');
  if (modeBtn) {
    const newMode = modeBtn.dataset.mode;
    if (newMode !== radiusMode) {
      radiusMode = newMode;
      if (radiusMode === 'radius') { removeIsochrone(); drawCircle(); }
      else { if (circle) map.removeLayer(circle); if (marker) map.removeLayer(marker); debouncedFetchIsochrone(); }
      rebuildPinLayers(newMode);
      updateHUD();
    }
    renderPopover('radius'); return;
  }
  const transport = e.target.closest('[data-transport]');
  if (transport) { transportMode = transport.dataset.transport; removeIsochrone(); drawCenterMarker(); debouncedFetchIsochrone(); renderPopover('radius'); return; }
  const timePre = e.target.closest('[data-time]');
  if (timePre) { travelTimeMinutes = parseInt(timePre.dataset.time); document.getElementById('travel-time-slider').value = travelTimeMinutes; debouncedFetchIsochrone(); updateHUD(); renderPopover('radius'); return; }
  const seg = e.target.closest('.seg-btn'); if (seg && seg.dataset.unit) { setUnit(seg.dataset.unit); renderPopover('radius'); updateHUD(); return; }
  const pre = e.target.closest('.preset-btn'); if (pre && pre.dataset.preset) { document.getElementById('radius-slider').value = pre.dataset.preset; drawCircle(); updateHUD(); renderPopover('radius'); return; }
  const act = e.target.closest('[data-action]'); if (!act) return;
  if (act.dataset.action === 'edit-radius') {
    const wrap = document.getElementById('pop-bignum-wrap');
    const cur = document.getElementById('radius-slider').value;
    const u = currentUnit;
    const minR = u === 'ft' ? 100 : 0.1;
    const maxR = u === 'ft' ? 26400 : (u === 'km' ? 80 : 50);
    wrap.innerHTML = `<input id="radius-exact-input" type="number" min="${minR}" max="${maxR}" step="${u === 'ft' ? 10 : 0.1}" value="${parseFloat(cur).toFixed(u === 'ft' ? 0 : 1)}" style="font-size:28px;font-weight:700;color:#007AFF;letter-spacing:-1px;border:none;border-bottom:2px solid #007AFF;background:transparent;outline:none;width:80px;font-family:system-ui,sans-serif;"><span class="pop-unit-sub" style="margin-left:4px;">${u}</span>`;
    const inp = document.getElementById('radius-exact-input');
    inp.focus(); inp.select();
    inp.addEventListener('keydown', ev => {
      if (ev.key === 'Enter') {
        const val = parseFloat(inp.value);
        if (!isNaN(val) && val >= minR && val <= maxR) {
          document.getElementById('radius-slider').value = val;
          drawCircle(); updateHUD(); renderPopover('radius');
        } else {
          inp.style.borderBottomColor = '#E24B4A';
          setTimeout(() => { inp.style.borderBottomColor = '#007AFF'; }, 800);
        }
      }
      if (ev.key === 'Escape') renderPopover('radius');
    });
    inp.addEventListener('blur', () => {
      const val = parseFloat(inp.value);
      if (!isNaN(val) && val >= minR && val <= maxR) {
        document.getElementById('radius-slider').value = val;
        drawCircle(); updateHUD();
      }
      renderPopover('radius');
    });
    return;
  }
  if (act.dataset.action === 'ring2') { toggleConcentric(); renderPopover('radius'); updateHUD(); }
  if (act.dataset.action === 'fit') fitCircle();
  if (act.dataset.action === 'fit-iso') { if (isochroneLayer) map.fitBounds(isochroneLayer.getBounds(), { padding: [40, 40] }); }
});
document.getElementById('pop-radius').addEventListener('input', function(e) {
  if (e.target.id === 'radius-slider-new') { document.getElementById('radius-slider').value = e.target.value; drawCircle(); updateHUD(); const bn = document.getElementById('pop-bignum'); if (bn) bn.textContent = currentUnit === 'ft' ? Math.round(parseFloat(e.target.value)) : parseFloat(e.target.value).toFixed(1); }
  if (e.target.id === 'ring2-slider') { document.getElementById('radius-slider-2').value = e.target.value; drawSecondCircle(); updateHUD(); }
  if (e.target.id === 'travel-time-slider') { travelTimeMinutes = parseInt(e.target.value); removeIsochrone(); drawCenterMarker(); const bn = document.getElementById('pop-bignum'); if (bn) bn.textContent = travelTimeMinutes; updateHUD(); }
});
document.getElementById('pop-radius').addEventListener('change', function(e) {
  if (e.target.id === 'travel-time-slider') { travelTimeMinutes = parseInt(e.target.value); debouncedFetchIsochrone(); updateHUD(); renderPopover('radius'); }
});

document.getElementById('pop-tools').addEventListener('click', function(e) {
  const act = e.target.closest('[data-action]'); if (!act) return;
  if (act.dataset.action === 'print') printMap();
  if (act.dataset.action === 'setctr') {
    toggleClickMode();
    const bd = document.getElementById('popover-backdrop');
    if (bd) bd.style.display = 'none';
    if (clickModeActive) {
      showToolPill('Click map to set center… tap to cancel', () => { toggleClickMode(); hideToolPill(); renderPopover('tools'); });
    } else {
      hideToolPill();
    }
    renderPopover('tools');
  }
  if (act.dataset.action === 'measure') {
    toggleDistanceMode();
    const bd = document.getElementById('popover-backdrop');
    if (bd) bd.style.display = 'none';
    if (distanceModeActive) {
      showToolPill('Measuring distance… tap to stop', () => { toggleDistanceMode(); hideToolPill(); renderPopover('tools'); });
    } else {
      hideToolPill();
    }
    renderPopover('tools');
  }
  if (act.dataset.action === 'fit') fitCircle();
  if (act.dataset.action === 'zoomin') map.zoomIn();
  if (act.dataset.action === 'zoomout') map.zoomOut();
});

document.getElementById('pop-style').addEventListener('click', function(e) {
  const opt = e.target.closest('.style-opt'); if (!opt) return;
  setTileLayer(opt.dataset.style);
  document.getElementById('map').classList.toggle('satellite-theme', opt.dataset.style === 'satellite');
  renderPopover('style');
});

document.getElementById('pop-settings').addEventListener('click', function(e) {
  const sw = e.target.closest('.color-sw');
  if (sw) { currentColor = sw.dataset.color; drawCircle(); renderPopover('settings'); return; }
  const act = e.target.closest('[data-action]'); if (!act) return;
  if (act.dataset.action === 'pin') { pinCurrent(); renderPopover('settings'); }
  if (act.dataset.action === 'share') copyShareLink();
  if (act.dataset.action === 'coords') copyCoords();
  if (act.dataset.action === 'qr') generateQR();
  if (act.dataset.action === 'json') exportData();
  if (act.dataset.action === 'embed') copyEmbed();
  if (act.dataset.action === 'remove-pin') { removePin(parseInt(act.dataset.pinId)); renderPopover('settings'); }
});
document.getElementById('pop-settings').addEventListener('input', function(e) {
  if (e.target.id === 'pop-opacity') {
    currentOpacity = parseInt(e.target.value) / 100;
    if (circle) circle.setStyle({ fillOpacity: currentOpacity });
    const valEl = document.getElementById('pop-opacity-val');
    if (valEl) valEl.textContent = e.target.value + '%';
    document.getElementById('opacity-slider').value = e.target.value;
  }
});

/* ── HUD ── */
function computeStats() {
  const mode = typeof radiusMode !== 'undefined' ? radiusMode : 'radius';
  if (mode === 'drivetime') {
    const t = typeof travelTimeMinutes !== 'undefined' ? travelTimeMinutes : 15;
    const tm = typeof transportMode !== 'undefined' ? transportMode : 'driving-car';
    const icon = { 'driving-car': '\uD83D\uDE97', 'foot-walking': '\uD83D\uDEB6', 'cycling-regular': '\uD83D\uDEB2' }[tm] || '';
    return { radius: t + ' min ' + icon, diameter: '—', areaMi: '—', areaKm: '—', perim: '—', elev: '—', ring2: '—' };
  }
  const r = parseFloat(document.getElementById('radius-slider').value);
  const u = currentUnit;
  const rMi = u === 'mi' ? r : u === 'km' ? r / 1.60934 : r / 5280;
  const rKm = u === 'km' ? r : u === 'mi' ? r * 1.60934 : r * 0.0003048;
  return {
    radius: (u === 'ft' ? Math.round(r) : r.toFixed(1)) + ' ' + u,
    diameter: (u === 'ft' ? Math.round(r * 2) : (r * 2).toFixed(1)) + ' ' + u,
    areaMi: (Math.PI * rMi * rMi).toFixed(2),
    areaKm: (Math.PI * rKm * rKm).toFixed(2),
    perim: (u === 'ft' ? Math.round(2 * Math.PI * r).toLocaleString() : (2 * Math.PI * r).toFixed(2)) + ' ' + u,
    elev: (() => {
      const el = document.getElementById('elevation-box');
      if (!el) return '—';
      const raw = el.textContent || '';
      if (!raw || raw.includes('loading') || raw.includes('Unavailable') || raw.trim() === '') return '—';
      const match = raw.match(/([\d,]+)\s*ft/);
      return match ? match[1] + ' ft' : '—';
    })(),
    ring2: concentricActive ? ((u === 'ft' ? Math.round(parseFloat(document.getElementById('radius-slider-2').value)) : parseFloat(document.getElementById('radius-slider-2').value).toFixed(1)) + ' ' + u) : '—'
  };
}

function updateHUD() {
  const s = computeStats();
  document.getElementById('hud-radius').textContent = s.radius;
  document.getElementById('hud-diameter').textContent = s.diameter;
  document.getElementById('hud-area-mi').textContent = s.areaMi;
  document.getElementById('hud-area-km').textContent = s.areaKm;
  document.getElementById('hud-perim').textContent = s.perim;
  document.getElementById('hud-elev').textContent = s.elev;
  document.getElementById('hud-ring2').textContent = s.ring2;
  const cl = document.getElementById('coords-label');
  if (cl) cl.textContent = `Lat: ${currentLat.toFixed(5)}  Lng: ${currentLng.toFixed(5)}`;
}

/* ── Search wiring ── */
document.getElementById('address-input').addEventListener('keydown', e => { if (e.key === 'Enter') { document.getElementById('suggestions').style.display = 'none'; searchAddress(); } });
document.getElementById('address-input').addEventListener('focus', function() { if (!this.value.trim()) showRecentSearches(); });
document.getElementById('address-input').addEventListener('input', function() {
  const btn = document.getElementById('search-clear');
  if (btn) btn.style.display = this.value.trim() ? 'block' : 'none';
  clearTimeout(debounceTimer);
  const q = this.value.trim();
  if (q.length < 3) { document.getElementById('suggestions').style.display = 'none'; return; }
  debounceTimer = setTimeout(async () => { try { const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(q)}&limit=4`, { headers: { 'Accept-Language': 'en' } }); const data = await resp.json(); if (data.length) showSuggestions(data); } catch {} }, 400);
});
document.getElementById('search-btn').addEventListener('click', () => searchAddress());
document.getElementById('search-clear').addEventListener('click', () => { clearSearchInput(); document.getElementById('search-clear').style.display = 'none'; });

/* ── Close suggestions on outside click ── */
document.addEventListener('click', function(e) {
  if (!e.target.closest('#suggestions') && !e.target.closest('#search-bar')) {
    document.getElementById('suggestions').style.display = 'none';
  }
});

/* ── Keyboard shortcuts ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (distanceModeActive) { toggleDistanceMode(); hideToolPill(); }
    if (clickModeActive) { toggleClickMode(); hideToolPill(); }
    closeAll();
    return;
  }
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  if (e.key === '+' || e.key === '=') { e.preventDefault(); const s = document.getElementById('radius-slider'); s.value = Math.min(parseFloat(s.max), parseFloat(s.value) + 1); drawCircle(); updateHUD(); }
  if (e.key === '-') { e.preventDefault(); const s = document.getElementById('radius-slider'); s.value = Math.max(parseFloat(s.min), parseFloat(s.value) - 1); drawCircle(); updateHUD(); }
});

/* fitCircle, concentric functions moved to pins.js */

/* printMap, buildCircleGeoJSON, recent searches, computeOverlaps moved to tools.js/pins.js */

/* ── Hook drawCircle to auto-update HUD ── */
const _origDrawCircle = drawCircle;
drawCircle = function() {
  if (typeof radiusMode !== 'undefined' && radiusMode === 'drivetime') { updateHUD(); return; }
  _origDrawCircle(); updateHUD(); if (concentricActive) drawSecondCircle();
};

/* ── Prevent Leaflet from intercepting overlay events ── */
function disableMapPropagation() {
  ['fab-stack', 'pop-radius', 'pop-tools', 'pop-style', 'pop-settings', 'search-bar', 'stats-hud'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
    }
  });
}
disableMapPropagation();

/* ── Prevent search input drag from moving map ── */
const _searchInput = document.getElementById('address-input');
if (_searchInput) {
  _searchInput.addEventListener('mousedown', () => map.dragging.disable());
  _searchInput.addEventListener('mouseup', () => map.dragging.enable());
  _searchInput.addEventListener('mouseleave', () => map.dragging.enable());
  _searchInput.addEventListener('touchstart', () => map.dragging.disable());
  _searchInput.addEventListener('touchend', () => map.dragging.enable());
}

/* ── Splash screen ── */
window.addEventListener('load', () => {
  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash) {
      splash.classList.add('fade-out');
      setTimeout(() => splash.remove(), 500);
    }
  }, 1800);
  // Force Leaflet attribution links to open in new tab
  setTimeout(() => {
    document.querySelectorAll('.leaflet-control-attribution a').forEach(a => {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    });
  }, 2000);
});

/* ── About button ── */
const _aboutBtn = document.getElementById('about-btn');
if (_aboutBtn) _aboutBtn.addEventListener('click', () => {
  const overlay = document.getElementById('about-overlay');
  if (overlay) overlay.style.display = 'flex';
});

/* ── Init ── */
restoreFromURL();
buildPresets();
const urlParams = new URLSearchParams(location.search);
const willDetect = !urlParams.has('lat');
initMap(willDetect);
if (willDetect) detectLocation();
toggleFab('radius');
updateHUD();
