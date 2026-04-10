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

/* ── Popover Renderers ── */
function renderPopover(name) {
  const el = document.getElementById('pop-' + name);
  if (!el || !el.classList.contains('pop-open')) return;
  const renderers = { radius: radiusPopoverHTML, tools: toolsPopoverHTML, style: stylePopoverHTML, settings: settingsPopoverHTML };
  el.innerHTML = renderers[name]();
  bindPopoverEvents(name);
}

function radiusPopoverHTML() {
  const r = parseFloat(document.getElementById('radius-slider').value);
  const u = currentUnit;
  const maxR = u === 'ft' ? 26400 : (u === 'km' ? 80 : 50);
  const step = u === 'ft' ? 10 : 0.1;
  const presets = u === 'ft' ? [500, 1000, 2640, 5280, 26400] : [1, 3, 5, 10, 25];
  const pLabels = u === 'ft' ? presets.map(p => p >= 5280 ? (p/5280) + ' mi' : p + ' ft') : presets.map(p => p + ' ' + u);
  const presetsHTML = presets.map((p, i) => {
    const active = Math.abs(r - (u === 'km' ? +(p * 1.60934).toFixed(1) : p)) < (u === 'ft' ? 50 : 0.05);
    const val = u === 'km' ? +(p * 1.60934).toFixed(1) : p;
    return `<div class="preset-btn ${active ? 'active' : ''}" data-preset="${val}">${pLabels[i]}</div>`;
  }).join('');
  const unitBtns = ['mi','km','ft'].map(uu => `<div class="seg-btn ${u === uu ? 'active' : ''}" data-unit="${uu}">${uu}</div>`).join('');
  const hasRing2 = concentricActive;
  const r2 = parseFloat(document.getElementById('radius-slider-2').value);
  const ring2Sec = hasRing2 ? `<div class="ring2-box"><div class="ring2-label">2nd Ring · ${u === 'ft' ? Math.round(r2) : r2.toFixed(1)} ${u}</div><input class="pop-slider" id="ring2-slider" type="range" min="${u === 'ft' ? 100 : 0.1}" max="${maxR}" step="${step}" value="${r2}"></div>` : '';
  return `<div class="pop-title">Radius</div><div class="pop-bignum">${u === 'ft' ? Math.round(r) : r.toFixed(1)}</div><div class="pop-unit-sub">${u}</div><div class="seg-ctrl">${unitBtns}</div><input class="pop-slider" id="radius-slider-new" type="range" min="${u === 'ft' ? 100 : 0.1}" max="${maxR}" step="${step}" value="${r}"><div class="presets-row">${presetsHTML}</div><hr class="pop-divider"><div class="pop-title">2nd Ring</div><button class="action-btn ${hasRing2 ? 'action-active' : ''}" id="btn-ring2"><span>${hasRing2 ? '✓' : '+'}</span> ${hasRing2 ? 'Ring 2 Active' : 'Add 2nd Ring'}</button>${ring2Sec}<hr class="pop-divider"><button class="action-btn" id="btn-fit">⊡  Fit Circle in View</button>`;
}

function toolsPopoverHTML() {
  return `<div class="pop-title">Tools</div><button class="action-btn" id="btn-print">🖨  Print / Save PDF</button><button class="action-btn ${clickModeActive ? 'action-active' : ''}" id="btn-setctr">🎯  ${clickModeActive ? 'Click map to set center…' : 'Set Map Center'}</button><button class="action-btn ${distanceModeActive ? 'action-active' : ''}" id="btn-measure">📐  ${distanceModeActive ? 'Measuring… (tap to stop)' : 'Measure Distance'}</button><hr class="pop-divider"><div class="pop-title">View</div><button class="action-btn" id="btn-fit2">⊡  Fit Circle in View</button><button class="action-btn" id="btn-zoomin">＋  Zoom In</button><button class="action-btn" id="btn-zoomout">－  Zoom Out</button>`;
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
  return `<div class="pop-title">Appearance</div><div class="pop-title" style="font-size:9px;margin-bottom:6px;">Circle color</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">${swatches}</div><div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><span style="font-size:10px;color:rgba(0,0,0,0.45);flex:1;">Fill opacity</span><input type="range" class="pop-slider" id="pop-opacity" min="0" max="40" step="1" value="${opVal}" style="flex:2;margin:0;"><span style="font-size:10px;color:#007AFF;width:28px;text-align:right;" id="pop-opacity-val">${opVal}%</span></div><hr class="pop-divider"><div class="pop-title">Pins</div><button class="action-btn" id="btn-pin">📍  Pin this location</button><div id="pop-pins-list"></div><hr class="pop-divider"><div class="pop-title">Export</div><button class="action-btn" id="btn-share">🔗  Copy share link</button><button class="action-btn" id="btn-coords">📋  Copy coordinates</button><button class="action-btn" id="btn-qr">⬛  Generate QR code</button><button class="action-btn" id="btn-json">⬇  Download as JSON</button><button class="action-btn" id="btn-embed">‹›  Copy embed code</button>`;
}

