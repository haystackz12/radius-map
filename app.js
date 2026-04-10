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
  topo: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)' }
};
let currentTileLayer;

let map, circle, marker;
let currentLat = 39.7392, currentLng = -104.9903;
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

function initMap() {
  map = L.map('map', { zoomControl: true }).setView([currentLat, currentLng], 11);
  setTileLayer('street');

  drawCircle();

  map.on('click', function(e) {
    if (distanceModeActive) { handleDistanceClick(e.latlng); return; }
    if (!clickModeActive) return;
    currentLat = e.latlng.lat;
    currentLng = e.latlng.lng;
    drawCircle();
    updateStats();
    setStatus('Center set by click', 'success');
    reverseGeocode(currentLat, currentLng);
  });
}

function getRadiusMeters() {
  const val = parseFloat(document.getElementById('radius-slider').value);
  return currentUnit === 'mi' ? val * 1609.344 : val * 1000;
}

function getRadiusDisplay() {
  return parseFloat(document.getElementById('radius-slider').value).toFixed(1);
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
}

function buildPresets() {
  const row = document.getElementById('preset-row');
  if (!row) return;
  row.innerHTML = '';
  PRESETS_MI.forEach(mi => {
    const val = currentUnit === 'mi' ? mi : +(mi * 1.60934).toFixed(1);
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.dataset.value = val;
    btn.textContent = (currentUnit === 'mi' ? mi : val) + ' ' + currentUnit;
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
  const radiusMi = unit === 'mi' ? val : val / 1.60934;
  const radiusKm = unit === 'km' ? val : val * 1.60934;
  const areaMi = Math.PI * radiusMi * radiusMi;
  const areaKm = Math.PI * radiusKm * radiusKm;
  document.getElementById('stat-radius').textContent = val.toFixed(1) + ' ' + unit;
  document.getElementById('stat-diameter').textContent = (val * 2).toFixed(1) + ' ' + unit;
  document.getElementById('stat-area-mi').textContent = areaMi.toFixed(2);
  document.getElementById('stat-area-km').textContent = areaKm.toFixed(2);
  document.getElementById('radius-display').textContent = val.toFixed(1);
}

function setUnit(u) {
  const slider = document.getElementById('radius-slider');
  const cur = parseFloat(slider.value);
  if (u === currentUnit) return;
  currentUnit = u;
  if (u === 'km') {
    slider.value = (cur * 1.60934).toFixed(1);
    slider.max = 80;
  } else {
    slider.value = (cur / 1.60934).toFixed(1);
    slider.max = 50;
  }
  document.getElementById('btn-mi').classList.toggle('active', u === 'mi');
  document.getElementById('btn-km').classList.toggle('active', u === 'km');
  buildPresets();
  drawCircle();
}

document.getElementById('radius-slider').addEventListener('input', function() {
  drawCircle();
});

document.getElementById('opacity-slider').addEventListener('input', function() {
  currentOpacity = parseInt(this.value) / 100;
  document.getElementById('opacity-val').textContent = this.value + '%';
  if (circle) circle.setStyle({ fillOpacity: currentOpacity });
});

function buildColorOptions() {
  const container = document.getElementById('color-options');
  COLORS.forEach(c => {
    const sw = document.createElement('div');
    sw.className = 'color-swatch' + (c.hex === currentColor ? ' active' : '');
    sw.style.background = c.hex;
    sw.title = c.name;
    sw.onclick = () => {
      currentColor = c.hex;
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      drawCircle();
    };
    container.appendChild(sw);
  });
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.remove('show');
  requestAnimationFrame(() => {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  });
}

function setStatus(msg, type = '') {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status-bar ' + type;
}

async function searchAddress() {
  const query = document.getElementById('address-input').value.trim();
  if (!query) return;
  setStatus('Searching…', 'loading');
  document.getElementById('search-icon').style.display = 'none';
  document.getElementById('spinner').style.display = 'block';
  document.getElementById('suggestions').style.display = 'none';
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
    const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await resp.json();
    if (!data.length) { setStatus('No results found', 'error'); return; }
    if (data.length === 1) {
      applyResult(data[0]);
    } else {
      showSuggestions(data);
    }
  } catch(e) {
    setStatus('Network error — check connection', 'error');
  } finally {
    document.getElementById('search-icon').style.display = 'block';
    document.getElementById('spinner').style.display = 'none';
  }
}

async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await resp.json();
    if (data && data.display_name) {
      document.getElementById('address-input').value = data.display_name.split(',').slice(0,3).join(',');
      setStatus('Found: ' + data.display_name.split(',').slice(0,2).join(','), 'success');
    }
  } catch {}
}

