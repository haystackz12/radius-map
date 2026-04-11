/* ── Mobile Bottom Sheet — DrawRadius ── */
function isMobile() { return window.innerWidth <= 768; }

let _sheetState = 'collapsed'; // collapsed | half | full

function setSheetState(state) {
  _sheetState = state;
  const sheet = document.getElementById('mobile-sheet');
  if (!sheet) return;
  sheet.classList.remove('sheet-half', 'sheet-full');
  if (state === 'half') sheet.classList.add('sheet-half');
  if (state === 'full') sheet.classList.add('sheet-full');
  renderSheetContent();
}

function refreshMobileSheet() {
  if (!isMobile()) return;
  renderSheetContent();
}

function renderSheetContent() {
  const el = document.getElementById('mobile-sheet-content');
  if (!el) return;
  if (_sheetState === 'collapsed') el.innerHTML = renderPeekRow();
  else if (_sheetState === 'half') el.innerHTML = renderHalfContent();
  else el.innerHTML = renderHalfContent() + renderFullContent();
  bindSheetEvents();
}

/* ── Collapsed peek row ── */
function renderPeekRow() {
  const mode = typeof radiusMode !== 'undefined' ? radiusMode : 'radius';
  const r = parseFloat(document.getElementById('radius-slider').value);
  const u = typeof currentUnit !== 'undefined' ? currentUnit : 'mi';
  const display = mode === 'drivetime' ? `${travelTimeMinutes} min` : (u === 'ft' ? Math.round(r) : r.toFixed(1));
  const unitLabel = mode === 'drivetime' ? '' : `<span class="m-peek-unit">${u}</span>`;
  return `<div class="m-peek-row"><span class="m-peek-num">${display}</span>${unitLabel}<div><span class="m-peek-pill ${mode === 'radius' ? 'active' : 'inactive'}" data-m-mode="radius">Radius</span> <span class="m-peek-pill ${mode === 'drivetime' ? 'active' : 'inactive'}" data-m-mode="drivetime">Drive</span></div></div>`;
}

/* ── Half state content ── */
function renderHalfContent() {
  const mode = typeof radiusMode !== 'undefined' ? radiusMode : 'radius';
  const modeToggle = `<div class="m-mode-toggle"><div class="m-mode-btn ${mode === 'radius' ? 'active' : ''}" data-m-mode="radius">Radius</div><div class="m-mode-btn ${mode === 'drivetime' ? 'active' : ''}" data-m-mode="drivetime">Drive Time</div></div>`;
  return modeToggle + (mode === 'drivetime' ? renderDriveTimeHalf() : renderRadiusHalf());
}

function renderRadiusHalf() {
  const r = parseFloat(document.getElementById('radius-slider').value);
  const u = typeof currentUnit !== 'undefined' ? currentUnit : 'mi';
  const maxR = u === 'ft' ? 26400 : (u === 'km' ? 80 : 50);
  const step = u === 'ft' ? 10 : 0.1;
  const minR = u === 'ft' ? 100 : 0.1;
  const display = u === 'ft' ? Math.round(r) : r.toFixed(1);
  const units = ['mi', 'km', 'ft'].map(uu => `<span class="m-unit-btn ${u === uu ? 'active' : 'inactive'}" data-m-unit="${uu}">${uu}</span>`).join('');
  const presets = u === 'ft' ? [500, 1000, 2640, 5280, 26400] : [1, 3, 5, 10, 25];
  const presetLabels = u === 'ft' ? presets.map(p => p >= 5280 ? (p / 5280) + 'mi' : p) : presets;
  const presetHTML = presets.map((p, i) => {
    const val = u === 'km' ? +(p * 1.60934).toFixed(1) : p;
    const active = Math.abs(r - val) < (u === 'ft' ? 50 : 0.05);
    return `<div class="m-preset ${active ? 'active' : 'inactive'}" data-m-preset="${val}">${presetLabels[i]}${u === 'ft' ? '' : ' ' + u}</div>`;
  }).join('');
  const stats = computeStatsForMobile();
  return `<div style="display:flex;align-items:center;margin-bottom:4px;"><span class="m-bignum">${display}</span><span style="font-size:14px;color:rgba(0,0,0,0.35);margin-left:4px;">${u}</span><div class="m-unit-toggle">${units}</div></div><input class="m-slider" type="range" min="${minR}" max="${maxR}" step="${step}" value="${r}" data-m-slider="radius"><div class="m-presets">${presetHTML}</div><div class="m-stats"><div class="m-stat"><div class="m-stat-val">${stats.radius}</div><div class="m-stat-key">Radius</div></div><div class="m-stat"><div class="m-stat-val">${stats.areaMi} mi²</div><div class="m-stat-key">Area</div></div><div class="m-stat"><div class="m-stat-val">${stats.elev}</div><div class="m-stat-key">Elevation</div></div></div><div class="m-actions"><button class="m-action-primary" data-m-action="pin">📍 Pin Location</button><button class="m-action-secondary" data-m-action="print">🖨</button></div>`;
}

