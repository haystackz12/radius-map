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
  return `<div class="pop-title">Radius</div><div id="pop-bignum-wrap"><span class="pop-bignum" id="pop-bignum" data-action="edit-radius" title="Click to enter exact value" style="cursor:pointer;border-bottom:2px dashed rgba(0,122,255,0.3);">${u === 'ft' ? Math.round(r) : r.toFixed(1)}</span><span class="pop-unit-sub" style="margin-left:4px;">${u}</span></div><div class="seg-ctrl">${unitBtns}</div><input class="pop-slider" id="radius-slider-new" type="range" min="${minR}" max="${maxR}" step="${step}" value="${r}"><div class="presets-row">${presetsHTML}</div><hr class="pop-divider"><div class="pop-title">2nd Ring</div><button class="action-btn ${hasRing2 ? 'action-active' : ''}" data-action="ring2"><span>${hasRing2 ? '✓' : '+'}</span> ${hasRing2 ? 'Ring 2 Active' : 'Add 2nd Ring'}</button>${ring2Sec}<hr class="pop-divider"><button class="action-btn" data-action="fit">⊡  Fit Circle in View</button>`;
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
  const seg = e.target.closest('.seg-btn'); if (seg) { setUnit(seg.dataset.unit); renderPopover('radius'); updateHUD(); return; }
  const pre = e.target.closest('.preset-btn'); if (pre) { document.getElementById('radius-slider').value = pre.dataset.preset; drawCircle(); updateHUD(); renderPopover('radius'); return; }
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
});
document.getElementById('pop-radius').addEventListener('input', function(e) {
  if (e.target.id === 'radius-slider-new') { document.getElementById('radius-slider').value = e.target.value; drawCircle(); updateHUD(); const bn = document.getElementById('pop-bignum'); if (bn) bn.textContent = currentUnit === 'ft' ? Math.round(parseFloat(e.target.value)) : parseFloat(e.target.value).toFixed(1); }
  if (e.target.id === 'ring2-slider') { document.getElementById('radius-slider-2').value = e.target.value; drawSecondCircle(); updateHUD(); }
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

/* ── Missing functions ── */
function fitCircle() {
  if (circle) map.flyToBounds(circle.getBounds(), { padding: [40, 40] });
}

function getSecondRadiusMeters() {
  const val = parseFloat(document.getElementById('radius-slider-2').value);
  if (currentUnit === 'mi') return val * 1609.344;
  if (currentUnit === 'ft') return val * 0.3048;
  return val * 1000;
}

function removeSecondCircle() {
  if (secondCircle) { if (map.hasLayer(secondCircle)) map.removeLayer(secondCircle); secondCircle = null; }
}

function drawSecondCircle() {
  removeSecondCircle();
  if (!concentricActive) return;
  secondCircle = L.circle([currentLat, currentLng], {
    radius: getSecondRadiusMeters(), color: '#34C759', weight: 2, opacity: 0.8,
    fillColor: '#34C759', fillOpacity: 0.1, dashArray: '6,4'
  }).addTo(map);
}

function toggleConcentric() {
  concentricActive = !concentricActive;
  if (!concentricActive) { removeSecondCircle(); }
  else {
    const primaryVal = parseFloat(document.getElementById('radius-slider').value);
    const slider2 = document.getElementById('radius-slider-2');
    if (slider2) {
      slider2.max = document.getElementById('radius-slider').max;
      slider2.step = document.getElementById('radius-slider').step;
      slider2.min = document.getElementById('radius-slider').min;
      slider2.value = currentUnit === 'ft' ? Math.round(primaryVal * 0.5) : (primaryVal * 0.5).toFixed(1);
    }
    drawSecondCircle();
  }
}

function printMap() {
  const token = window.MAPBOX_TOKEN;
  if (!token || token === 'REPLACE_ME') { setStatus('Print unavailable — configure Mapbox token in config.js', 'error'); return; }

  const overlays = [];

  // Active circle
  overlays.push(`pin-s+${currentColor.replace('#', '')}(${currentLng},${currentLat})`);
  const activeGeo = buildCircleGeoJSON(currentLat, currentLng, getRadiusMeters(), currentColor, 32);
  overlays.push(`geojson(${encodeURIComponent(JSON.stringify(activeGeo))})`);

  // Pinned circles — cap at 4 pins to stay under URL limit
  const printPins = pins.slice(0, 4);
  printPins.forEach(p => {
    const pinColor = (p.color || '#4f8ef7').replace('#', '');
    overlays.push(`pin-s+${pinColor}(${p.lng},${p.lat})`);
    const radiusM = p.unit === 'mi' ? p.radiusVal * 1609.344 : p.unit === 'ft' ? p.radiusVal * 0.3048 : p.radiusVal * 1000;
    const pinGeo = buildCircleGeoJSON(p.lat, p.lng, radiusM, p.color || '#4f8ef7', 32);
    overlays.push(`geojson(${encodeURIComponent(JSON.stringify(pinGeo))})`);
  });

  const imgUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlays.join(',')}/auto/1200x800?access_token=${token}`;
  const w = window.open('', '_blank');
  if (!w) { setStatus('Pop-up blocked', 'error'); return; }
  w.document.write(`<!DOCTYPE html><html><head><style>@page{size:landscape;margin:0}html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden}img{display:block;width:100%;height:100vh;object-fit:contain;page-break-inside:avoid}</style></head><body><img src="${imgUrl}" onload="window.print();window.close()" onerror="document.body.innerHTML='<p style=padding:40px>Print failed.</p>'"></body></html>`);
  w.document.close();
  if (pins.length > 4) setStatus(`Printed active circle + 4 of ${pins.length} pins (URL limit)`, 'success');
  else setStatus('Print dialog opened', 'success');
}

function buildCircleGeoJSON(lat, lng, radiusM, color, points) {
  const c = color || currentColor;
  const n = points || 64;
  const coords = [];
  for (var i = 0; i < n; i++) {
    var angle = (i / n) * 2 * Math.PI;
    coords.push([lng + (radiusM * Math.sin(angle)) / (111320 * Math.cos(lat * Math.PI / 180)), lat + (radiusM * Math.cos(angle)) / 111320]);
  }
  coords.push(coords[0]);
  return { type: 'Feature', properties: { stroke: c, 'stroke-width': 3, fill: c, 'fill-opacity': 0.2 }, geometry: { type: 'Polygon', coordinates: [coords] } };
}

function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem('rm_recent_searches') || '[]'); } catch { return []; }
}

function saveRecentSearch(query) {
  let recent = getRecentSearches().filter(q => q !== query);
  recent.unshift(query);
  if (recent.length > 8) recent = recent.slice(0, 8);
  localStorage.setItem('rm_recent_searches', JSON.stringify(recent));
}

function showRecentSearches() {
  const recent = getRecentSearches();
  if (!recent.length) return;
  const box = document.getElementById('suggestions');
  box.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'recent-header';
  header.innerHTML = '<span>Recent searches</span><button onclick="clearRecentSearches(event)">Clear</button>';
  box.appendChild(header);
  recent.forEach(q => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.textContent = q;
    item.onclick = () => { document.getElementById('address-input').value = q; searchAddress(); };
    box.appendChild(item);
  });
  box.style.display = 'block';
}

function clearRecentSearches(e) {
  if (e) e.stopPropagation();
  localStorage.removeItem('rm_recent_searches');
  document.getElementById('suggestions').style.display = 'none';
}

function computeOverlaps() {
  overlapLayers.forEach(l => map.removeLayer(l));
  overlapLayers = [];
  const allCircles = pins.map(p => ({ lat: p.lat, lng: p.lng, r: p.layer.getRadius() }));
  if (circle) allCircles.push({ lat: currentLat, lng: currentLng, r: circle.getRadius() });
  for (let i = 0; i < allCircles.length; i++) {
    for (let j = i + 1; j < allCircles.length; j++) {
      const a = allCircles[i], b = allCircles[j];
      const dist = L.latLng(a.lat, a.lng).distanceTo(L.latLng(b.lat, b.lng));
      if (dist < a.r + b.r && dist > Math.abs(a.r - b.r)) {
        overlapLayers.push(L.polygon([], { color: '#f5a623', weight: 0, fillColor: '#f5a623', fillOpacity: 0.25 }).addTo(map));
      }
    }
  }
}

/* ── Hook drawCircle to auto-update HUD ── */
const _origDrawCircle = drawCircle;
drawCircle = function() { _origDrawCircle(); updateHUD(); if (concentricActive) drawSecondCircle(); };

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