function applyResult(r) {
  currentLat = parseFloat(r.lat);
  currentLng = parseFloat(r.lon);
  document.getElementById('address-input').value = r.display_name.split(',').slice(0,3).join(',');
  document.getElementById('suggestions').style.display = 'none';
  setStatus('Found: ' + r.display_name.split(',').slice(0,2).join(','), 'success');
  drawCircle();
}

function showSuggestions(results) {
  const box = document.getElementById('suggestions');
  box.innerHTML = '';
  results.forEach(r => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.textContent = r.display_name;
    item.onclick = () => applyResult(r);
    box.appendChild(item);
  });
  box.style.display = 'block';
  setStatus('Multiple results — pick one', '');
}

document.getElementById('address-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') searchAddress();
});

document.getElementById('address-input').addEventListener('input', function() {
  clearTimeout(debounceTimer);
  const q = this.value.trim();
  if (q.length < 3) { document.getElementById('suggestions').style.display = 'none'; return; }
  debounceTimer = setTimeout(async () => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=4`;
      const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await resp.json();
      if (data.length) showSuggestions(data);
    } catch {}
  }, 400);
});

document.addEventListener('click', function(e) {
  if (!document.getElementById('suggestions').contains(e.target) &&
      !document.getElementById('address-input').contains(e.target)) {
    document.getElementById('suggestions').style.display = 'none';
  }
});

function clearDistance() {
  if (distanceLine) { map.removeLayer(distanceLine); distanceLine = null; }
  if (distanceLabel) { map.removeLayer(distanceLabel); distanceLabel = null; }
  distanceMarkers.forEach(m => map.removeLayer(m));
  distanceMarkers = [];
  distancePoints = [];
}

function toggleDistanceMode() {
  distanceModeActive = !distanceModeActive;
  if (distanceModeActive && clickModeActive) toggleClickMode();
  document.getElementById('distance-mode-btn').classList.toggle('active', distanceModeActive);
  map.getContainer().style.cursor = distanceModeActive ? 'crosshair' : '';
  clearDistance();
  setStatus(distanceModeActive ? 'Click two points to measure distance' : '', distanceModeActive ? 'loading' : '');
}

function handleDistanceClick(latlng) {
  if (distancePoints.length >= 2) clearDistance();
  distancePoints.push(latlng);
  const dotIcon = L.divIcon({
    className: '',
    html: `<div style="width:10px;height:10px;border-radius:50%;background:#4f8ef7;border:2px solid #fff;"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  });
  distanceMarkers.push(L.marker(latlng, { icon: dotIcon }).addTo(map));
  if (distancePoints.length === 2) {
    distanceLine = L.polyline(distancePoints, { color: '#4f8ef7', weight: 3, opacity: 0.9, dashArray: '6,6' }).addTo(map);
    const meters = distancePoints[0].distanceTo(distancePoints[1]);
    const mi = (meters / 1609.344).toFixed(2);
    const km = (meters / 1000).toFixed(2);
    const mid = L.latLng((distancePoints[0].lat + distancePoints[1].lat) / 2, (distancePoints[0].lng + distancePoints[1].lng) / 2);
    distanceLabel = L.marker(mid, {
      icon: L.divIcon({
        className: '',
        html: `<div class="distance-label">${mi} mi · ${km} km</div>`,
        iconSize: [120, 24],
        iconAnchor: [60, 12]
      })
    }).addTo(map);
    setStatus(`Distance: ${mi} mi (${km} km)`, 'success');
  }
}

function toggleClickMode() {
  clickModeActive = !clickModeActive;
  if (clickModeActive && distanceModeActive) toggleDistanceMode();
  const btn = document.getElementById('click-mode-btn');
  btn.classList.toggle('active', clickModeActive);
  btn.querySelector('span') && (btn.querySelector('span').textContent = '');
  map.getContainer().style.cursor = clickModeActive ? 'crosshair' : '';
  if (clickModeActive) setStatus('Click anywhere on the map to set center', 'loading');
  else setStatus('', '');
}

function toggleModal() {
  document.getElementById('modal-overlay').classList.toggle('open');
}

function switchTab(name) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + name));
}

function toggleDrawer() {
  document.querySelector('.panel').classList.toggle('open');
}

function copyCoords() {
  const txt = `${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}`;
  navigator.clipboard.writeText(txt).then(() => { showToast('Coordinates copied!'); setStatus('Coordinates copied!', 'success'); });
}

