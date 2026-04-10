/* ── FAB & Popover State ── */
let activeFab = null;

function closeAll() {
  document.querySelectorAll('.popover').forEach(p => p.classList.remove('pop-open'));
  document.querySelectorAll('.fab').forEach(f => f.classList.remove('fab-active'));
  activeFab = null;
}

function toggleFab(name) {
  if (activeFab === name) { closeAll(); return; }
  closeAll();
  activeFab = name;
  document.getElementById('fab-' + name).classList.add('fab-active');
  const pop = document.getElementById('pop-' + name);
  pop.classList.add('pop-open');
  renderPopover(name);
}

/* ── FAB Click Listeners ── */
document.getElementById('fab-radius').addEventListener('click', () => toggleFab('radius'));
document.getElementById('fab-tools').addEventListener('click', () => toggleFab('tools'));
document.getElementById('fab-style').addEventListener('click', () => toggleFab('style'));
document.getElementById('fab-settings').addEventListener('click', () => toggleFab('settings'));

/* ── Popover Renderers ── */
function renderPopover(name) {
  const el = document.getElementById('pop-' + name);
  if (!el || !el.classList.contains('pop-open')) return;
  const renderers = { radius: radiusPopoverHTML, tools: toolsPopoverHTML, style: stylePopoverHTML, settings: settingsPopoverHTML };
  el.innerHTML = renderers[name]();
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
  return `<div class="pop-title">Radius</div><div class="pop-bignum" id="pop-bignum">${u === 'ft' ? Math.round(r) : r.toFixed(1)}</div><div class="pop-unit-sub">${u}</div><div class="seg-ctrl">${unitBtns}</div><input class="pop-slider" id="radius-slider-new" type="range" min="${minR}" max="${maxR}" step="${step}" value="${r}"><div class="presets-row">${presetsHTML}</div><hr class="pop-divider"><div class="pop-title">2nd Ring</div><button class="action-btn ${hasRing2 ? 'action-active' : ''}" data-action="ring2"><span>${hasRing2 ? '✓' : '+'}</span> ${hasRing2 ? 'Ring 2 Active' : 'Add 2nd Ring'}</button>${ring2Sec}<hr class="pop-divider"><button class="action-btn" data-action="fit">⊡  Fit Circle in View</button>`;
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
  const curStyle = document.querySelector('.tile-btn.active')?.dataset?.tile || 'street';
  return `<div class="pop-title">Map Style</div>` + styles.map(s => `<div class="style-opt ${curStyle === s.id ? 'active' : ''}" data-style="${s.id}"><div class="style-swatch" style="background:${s.swatch}"></div><div><div class="style-name">${s.name}</div><div class="style-desc">${s.desc}</div></div></div>`).join('');
}

function settingsPopoverHTML() {
  const swatches = COLORS.map(c => `<div class="color-sw ${c.hex === currentColor ? 'active' : ''}" data-color="${c.hex}" style="background:${c.hex}" title="${c.name}"></div>`).join('');
  const opVal = Math.round(currentOpacity * 100);
  const pinItems = pins.map(p => `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:11px;"><span style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0;"></span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:rgba(0,0,0,0.7);">${p.name || p.label}</span><span style="cursor:pointer;color:rgba(0,0,0,0.3);font-size:14px;" data-action="remove-pin" data-pin-id="${p.id}">×</span></div>`).join('');
  return `<div class="pop-title">Appearance</div><div class="pop-title" style="font-size:9px;margin-bottom:6px;">Circle color</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">${swatches}</div><div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><span style="font-size:10px;color:rgba(0,0,0,0.45);flex:1;">Fill opacity</span><input type="range" class="pop-slider" id="pop-opacity" min="0" max="40" step="1" value="${opVal}" style="flex:2;margin:0;"><span style="font-size:10px;color:#007AFF;width:28px;text-align:right;" id="pop-opacity-val">${opVal}%</span></div><hr class="pop-divider"><div class="pop-title">Pins</div><button class="action-btn" data-action="pin">📍  Pin this location</button>${pinItems}<hr class="pop-divider"><div class="pop-title">Export</div><button class="action-btn" data-action="share">🔗  Copy share link</button><button class="action-btn" data-action="coords">📋  Copy coordinates</button><button class="action-btn" data-action="qr">⬛  Generate QR code</button><button class="action-btn" data-action="json">⬇  Download as JSON</button><button class="action-btn" data-action="embed">‹›  Copy embed code</button>`;
}

