function sanitize(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

const COLORS = [
  { hex: '#4f8ef7', name: 'Blue' },
  { hex: '#5ecfa0', name: 'Green' },
  { hex: '#f76f6f', name: 'Red' },
  { hex: '#f5a623', name: 'Amber' },
  { hex: '#b06ef7', name: 'Purple' },
  { hex: '#f76fb8', name: 'Pink' },
  { hex: '#6fc4f7', name: 'Cyan' },
  { hex: '#f7e76f', name: 'Yellow' },
];

const PRESETS_MI = [1, 3, 5, 10, 25];

const TILE_LAYERS = {
  street: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles © Esri' },
  topo: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)' },
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attribution: '© <a href="https://carto.com">CARTO</a>' }
};
let currentTileLayer;
let currentTileName = 'street';

let map, circle, marker;
let currentLat = 39.5, currentLng = -98.35;
let currentUnit = 'mi';
let currentColor = '#4f8ef7';
let currentOpacity = 0.15;
let clickModeActive = false;
let distanceModeActive = false;
let distancePoints = [];
let distanceLine = null;
let distanceMarkers = [];
let distanceLabel = null;
let debounceTimer;
let pins = [];
let locationResolved = false;
let overlapLayers = [];
let secondCircle = null;
let concentricActive = false;
let currentLocationLabel = '';
let userHasSearched = false;
let isochroneLayer = null;
let travelTimeMinutes = 15;
let transportMode = 'driving-car';
let radiusMode = 'radius';
let showCompareCircle = false;
let compareCircleLayer = null;
let nearestMarker = null;
let nearestLine = null;

async function detectLocation() {
  setStatus('Detecting your location…', 'loading');
  try {
    const pos = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('not supported'));
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
    });
    if (userHasSearched) return;
    currentLat = pos.coords.latitude;
    currentLng = pos.coords.longitude;
    setStatus('Location detected', 'success');
  } catch {
    try {
      const resp = await fetch('https://ipapi.co/json/');
      const data = await resp.json();
      if (data.latitude && data.longitude && !userHasSearched) {
        currentLat = data.latitude;
        currentLng = data.longitude;
        setStatus('Approximate location detected — search an address for precision', 'success');
      } else {
        setStatus('Using default location', '');
      }
    } catch {
      setStatus('Using default location', '');
    }
  }
  if (userHasSearched) return;
  locationResolved = true;
  hideEmptyState();
  map.setView([currentLat, currentLng], 11);
  drawCircle();
}

function initMap(skipInitialDraw) {
  map = L.map('map', { zoomControl: true }).setView([currentLat, currentLng], 4);
  setTileLayer('street');

  if (!skipInitialDraw) drawCircle();

  map.on('click', function(e) {
    if (distanceModeActive) { handleDistanceClick(e.latlng); return; }
    if (!clickModeActive) return;
    userHasSearched = true;
    currentLat = e.latlng.lat;
    currentLng = e.latlng.lng;
    if (radiusMode === 'drivetime') { drawCenterMarker(); fetchIsochrone(); }
    else { drawCircle(); }
    updateStats();
    setStatus('Center set by click', 'success');
    hideEmptyState();
    reverseGeocode(currentLat, currentLng);
  });
}

function getRadiusMeters() {
  const val = parseFloat(document.getElementById('radius-slider').value);
  if (currentUnit === 'mi') return val * 1609.344;
  if (currentUnit === 'ft') return val * 0.3048;
  return val * 1000;
}

