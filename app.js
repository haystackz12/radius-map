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

let map, circle, marker;
let currentLat = 39.7392, currentLng = -104.9903;
let currentUnit = 'mi';
let currentColor = '#4f8ef7';
let currentOpacity = 0.15;
let clickModeActive = false;
let debounceTimer;

function initMap() {
  map = L.map('map', { zoomControl: true }).setView([currentLat, currentLng], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  drawCircle();

  map.on('click', function(e) {
    if (!clickModeActive) return;
    currentLat = e.latlng.lat;
    currentLng = e.latlng.lng;
    drawCircle();
    updateStats();
    setStatus('Center set by click', 'success');
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

function toggleClickMode() {
  clickModeActive = !clickModeActive;
  const btn = document.getElementById('click-mode-btn');
  btn.classList.toggle('active', clickModeActive);
  btn.querySelector('span') && (btn.querySelector('span').textContent = '');
  map.getContainer().style.cursor = clickModeActive ? 'crosshair' : '';
  if (clickModeActive) setStatus('Click anywhere on the map to set center', 'loading');
  else setStatus('', '');
}

function copyCoords() {
  const txt = `${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}`;
  navigator.clipboard.writeText(txt).then(() => setStatus('Coordinates copied!', 'success'));
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

buildColorOptions();
initMap();