/* ── Event Delegation on Popovers ── */
document.getElementById('pop-radius').addEventListener('click', function(e) {
  const seg = e.target.closest('.seg-btn'); if (seg) { setUnit(seg.dataset.unit); renderPopover('radius'); updateHUD(); return; }
  const pre = e.target.closest('.preset-btn'); if (pre) { document.getElementById('radius-slider').value = pre.dataset.preset; drawCircle(); updateHUD(); renderPopover('radius'); return; }
  const act = e.target.closest('[data-action]'); if (!act) return;
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
  if (act.dataset.action === 'setctr') { toggleClickMode(); renderPopover('tools'); }
  if (act.dataset.action === 'measure') { toggleDistanceMode(); renderPopover('tools'); }
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
    elev: document.getElementById('elevation-box')?.textContent?.replace('Elevation: ', '') || '—',
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

/* ── Global click: close suggestions + popovers ── */
document.addEventListener('click', e => {
  if (!e.target.closest('#suggestions') && !e.target.closest('#search-bar')) document.getElementById('suggestions').style.display = 'none';
  if (!e.target.closest('#fab-stack') && !e.target.closest('.popover') && !e.target.closest('#search-bar')) closeAll();
});

/* ── Keyboard shortcuts ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeAll(); return; }
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  if (e.key === '+' || e.key === '=') { e.preventDefault(); const s = document.getElementById('radius-slider'); s.value = Math.min(parseFloat(s.max), parseFloat(s.value) + 1); drawCircle(); updateHUD(); }
  if (e.key === '-') { e.preventDefault(); const s = document.getElementById('radius-slider'); s.value = Math.max(parseFloat(s.min), parseFloat(s.value) - 1); drawCircle(); updateHUD(); }
});

/* ── Missing functions restored from pre-redesign ── */
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
    radius: getSecondRadiusMeters(), color: currentColor, weight: 2, opacity: 0.6,
    fillColor: currentColor, fillOpacity: currentOpacity * 0.5, dashArray: '6,4'
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
  const zoom = Math.min(map.getZoom(), 17);
  const pin = `pin-s+${currentColor.replace('#', '')}(${currentLng},${currentLat})`;
  const geo = buildCircleGeoJSON(currentLat, currentLng, getRadiusMeters());
  const geojson = encodeURIComponent(JSON.stringify(geo));
  const imgUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${pin},geojson(${geojson})/auto/1200x800?access_token=${token}`;
  const w = window.open('', '_blank');
  if (!w) { setStatus('Pop-up blocked', 'error'); return; }
  w.document.write(`<!DOCTYPE html><html><head><style>@page{size:landscape;margin:0}html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden}img{display:block;width:100%;height:100vh;object-fit:contain;page-break-inside:avoid}</style></head><body><img src="${imgUrl}" onload="window.print();window.close()" onerror="document.body.innerHTML='<p style=padding:40px>Print failed.</p>'"></body></html>`);
  w.document.close();
  setStatus('Print dialog opened', 'success');
}

function buildCircleGeoJSON(lat, lng, radiusM) {
  const coords = [];
  for (var i = 0; i < 64; i++) {
    var angle = (i / 64) * 2 * Math.PI;
    coords.push([lng + (radiusM * Math.sin(angle)) / (111320 * Math.cos(lat * Math.PI / 180)), lat + (radiusM * Math.cos(angle)) / 111320]);
  }
  coords.push(coords[0]);
  return { type: 'Feature', properties: { stroke: currentColor, 'stroke-width': 3, fill: currentColor, 'fill-opacity': 0.2 }, geometry: { type: 'Polygon', coordinates: [coords] } };
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

/* ── Init ── */
restoreFromURL();
buildPresets();
const urlParams = new URLSearchParams(location.search);
const willDetect = !urlParams.has('lat');
initMap(willDetect);
if (willDetect) detectLocation();
toggleFab('radius');
updateHUD();