function renderDriveTimeHalf() {
  const t = typeof travelTimeMinutes !== 'undefined' ? travelTimeMinutes : 15;
  const tm = typeof transportMode !== 'undefined' ? transportMode : 'driving-car';
  const icons = { 'driving-car': '\uD83D\uDE97', 'foot-walking': '\uD83D\uDEB6', 'cycling-regular': '\uD83D\uDEB2' };
  const modes = [['driving-car', 'Drive'], ['foot-walking', 'Walk'], ['cycling-regular', 'Cycle']];
  const mBtns = modes.map(([id, label]) => `<span class="m-unit-btn ${tm === id ? 'active' : 'inactive'}" data-m-transport="${id}">${icons[id]} ${label}</span>`).join('');
  const presets = [5, 10, 15, 30, 60];
  const presetHTML = presets.map(p => `<div class="m-preset ${t === p ? 'active' : 'inactive'}" data-m-time="${p}">${p}m</div>`).join('');
  return `<div style="display:flex;align-items:center;margin-bottom:4px;"><span class="m-bignum">${t}</span><span style="font-size:14px;color:rgba(0,0,0,0.35);margin-left:4px;">min</span><div class="m-unit-toggle">${mBtns}</div></div><input class="m-slider" type="range" min="5" max="60" step="5" value="${t}" data-m-slider="time"><div class="m-presets">${presetHTML}</div><div class="m-actions"><button class="m-action-primary" data-m-action="pin">📍 Pin Location</button><button class="m-action-secondary" data-m-action="print">🖨</button></div>`;
}

function computeStatsForMobile() {
  const r = parseFloat(document.getElementById('radius-slider').value);
  const u = typeof currentUnit !== 'undefined' ? currentUnit : 'mi';
  const rMi = u === 'mi' ? r : u === 'km' ? r / 1.60934 : r / 5280;
  const display = u === 'ft' ? Math.round(r) + ' ft' : r.toFixed(1) + ' ' + u;
  const elBox = document.getElementById('elevation-box');
  let elev = '—';
  if (elBox) { const m = (elBox.textContent || '').match(/([\d,]+)\s*ft/); if (m) elev = m[1] + ' ft'; }
  return { radius: display, areaMi: (Math.PI * rMi * rMi).toFixed(1), elev };
}

/* ── Full state content (appended after half) ── */
function renderFullContent() {
  const pinCount = typeof pins !== 'undefined' ? pins.length : 0;
  const pinList = pinCount ? (typeof pins !== 'undefined' ? pins.map(p => `<div class="m-menu-row" data-m-action="fly-pin" data-lat="${p.lat}" data-lng="${p.lng}"><div class="m-menu-icon">📍</div><div class="m-menu-label">${sanitize(p.name || p.label)}</div><span class="m-menu-arrow">›</span></div>`).join('') : '') : '<div style="font-size:12px;color:rgba(0,0,0,0.3);padding:6px 0;">No pinned locations</div>';
  const styles = [['street', '🗺', 'Street'], ['satellite', '🛰', 'Satellite'], ['topo', '⛰', 'Topographic']];
  const curTile = typeof currentTileName !== 'undefined' ? currentTileName : 'street';
  const styleRows = styles.map(([id, icon, name]) => `<div class="m-menu-row" data-m-action="tile" data-tile="${id}"><div class="m-menu-icon">${icon}</div><div class="m-menu-label">${name}</div>${curTile === id ? '<span style="color:#007AFF;font-size:13px;margin-left:auto;">✓</span>' : '<span class="m-menu-arrow">›</span>'}</div>`).join('');
  return `<div class="m-section-title">Pinned Locations (${pinCount})</div>${pinList}<div class="m-section-title">Tools</div><div class="m-menu-row" data-m-action="share"><div class="m-menu-icon">🔗</div><div class="m-menu-label">Copy Share Link</div><span class="m-menu-arrow">›</span></div><div class="m-menu-row" data-m-action="coords"><div class="m-menu-icon">📋</div><div class="m-menu-label">Copy Coordinates</div><span class="m-menu-arrow">›</span></div><div class="m-menu-row" data-m-action="measure"><div class="m-menu-icon">📐</div><div class="m-menu-label">Measure Distance</div><span class="m-menu-arrow">›</span></div><div class="m-section-title">Map Style</div>${styleRows}<div class="m-section-title" style="margin-top:20px;"></div><div class="m-menu-row" data-m-action="reset"><div class="m-menu-icon m-icon-destructive">↺</div><div class="m-menu-label m-destructive">Reset Map</div><span class="m-menu-arrow">›</span></div>`;
}