/* ── Event Binding ── */
function bindPopoverEvents(name) {
  if (name === 'radius') {
    document.querySelectorAll('#pop-radius .seg-btn').forEach(btn => btn.addEventListener('click', () => { setUnit(btn.dataset.unit); renderPopover('radius'); updateHUD(); }));
    const rSlider = document.getElementById('radius-slider-new');
    if (rSlider) {
      rSlider.addEventListener('input', () => { document.getElementById('radius-slider').value = rSlider.value; drawCircle(); updateHUD(); const bn = document.querySelector('#pop-radius .pop-bignum'); if (bn) bn.textContent = currentUnit === 'ft' ? Math.round(parseFloat(rSlider.value)) : parseFloat(rSlider.value).toFixed(1); });
      rSlider.addEventListener('change', () => renderPopover('radius'));
    }
    const r2Slider = document.getElementById('ring2-slider');
    if (r2Slider) r2Slider.addEventListener('input', () => { document.getElementById('radius-slider-2').value = r2Slider.value; drawSecondCircle(); updateHUD(); });
    document.querySelectorAll('#pop-radius .preset-btn').forEach(btn => btn.addEventListener('click', () => { document.getElementById('radius-slider').value = btn.dataset.preset; drawCircle(); renderPopover('radius'); updateHUD(); }));
    document.getElementById('btn-ring2')?.addEventListener('click', () => { toggleConcentric(); renderPopover('radius'); updateHUD(); });
    document.getElementById('btn-fit')?.addEventListener('click', () => fitCircle());
  }
  if (name === 'tools') {
    document.getElementById('btn-print')?.addEventListener('click', () => printMap());
    document.getElementById('btn-setctr')?.addEventListener('click', () => { toggleClickMode(); renderPopover('tools'); });
    document.getElementById('btn-measure')?.addEventListener('click', () => { toggleDistanceMode(); renderPopover('tools'); });
    document.getElementById('btn-fit2')?.addEventListener('click', () => fitCircle());
    document.getElementById('btn-zoomin')?.addEventListener('click', () => map.zoomIn());
    document.getElementById('btn-zoomout')?.addEventListener('click', () => map.zoomOut());
  }
  if (name === 'style') {
    document.querySelectorAll('#pop-style .style-opt').forEach(opt => opt.addEventListener('click', () => {
      const s = opt.dataset.style;
      setTileLayer(s);
      document.getElementById('map').classList.toggle('satellite-theme', s === 'satellite');
      renderPopover('style');
    }));
  }
  if (name === 'settings') {
    document.getElementById('btn-pin')?.addEventListener('click', () => { pinCurrent(); renderPopover('settings'); });
    document.getElementById('btn-share')?.addEventListener('click', () => copyShareLink());
    document.getElementById('btn-coords')?.addEventListener('click', () => copyCoords());
    document.getElementById('btn-qr')?.addEventListener('click', () => generateQR());
    document.getElementById('btn-json')?.addEventListener('click', () => exportData());
    document.getElementById('btn-embed')?.addEventListener('click', () => copyEmbed());
    document.getElementById('pop-opacity')?.addEventListener('input', function() {
      currentOpacity = parseInt(this.value) / 100;
      if (circle) circle.setStyle({ fillOpacity: currentOpacity });
      document.getElementById('pop-opacity-val').textContent = this.value + '%';
      document.getElementById('opacity-slider').value = this.value;
    });
    document.querySelectorAll('#pop-settings .color-sw').forEach(sw => sw.addEventListener('click', () => {
      currentColor = sw.dataset.color;
      document.querySelectorAll('.color-sw').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      drawCircle();
    }));
    renderPinListInPopover();
  }
}

function renderPinListInPopover() {
  const list = document.getElementById('pop-pins-list');
  if (!list || !pins.length) return;
  list.innerHTML = pins.map(p => `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:11px;"><span style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0;"></span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:rgba(0,0,0,0.7);">${p.name || p.label}</span><span style="cursor:pointer;color:rgba(0,0,0,0.3);font-size:14px;" onclick="removePin(${p.id});renderPopover('settings');">×</span></div>`).join('');
}

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
  updateClearBtn();
  clearTimeout(debounceTimer);
  const q = this.value.trim();
  if (q.length < 3) { document.getElementById('suggestions').style.display = 'none'; return; }
  debounceTimer = setTimeout(async () => { try { const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(q)}&limit=4`; const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } }); const data = await resp.json(); if (data.length) showSuggestions(data); } catch {} }, 400);
});
document.getElementById('search-btn').addEventListener('click', () => searchAddress());
document.getElementById('search-clear').addEventListener('click', () => { clearSearchInput(); document.getElementById('search-clear').style.display = 'none'; });

function updateClearBtn() {
  const btn = document.getElementById('search-clear');
  if (btn) btn.style.display = document.getElementById('address-input').value.trim() ? 'block' : 'none';
}

document.addEventListener('click', e => {
  if (!e.target.closest('#suggestions') && !e.target.closest('#address-input')) document.getElementById('suggestions').style.display = 'none';
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

/* ── Hook into existing drawCircle to update HUD ── */
const _origDrawCircle = drawCircle;
drawCircle = function() { _origDrawCircle(); updateHUD(); };

/* ── Init ── */
restoreFromURL();
buildPresets();
const urlParams = new URLSearchParams(location.search);
const willDetect = !urlParams.has('lat');
initMap(willDetect);
if (willDetect) detectLocation();
toggleFab('radius');
updateHUD();
