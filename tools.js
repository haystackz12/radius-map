function tryParseCoords(query) {
  const match = query.trim().match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (!match) return null;
  const lat = parseFloat(match[1]), lng = parseFloat(match[2]);
  return (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) ? { lat, lng } : null;
}

async function searchAddress() {
  const query = document.getElementById('address-input').value.trim();
  if (!query) return;
  const coords = tryParseCoords(query);
  if (coords) {
    saveRecentSearch(query);
    userHasSearched = true;
    currentLat = coords.lat; currentLng = coords.lng;
    document.getElementById('address-input').value = `${coords.lat}, ${coords.lng}`;
    document.getElementById('suggestions').style.display = 'none';
    setStatus('Coordinate detected', 'success');
    hideEmptyState(); updateClearBtn(); drawCircle();
    return;
  }
  saveRecentSearch(query);
  setStatus('Searching…', 'loading');
  const searchIcon = document.getElementById('search-icon');
  const spinner = document.getElementById('spinner');
  if (searchIcon) searchIcon.style.display = 'none';
  if (spinner) spinner.style.display = 'block';
  document.getElementById('suggestions').style.display = 'none';
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=5`;
    const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await resp.json();
    if (!data.length) { setStatus('No results found', 'error'); return; }
    if (data.length === 1) { applyResult(data[0]); } else { showSuggestions(data); }
  } catch { setStatus('Network error — check connection', 'error');
  } finally {
    const searchIcon = document.getElementById('search-icon');
    const spinner = document.getElementById('spinner');
    if (searchIcon) searchIcon.style.display = 'block';
    if (spinner) spinner.style.display = 'none';
  }
}

function clearSearchInput() {
  document.getElementById('address-input').value = '';
  document.getElementById('suggestions').style.display = 'none';
  const cb = document.getElementById('search-clear') || document.getElementById('clear-input-btn');
  if (cb) cb.style.display = 'none';
  setStatus('', '');
}

function updateClearBtn() {
  const btn = document.getElementById('search-clear') || document.getElementById('clear-input-btn');
  if (btn) btn.style.display = document.getElementById('address-input').value.trim() ? 'block' : 'none';
}

function hideEmptyState() {
  const el = document.getElementById('empty-state');
  if (el) el.style.display = 'none';
}

function formatAddress(address, fallback) {
  if (!address) return fallback ? fallback.split(',').slice(0, 3).join(',').trim() : '';
  const street = [address.house_number || '', address.road || ''].filter(Boolean).join(' ');
  const city = address.city || address.town || address.village || address.hamlet || '';
  return [street, city, address.state || address.region || ''].filter(Boolean).join(', ');
}

function formatAddressShort(address, fallback) {
  if (!address) return fallback ? fallback.split(',').slice(0, 2).join(',').trim() : '';
  const city = address.city || address.town || address.village || address.hamlet || '';
  return [city, address.state || address.region || ''].filter(Boolean).join(', ');
}

function clearDistance() {
  if (distanceLine) { map.removeLayer(distanceLine); distanceLine = null; }
  if (distanceLabel) { map.removeLayer(distanceLabel); distanceLabel = null; }
  distanceMarkers.forEach(m => map.removeLayer(m));
  distanceMarkers = [];
  distancePoints = [];
}

let distanceModeActivatedAt = 0;

function toggleDistanceMode() {
  distanceModeActive = !distanceModeActive;
  if (distanceModeActive) distanceModeActivatedAt = Date.now();
  if (distanceModeActive && clickModeActive) toggleClickMode();
  const btn = document.getElementById('distance-mode-btn');
  if (btn) btn.classList.toggle('active', distanceModeActive);
  map.getContainer().style.cursor = distanceModeActive ? 'crosshair' : '';
  if (distanceModeActive) map.invalidateSize();
  clearDistance();
  setStatus(distanceModeActive ? 'Click two points to measure distance' : '', distanceModeActive ? 'loading' : '');
}

function handleDistanceClick(latlng) {
  // Ignore clicks within 400ms of activation — prevents the button click from registering as first point
  if (Date.now() - distanceModeActivatedAt < 400) return;
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
  if (btn) btn.classList.toggle('active', clickModeActive);
  map.getContainer().style.cursor = clickModeActive ? 'crosshair' : '';
  if (clickModeActive) setStatus('Click anywhere on the map to set center', 'loading');
  else setStatus('', '');
}


function copyCoords() {
  const txt = `${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}`;
  navigator.clipboard.writeText(txt).then(() => { showToast('Coordinates copied!'); setStatus('Coordinates copied!', 'success'); });
}

function buildShareURL() {
  const p = new URLSearchParams();
  p.set('lat', currentLat.toFixed(6));
  p.set('lng', currentLng.toFixed(6));
  p.set('r', parseFloat(document.getElementById('radius-slider').value));
  p.set('unit', currentUnit);
  p.set('color', currentColor.replace('#', ''));
  p.set('opacity', Math.round(currentOpacity * 100));
  p.set('mode', radiusMode);
  if (radiusMode === 'drivetime') { p.set('time', travelTimeMinutes); p.set('transport', transportMode); }
  if (currentTileName !== 'street') p.set('tile', currentTileName);
  if (pins.length) {
    const pinData = pins.map(pin => {
      const o = { la: +pin.lat.toFixed(5), ln: +pin.lng.toFixed(5), n: pin.name, r: pin.radiusVal, u: pin.unit, c: pin.color.replace('#', '') };
      if (pin.travelTime) { o.t = pin.travelTime; o.tp = pin.transportMode; }
      return o;
    });
    p.set('pins', JSON.stringify(pinData));
  }
  return `${location.origin}${location.pathname}?${p.toString()}`;
}

function copyShareLink() {
  const url = buildShareURL();
  navigator.clipboard.writeText(url).then(() => { showToast('Share link copied!'); setStatus('Share link copied!', 'success'); });
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

async function fetchElevation(lat, lng) {
  const el = document.getElementById('elevation-box');
  if (!el) return;
  el.innerHTML = 'Elevation: <i style="color:var(--accent)">loading…</i>';
  try {
    const resp = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`);
    const data = await resp.json();
    if (data.elevation && data.elevation[0] != null) {
      const m = data.elevation[0];
      const ft = Math.round(m * 3.28084);
      el.innerHTML = `Elevation: <b style="color:var(--text)">${ft.toLocaleString()} ft</b> / <b style="color:var(--text)">${Math.round(m).toLocaleString()} m</b>`;
      if (typeof updateHUD === 'function') updateHUD();
    } else {
      el.innerHTML = 'Elevation: <span style="color:var(--muted)">Unavailable</span>';
    }
  } catch {
    el.innerHTML = 'Elevation: <span style="color:var(--muted)">Unavailable</span>';
  }
}