function downloadBlob(canvas) {
  try {
    canvas.toBlob(function(blob) {
      if (!blob) { setStatus('PNG export failed — canvas tainted', 'error'); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'radius-map.png';
      a.click();
      setStatus('PNG downloaded!', 'success');
    });
  } catch (e) {
    setStatus('PNG export failed — ' + e.message, 'error');
  }
}

function savePNG() {
  setStatus('Generating PNG…', 'loading');

  if (typeof leafletImage !== 'undefined') {
    leafletImage(map, function(err, canvas) {
      if (!err && canvas) {
        try {
          canvas.toDataURL();
          downloadBlob(canvas);
          return;
        } catch (e) { /* tainted — fall through to html2canvas */ }
      }
      savePNGFallback();
    });
  } else {
    savePNGFallback();
  }
}

function savePNGFallback() {
  if (typeof html2canvas === 'undefined') {
    setStatus('PNG export unavailable — libraries failed to load', 'error');
    return;
  }
  setStatus('Generating PNG (fallback)…', 'loading');
  html2canvas(map.getContainer(), { useCORS: true, allowTaint: false, scale: 2 })
    .then(canvas => downloadBlob(canvas))
    .catch(e => setStatus('PNG export failed — ' + e.message, 'error'));
}

function exportData() {
  const val = parseFloat(document.getElementById('radius-slider').value);
  const data = {
    center: { lat: currentLat, lng: currentLng },
    radius: { value: val, unit: currentUnit },
    radius_meters: getRadiusMeters(),
    address: document.getElementById('address-input').value || null,
    generated: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'radius-map.json';
  a.click();
}

function setTileLayer(name) {
  const t = TILE_LAYERS[name];
  if (!t) return;
  if (currentTileLayer) map.removeLayer(currentTileLayer);
  currentTileLayer = L.tileLayer(t.url, { attribution: t.attribution, maxZoom: 19, crossOrigin: true }).addTo(map);
  document.querySelectorAll('.tile-btn').forEach(b => b.classList.toggle('active', b.dataset.tile === name));
}

function pinCurrent() {
  const val = parseFloat(document.getElementById('radius-slider').value);
  const label = document.getElementById('address-input').value.trim() ||
                `${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`;
  const layer = L.circle([currentLat, currentLng], {
    radius: getRadiusMeters(),
    color: currentColor,
    weight: 2, opacity: 0.9,
    fillColor: currentColor, fillOpacity: currentOpacity
  }).addTo(map);
  pins.push({ id: Date.now(), lat: currentLat, lng: currentLng, radiusVal: val, unit: currentUnit, color: currentColor, label, layer });
  renderPinList();
  setStatus('Pinned: ' + label, 'success');
}

function removePin(id) {
  const i = pins.findIndex(p => p.id === id);
  if (i < 0) return;
  map.removeLayer(pins[i].layer);
  pins.splice(i, 1);
  renderPinList();
}

function renderPinList() {
  const list = document.getElementById('pin-list');
  if (!list) return;
  list.innerHTML = '';
  if (!pins.length) { list.style.display = 'none'; return; }
  list.style.display = 'flex';
  pins.forEach(p => {
    const item = document.createElement('div');
    item.className = 'pin-item';
    item.innerHTML = `<span class="pin-dot" style="background:${p.color}"></span>` +
      `<span class="pin-label" title="${p.label}">${p.label}</span>` +
      `<span class="pin-meta">${p.radiusVal.toFixed(1)} ${p.unit}</span>` +
      `<button class="pin-remove" aria-label="Remove">×</button>`;
    item.querySelector('.pin-remove').onclick = () => removePin(p.id);
    list.appendChild(item);
  });
}

function restoreFromURL() {
  const params = new URLSearchParams(location.search);
  const lat = parseFloat(params.get('lat'));
  const lng = parseFloat(params.get('lng'));
  const r = parseFloat(params.get('r'));
  const unit = params.get('unit');
  if (!isNaN(lat) && !isNaN(lng)) { currentLat = lat; currentLng = lng; }
  if (unit === 'km' || unit === 'mi') {
    currentUnit = unit;
    document.getElementById('btn-mi').classList.toggle('active', unit === 'mi');
    document.getElementById('btn-km').classList.toggle('active', unit === 'km');
    document.getElementById('radius-slider').max = unit === 'km' ? 80 : 50;
  }
  if (!isNaN(r)) document.getElementById('radius-slider').value = r;
}

function copyShareLink() {
  const val = parseFloat(document.getElementById('radius-slider').value);
  const url = `${location.origin}${location.pathname}?lat=${currentLat.toFixed(6)}&lng=${currentLng.toFixed(6)}&r=${val}&unit=${currentUnit}`;
  navigator.clipboard.writeText(url).then(() => { showToast('Share link copied!'); setStatus('Share link copied!', 'success'); });
}

buildColorOptions();
restoreFromURL();
buildPresets();
initMap();