/* ── Event delegation ── */
function bindSheetEvents() {
  const el = document.getElementById('mobile-sheet-content');
  if (!el) return;
  el.onclick = function(e) {
    const t = e.target;
    const mode = t.closest('[data-m-mode]');
    if (mode) { const m = mode.dataset.mMode; if (m !== radiusMode) { radiusMode = m; removeIsochrone(); removeCompareCircle(); if (circle) { map.removeLayer(circle); circle = null; } if (marker) { map.removeLayer(marker); marker = null; } if (m === 'radius') drawCircle(); else debouncedFetchIsochrone(); if (typeof rebuildPinLayers === 'function') rebuildPinLayers(m); if (typeof updateHUD === 'function') updateHUD(); } renderSheetContent(); return; }
    const unit = t.closest('[data-m-unit]');
    if (unit) { setUnit(unit.dataset.mUnit); renderSheetContent(); return; }
    const preset = t.closest('[data-m-preset]');
    if (preset) { document.getElementById('radius-slider').value = preset.dataset.mPreset; drawCircle(); if (typeof updateHUD === 'function') updateHUD(); renderSheetContent(); return; }
    const transport = t.closest('[data-m-transport]');
    if (transport) { transportMode = transport.dataset.mTransport; removeIsochrone(); drawCenterMarker(); debouncedFetchIsochrone(); renderSheetContent(); return; }
    const time = t.closest('[data-m-time]');
    if (time) { travelTimeMinutes = parseInt(time.dataset.mTime); debouncedFetchIsochrone(); if (typeof updateHUD === 'function') updateHUD(); renderSheetContent(); return; }
    const action = t.closest('[data-m-action]');
    if (action) {
      const a = action.dataset.mAction;
      if (a === 'pin') { if (typeof pinCurrent === 'function') pinCurrent(); }
      if (a === 'print') { if (typeof printMap === 'function') printMap(); }
      if (a === 'share') { if (typeof copyShareLink === 'function') copyShareLink(); }
      if (a === 'coords') { if (typeof copyCoords === 'function') copyCoords(); }
      if (a === 'measure') { if (typeof toggleDistanceMode === 'function') { toggleDistanceMode(); setSheetState('collapsed'); } }
      if (a === 'reset') { if (typeof resetEverything === 'function') { resetEverything(); setSheetState('collapsed'); } }
      if (a === 'tile') { const tile = action.dataset.tile; setTileLayer(tile); document.getElementById('map').classList.toggle('satellite-theme', tile === 'satellite'); renderSheetContent(); }
      if (a === 'fly-pin') { const lat = parseFloat(action.dataset.lat), lng = parseFloat(action.dataset.lng); map.flyTo([lat, lng], 13); setSheetState('collapsed'); }
      return;
    }
  };
  el.oninput = function(e) {
    if (e.target.dataset.mSlider === 'radius') { document.getElementById('radius-slider').value = e.target.value; drawCircle(); if (typeof updateHUD === 'function') updateHUD(); const bn = el.querySelector('.m-bignum'); if (bn) bn.textContent = currentUnit === 'ft' ? Math.round(parseFloat(e.target.value)) : parseFloat(e.target.value).toFixed(1); }
    if (e.target.dataset.mSlider === 'time') { travelTimeMinutes = parseInt(e.target.value); removeIsochrone(); drawCenterMarker(); const bn = el.querySelector('.m-bignum'); if (bn) bn.textContent = travelTimeMinutes; if (typeof updateHUD === 'function') updateHUD(); }
  };
  el.onchange = function(e) {
    if (e.target.dataset.mSlider === 'time') { debouncedFetchIsochrone(); renderSheetContent(); }
  };
}

/* ── Gesture handling ── */
function initSheetGestures() {
  const sheet = document.getElementById('mobile-sheet');
  const handle = document.getElementById('mobile-sheet-handle');
  if (!sheet || !handle) return;
  let startY = 0, startH = 0, dragging = false;
  handle.addEventListener('touchstart', e => { startY = e.touches[0].clientY; startH = sheet.offsetHeight; dragging = true; sheet.style.transition = 'none'; }, { passive: true });
  document.addEventListener('touchmove', e => { if (!dragging) return; const dy = startY - e.touches[0].clientY; sheet.style.height = Math.max(72, Math.min(window.innerHeight * 0.85, startH + dy)) + 'px'; }, { passive: true });
  document.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;
    sheet.style.transition = '';
    const h = sheet.offsetHeight, vh = window.innerHeight;
    if (h < 120) setSheetState('collapsed');
    else if (h < vh * 0.4) setSheetState('half');
    else setSheetState('full');
  });
  // Tap collapsed sheet to expand
  sheet.addEventListener('click', e => {
    if (_sheetState === 'collapsed' && !e.target.closest('[data-m-mode]')) setSheetState('half');
  });
}

/* ── Map tap collapses sheet ── */
function initMapTapCollapse() {
  if (!isMobile()) return;
  map.on('click', () => { if (_sheetState !== 'collapsed') setSheetState('collapsed'); });
}

/* ── Init after splash ── */
if (isMobile()) {
  setTimeout(() => {
    setSheetState('collapsed');
    initSheetGestures();
    initMapTapCollapse();
    // Prevent map dragging when interacting with sheet
    const sheet = document.getElementById('mobile-sheet');
    if (sheet) { L.DomEvent.disableClickPropagation(sheet); L.DomEvent.disableScrollPropagation(sheet); }
  }, 2000);
}