async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await resp.json();
    if (data && data.display_name) {
      document.getElementById('address-input').value = formatAddress(data.address, data.display_name);
      setStatus('Found: ' + formatAddressShort(data.address, data.display_name), 'success');
      updateBreadcrumb(data.address);
    }
  } catch {}
}

function updateBreadcrumb(address) {
  let label = '';
  if (address) {
    const houseNum = address.house_number || '';
    const road = address.road || '';
    const street = [houseNum, road].filter(Boolean).join(' ');
    const city = address.city || address.town || address.village || address.hamlet || '';
    const state = address.state || address.region || '';
    label = [street, city, state].filter(Boolean).join(', ');
  }
  currentLocationLabel = label;
  let el = document.getElementById('location-breadcrumb');
  if (!el) {
    el = document.createElement('div');
    el.id = 'location-breadcrumb';
    el.className = 'location-breadcrumb';
    document.getElementById('map').appendChild(el);
  }
  if (label) { el.textContent = label; el.style.display = 'block'; }
  else { el.style.display = 'none'; }
}

function copyEmbed() {
  const iframe = `<iframe src="${buildShareURL()}" width="600" height="450" style="border:none;border-radius:8px;" loading="lazy" allowfullscreen></iframe>`;
  navigator.clipboard.writeText(iframe).then(() => { showToast('Embed code copied!'); setStatus('Embed code copied!', 'success'); });
}