function drawCircle() {
  if (circle) map.removeLayer(circle);
  if (marker) map.removeLayer(marker);

  const radiusM = getRadiusMeters();

  circle = L.circle([currentLat, currentLng], {
    radius: radiusM,
    color: currentColor,
    weight: 2,
    opacity: 0.9,
    fillColor: currentColor,
    fillOpacity: currentOpacity
  }).addTo(map);

  const icon = L.divIcon({
    className: '',
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${currentColor};border:2px solid #fff;box-shadow:0 0 0 2px ${currentColor};"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  marker = L.marker([currentLat, currentLng], { icon }).addTo(map);
  map.flyToBounds(circle.getBounds(), { padding: [40, 40], duration: 0.8, maxZoom: 15 });

  document.getElementById('coords-box').innerHTML =
    `Lat: <b style="color:var(--text)">${currentLat.toFixed(6)}</b>&nbsp;&nbsp;Lng: <b style="color:var(--text)">${currentLng.toFixed(6)}</b>`;

  updateStats();
  updatePresetActive();
  fetchElevation(currentLat, currentLng);
}

function drawCenterMarker() {
  if (marker) map.removeLayer(marker);
  const icon = L.divIcon({
    className: '',
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${currentColor};border:2px solid #fff;box-shadow:0 0 0 2px ${currentColor};"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
  marker = L.marker([currentLat, currentLng], { icon }).addTo(map);
}

function removeIsochrone() {
  if (isochroneLayer) { map.removeLayer(isochroneLayer); isochroneLayer = null; }
  if (typeof removeCompareCircle === 'function') removeCompareCircle();
}

let _isoTimer;
let _isoGeneration = 0;
function debouncedFetchIsochrone() {
  clearTimeout(_isoTimer);
  _isoTimer = setTimeout(fetchIsochrone, 600);
}

async function fetchIsochrone() {
  removeIsochrone();
  const key = window.ORS_API_KEY;
  if (!key) { setStatus('Drive time unavailable — configure ORS API key', 'error'); return; }
  setStatus('Calculating drive time zone…', 'loading');
  const gen = ++_isoGeneration;
  const layer = await fetchIsochroneLayer(currentLat, currentLng, currentColor, currentOpacity);
  if (gen !== _isoGeneration) return;
  removeIsochrone();
  if (layer) {
    isochroneLayer = layer.addTo(map);
    drawCompareCircle();
    drawCenterMarker();
    map.fitBounds(isochroneLayer.getBounds(), { padding: [40, 40] });
    const modeLabel = { 'driving-car': 'driving', 'foot-walking': 'walking', 'cycling-regular': 'cycling' }[transportMode];
    setStatus(`${travelTimeMinutes} min ${modeLabel} zone`, 'success');
    if (typeof updateHUD === 'function') updateHUD();
  } else {
    setStatus('Drive time unavailable — check API key or try again', 'error');
  }
}

function buildPresets() {
  const row = document.getElementById('preset-row');
  if (!row) return;
  row.innerHTML = '';
  const presets = currentUnit === 'ft' ? [500, 1000, 2640, 5280, 26400] : PRESETS_MI;
  presets.forEach(base => {
    const val = currentUnit === 'mi' ? base : (currentUnit === 'ft' ? base : +(base * 1.60934).toFixed(1));
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.dataset.value = val;
    btn.textContent = val + ' ' + currentUnit;
    btn.onclick = () => {
      document.getElementById('radius-slider').value = val;
      drawCircle();
    };
    row.appendChild(btn);
  });
  updatePresetActive();
}

function updatePresetActive() {
  const slider = document.getElementById('radius-slider');
  if (!slider) return;
  const cur = parseFloat(slider.value);
  document.querySelectorAll('.preset-btn').forEach(b => {
    b.classList.toggle('active', Math.abs(parseFloat(b.dataset.value) - cur) < 0.05);
  });
}

function updateStats() {
  const val = parseFloat(document.getElementById('radius-slider').value);
  const unit = currentUnit;
  const radiusMi = convertRadius(unit, 'mi', val);
  const radiusKm = convertRadius(unit, 'km', val);
  const areaMi = Math.PI * radiusMi * radiusMi;
  const areaKm = Math.PI * radiusKm * radiusKm;
  const displayVal = unit === 'ft' ? Math.round(val) : val.toFixed(1);
  document.getElementById('stat-radius').textContent = displayVal + ' ' + unit;
  document.getElementById('stat-diameter').textContent = (unit === 'ft' ? Math.round(val * 2) : (val * 2).toFixed(1)) + ' ' + unit;
  document.getElementById('stat-area-mi').textContent = areaMi.toFixed(2);
  document.getElementById('stat-area-km').textContent = areaKm.toFixed(2);
  const perimeterVal = 2 * Math.PI * val;
  const perimeterDisplay = unit === 'ft' ? Math.round(perimeterVal).toLocaleString() : perimeterVal.toFixed(2);
  document.getElementById('stat-perimeter').textContent = perimeterDisplay + ' ' + unit;
  document.getElementById('radius-display').textContent = displayVal;
}

function convertRadius(from, to, val) {
  const toMi = { mi: val, km: val / 1.60934, ft: val / 5280 };
  const mi = toMi[from];
  const fromMi = { mi: mi, km: mi * 1.60934, ft: mi * 5280 };
  return fromMi[to];
}

function setUnit(u) {
  const slider = document.getElementById('radius-slider');
  const cur = parseFloat(slider.value);
  if (u === currentUnit) return;
  const converted = convertRadius(currentUnit, u, cur);
  currentUnit = u;
  const ranges = { mi: { max: 50, step: 0.1 }, km: { max: 80, step: 0.1 }, ft: { max: 26400, step: 10 } };
  slider.max = ranges[u].max;
  slider.step = ranges[u].step;
  slider.min = u === 'ft' ? 100 : 0.1;
  slider.value = u === 'ft' ? Math.round(converted) : converted.toFixed(1);
  buildPresets();
  drawCircle();
}

function setTileLayer(name) {
  const t = TILE_LAYERS[name];
  if (!t) return;
  if (currentTileLayer) map.removeLayer(currentTileLayer);
  currentTileLayer = L.tileLayer(t.url, { attribution: t.attribution, maxZoom: 19, crossOrigin: true }).addTo(map);
  currentTileName = name;
  document.querySelectorAll('.tile-btn').forEach(b => b.classList.toggle('active', b.dataset.tile === name));
  updateMapBadge(name);
}

function updateMapBadge(name) {
  let b = document.getElementById('map-style-badge');
  if (!b) { b = document.createElement('div'); b.id = 'map-style-badge'; b.className = 'map-style-badge'; document.getElementById('map').appendChild(b); }
  b.textContent = ({ street: 'Street', satellite: 'Satellite', topo: 'Topo' })[name] || name;
}

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.remove('show');
  requestAnimationFrame(() => { t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2000); });
}

function setStatus(msg, type = '') {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status-bar ' + type;
}

function applyResult(r) {
  userHasSearched = true;
  currentLat = parseFloat(r.lat);
  currentLng = parseFloat(r.lon);
  const addr = formatAddress(r.address, r.display_name);
  document.getElementById('address-input').value = addr;
  document.getElementById('suggestions').style.display = 'none';
  setStatus('Found: ' + formatAddressShort(r.address, r.display_name), 'success');
  const _cb = document.getElementById('search-clear');
  if (_cb) _cb.style.display = 'block';
  hideEmptyState();
  updateBreadcrumb(r.address || null);
  if (radiusMode === 'drivetime') {
    drawCenterMarker();
    fetchIsochrone();
  } else {
    drawCircle();
  }
}

function showSuggestions(results) {
  const box = document.getElementById('suggestions');
  box.innerHTML = '';
  const favs = typeof getFavorites === 'function' ? getFavorites() : [];
  const seen = new Set();
  results.forEach(r => {
    const addr = r.display_name;
    if (seen.has(addr)) return;
    seen.add(addr);
    const isFav = favs.includes(addr);
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.style.cssText = 'display:flex;align-items:center;gap:6px;';
    item.innerHTML = `<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${sanitize(addr)}</span><span style="color:${isFav ? '#f5a623' : 'rgba(0,0,0,0.2)'};font-size:14px;cursor:pointer;flex-shrink:0;" data-fav-addr>${isFav ? '★' : '☆'}</span>`;
    item.onclick = () => applyResult(r);
    item.querySelector('[data-fav-addr]').onclick = (e) => { e.stopPropagation(); toggleFavorite(addr); showSuggestions(results); };
    box.appendChild(item);
  });
  box.style.display = 'block';
  setStatus('Multiple results — pick one', '');
}

function restoreFromURL() {
  const params = new URLSearchParams(location.search);
  const lat = parseFloat(params.get('lat'));
  const lng = parseFloat(params.get('lng'));
  const r = parseFloat(params.get('r'));
  const unit = params.get('unit');
  if (!isNaN(lat) && !isNaN(lng)) { currentLat = lat; currentLng = lng; }
  if (unit === 'km' || unit === 'mi' || unit === 'ft') {
    currentUnit = unit;
    document.querySelectorAll('.unit-btn').forEach(b => b.classList.toggle('active', b.dataset.unit === unit));
    const ranges = { mi: { max: 50, step: 0.1, min: 0.1 }, km: { max: 80, step: 0.1, min: 0.1 }, ft: { max: 26400, step: 10, min: 100 } };
    document.getElementById('radius-slider').max = ranges[unit].max;
    document.getElementById('radius-slider').step = ranges[unit].step;
    document.getElementById('radius-slider').min = ranges[unit].min;
  }
  if (!isNaN(r)) document.getElementById('radius-slider').value = r;
  const color = params.get('color');
  if (color && /^[0-9a-fA-F]{6}$/.test(color)) currentColor = '#' + color;
  const op = parseInt(params.get('opacity'));
  if (!isNaN(op) && op >= 0 && op <= 100) currentOpacity = op / 100;
  const mode = params.get('mode');
  if (mode === 'drivetime') { radiusMode = 'drivetime'; }
  const time = parseInt(params.get('time'));
  if (!isNaN(time) && time >= 5 && time <= 60) travelTimeMinutes = time;
  const transport = params.get('transport');
  if (['driving-car', 'foot-walking', 'cycling-regular'].includes(transport)) transportMode = transport;
  const tile = params.get('tile');
  if (tile && TILE_LAYERS[tile]) { /* applied after map init */ _pendingTile = tile; }
  const pinsParam = params.get('pins');
  if (pinsParam) { try { _pendingPins = JSON.parse(pinsParam); } catch {} }
}
let _pendingTile = null;
let _pendingPins = null;

document.getElementById('radius-slider').addEventListener('input', function() {
  drawCircle();
});

document.getElementById('opacity-slider').addEventListener('input', function() {
  currentOpacity = parseInt(this.value) / 100;
  document.getElementById('opacity-val').textContent = this.value + '%';
  if (circle) circle.setStyle({ fillOpacity: currentOpacity });
});

/* Search input listeners in ui.js */