function generateQR() {
  if (typeof QRCode === 'undefined') { setStatus('QR library not loaded', 'error'); return; }
  const val = parseFloat(document.getElementById('radius-slider').value);
  const url = `${location.origin}${location.pathname}?lat=${currentLat.toFixed(6)}&lng=${currentLng.toFixed(6)}&r=${val}&unit=${currentUnit}`;
  const container = document.getElementById('qr-container');
  container.innerHTML = '';
  container.style.display = 'block';
  new QRCode(container, { text: url, width: 160, height: 160, colorDark: '#f0f2ff', colorLight: '#1a1d27' });
  const dlBtn = document.getElementById('qr-download-btn');
  if (dlBtn) dlBtn.style.display = 'flex';
  setStatus('QR code generated', 'success');
}

function downloadQR() {
  const canvas = document.querySelector('#qr-container canvas');
  if (!canvas) return;
  canvas.toBlob(function(blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'radius-map-qr.png';
    a.click();
    setStatus('QR downloaded!', 'success');
  });
}

/* Pin, undo/redo, CSV, reset, fullscreen moved to pins.js */

/* ── Print (moved from ui.js) ── */
function printMap() {
  const token = window.MAPBOX_TOKEN;
  if (!token || token === 'REPLACE_ME') { setStatus('Print unavailable — configure Mapbox token in config.js', 'error'); return; }
  const overlays = [];
  overlays.push(`pin-s+${currentColor.replace('#', '')}(${currentLng},${currentLat})`);
  const activeGeo = buildCircleGeoJSON(currentLat, currentLng, getRadiusMeters(), currentColor, 32);
  overlays.push(`geojson(${encodeURIComponent(JSON.stringify(activeGeo))})`);
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

/* ── Recent Searches (moved from ui.js) ── */
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

function clearRecentSearches(e) {
  if (e) e.stopPropagation();
  localStorage.removeItem('rm_recent_searches');
  document.getElementById('suggestions').style.display = 'none';
}

/* ── Nearest Place Finder (Overpass API) ── */
function clearNearestResult() {
  if (nearestMarker) { map.removeLayer(nearestMarker); nearestMarker = null; }
  if (nearestLine) { map.removeLayer(nearestLine); nearestLine = null; }
}

async function findNearest(amenityType) {
  const _nw = (k,v,a) => `node["${k}"="${v}"](${a});way["${k}"="${v}"](${a})`;
  function _q(r) {
    const a = `around:${r},${currentLat},${currentLng}`;
    const q = { hospital:`${_nw('amenity','hospital',a)};node["healthcare"="hospital"](${a})`, pharmacy:`${_nw('amenity','pharmacy',a)};node["shop"="pharmacy"](${a})`, grocery:`${_nw('amenity','supermarket',a)};node["shop"="supermarket"](${a});node["shop"="grocery"](${a});node["shop"="convenience"](${a})`, gas:`${_nw('amenity','fuel',a)};node["shop"="gas"](${a})`, restaurant:_nw('amenity','restaurant',a), school:_nw('amenity','school',a), bank:_nw('amenity','bank',a), hotel:`${_nw('tourism','hotel',a)};node["amenity"="hotel"](${a})` };
    return `[out:json];(${q[amenityType] || _nw('amenity',amenityType,a)});out center 1;`;
  }
  clearNearestResult();
  setStatus(`Finding nearest ${amenityType}…`, 'loading');
  for (const r of [10000, 20000]) {
    try {
      const resp = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(_q(r))}`);
      const data = await resp.json();
      if (data.elements && data.elements.length) {
        const el = data.elements[0];
        const lat = el.center ? el.center.lat : el.lat;
        const lng = el.center ? el.center.lon : el.lon;
        const name = el.tags.name || amenityType;
        const dist = L.latLng(currentLat, currentLng).distanceTo(L.latLng(lat, lng));
        nearestMarker = L.marker([lat, lng], { icon: L.divIcon({ className: '', html: `<div style="background:#ff3b30;color:#fff;font-size:10px;font-weight:700;padding:3px 7px;border-radius:10px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);transform:translateX(-50%);">${name}</div>`, iconSize: null, iconAnchor: [0, 0] }) }).addTo(map);
        nearestLine = L.polyline([[currentLat, currentLng], [lat, lng]], { color: '#ff3b30', weight: 2, opacity: 0.7, dashArray: '6,6' }).addTo(map);
        setStatus(`${name} — ${(dist / 1609.344).toFixed(2)} mi (${(dist / 1000).toFixed(2)} km)`, 'success');
        return;
      }
    } catch {}
  }
  setStatus(`No ${amenityType} found nearby`, 'error');
}
