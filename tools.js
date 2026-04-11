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
    const _cb = document.getElementById('search-clear'); if (_cb) _cb.style.display = 'block';
    hideEmptyState(); drawCircle();
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
  if (Date.now() - distanceModeActivatedAt < 400) return;
  if (distancePoints.length >= 2) clearDistance();
  distancePoints.push(latlng);
  distanceMarkers.push(L.marker(latlng, { icon: L.divIcon({ className: '', html: `<div style="width:10px;height:10px;border-radius:50%;background:#4f8ef7;border:2px solid #fff;"></div>`, iconSize: [10, 10], iconAnchor: [5, 5] }) }).addTo(map));
  if (distancePoints.length === 2) {
    distanceLine = L.polyline(distancePoints, { color: '#4f8ef7', weight: 3, opacity: 0.9, dashArray: '6,6' }).addTo(map);
    const m = distancePoints[0].distanceTo(distancePoints[1]), mi = (m / 1609.344).toFixed(2), km = (m / 1000).toFixed(2);
    const mid = L.latLng((distancePoints[0].lat + distancePoints[1].lat) / 2, (distancePoints[0].lng + distancePoints[1].lng) / 2);
    distanceLabel = L.marker(mid, { icon: L.divIcon({ className: '', html: `<div class="distance-label">${mi} mi · ${km} km</div>`, iconSize: [120, 24], iconAnchor: [60, 12] }) }).addTo(map);
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

/* ── CSV Import ── */
let _csvImporting = false, _csvProgress = '';
function downloadCSVTemplate() {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['Address\n1600 Pennsylvania Ave NW Washington DC\n221B Baker Street London\n1 Infinite Loop Cupertino CA\n'], { type: 'text/csv' })); a.download = 'drawradius-import-template.csv'; a.click();
}
function handleCSVImport(file) {
  const reader = new FileReader();
  reader.onload = async function(e) {
    const lines = e.target.result.split('\n').map(l => l.trim()).filter(Boolean);
    const start = /^(address|name|location|city)/i.test(lines[0]) ? 1 : 0;
    const addrs = lines.slice(start).map(l => l.split(',')[0].trim()).filter(Boolean).slice(0, 20);
    if (!addrs.length) { setStatus('No addresses found in CSV', 'error'); return; }
    _csvImporting = true; let imported = 0; const bounds = L.latLngBounds([]);
    for (let i = 0; i < addrs.length; i++) {
      _csvProgress = `Geocoding ${i + 1} of ${addrs.length}…`;
      if (typeof renderPopover === 'function' && activeFab === 'settings') renderPopover('settings');
      try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(addrs[i])}&limit=1`, { headers: { 'Accept-Language': 'en' } });
        const data = await resp.json();
        if (data.length) {
          const r = data[0], lat = parseFloat(r.lat), lng = parseFloat(r.lon), name = addrs[i].split(',')[0].trim();
          const layer = L.circle([lat, lng], { radius: getRadiusMeters(), color: currentColor, weight: 2, opacity: 0.9, dashArray: '6,4', fillColor: currentColor, fillOpacity: currentOpacity * 0.7 }).addTo(map);
          const labelMarker = L.marker([lat, lng], { icon: L.divIcon({ className: 'pin-label-icon', html: `<div class="pin-map-label">${sanitize(name)}</div>`, iconSize: null, iconAnchor: null }) }).addTo(map);
          pins.push({ id: Date.now() + i, lat, lng, radiusVal: parseFloat(document.getElementById('radius-slider').value), unit: currentUnit, color: currentColor, label: addrs[i], name, layer, labelMarker });
          bounds.extend(layer.getBounds()); imported++;
        }
      } catch {}
      if (i < addrs.length - 1) await new Promise(res => setTimeout(res, 1100));
    }
    _csvImporting = false; _csvProgress = ''; renderPinList(); computeOverlaps();
    if (bounds.isValid()) map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    setStatus(`Imported ${imported} of ${addrs.length} locations`, 'success');
    if (typeof renderPopover === 'function') renderPopover('settings');
  };
  reader.readAsText(file);
}

/* ── Recent Searches ── */
function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem('rm_recent_searches') || '[]'); } catch { return []; }
}

function saveRecentSearch(query) {
  let recent = getRecentSearches().filter(q => q !== query);
  recent.unshift(query);
  if (recent.length > 8) recent = recent.slice(0, 8);
  localStorage.setItem('rm_recent_searches', JSON.stringify(recent));
}

function getFavorites() { try { return JSON.parse(localStorage.getItem('rm_favorites') || '[]'); } catch { return []; } }
function toggleFavorite(addr) {
  let favs = getFavorites();
  const idx = favs.indexOf(addr);
  if (idx >= 0) { favs.splice(idx, 1); } else { favs.unshift(addr); if (favs.length > 10) favs = favs.slice(0, 10); }
  localStorage.setItem('rm_favorites', JSON.stringify(favs));
}

function _buildFavItem(q, isFav) {
  const item = document.createElement('div');
  item.className = 'suggestion-item';
  item.style.cssText = 'display:flex;align-items:center;gap:6px;';
  item.innerHTML = `<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${sanitize(q)}</span><span style="color:${isFav ? '#f5a623' : 'rgba(0,0,0,0.2)'};font-size:14px;cursor:pointer;flex-shrink:0;" data-fav-addr>${isFav ? '★' : '☆'}</span>`;
  item.onclick = () => { document.getElementById('address-input').value = q; searchAddress(); };
  item.querySelector('[data-fav-addr]').onclick = (e) => { e.stopPropagation(); toggleFavorite(q); showRecentSearches(); };
  return item;
}

function showRecentSearches() {
  const favs = getFavorites();
  const recent = getRecentSearches().filter(q => !favs.includes(q));
  if (!favs.length && !recent.length) return;
  const box = document.getElementById('suggestions');
  box.innerHTML = '';
  if (favs.length) {
    const fh = document.createElement('div'); fh.className = 'recent-header'; fh.innerHTML = '<span>Favorites</span>'; box.appendChild(fh);
    favs.forEach(q => box.appendChild(_buildFavItem(q, true)));
  }
  if (recent.length) {
    const rh = document.createElement('div'); rh.className = 'recent-header'; rh.innerHTML = '<span>Recent searches</span><button onclick="clearRecentSearches(event)">Clear</button>'; box.appendChild(rh);
    recent.forEach(q => box.appendChild(_buildFavItem(q, false)));
  }
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
        nearestMarker = L.marker([lat, lng], { icon: L.divIcon({ className: '', html: `<div style="background:#ff3b30;color:#fff;font-size:10px;font-weight:700;padding:3px 7px;border-radius:10px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);transform:translateX(-50%);">${sanitize(name)}</div>`, iconSize: null, iconAnchor: [0, 0] }) }).addTo(map);
        nearestLine = L.polyline([[currentLat, currentLng], [lat, lng]], { color: '#ff3b30', weight: 2, opacity: 0.7, dashArray: '6,6' }).addTo(map);
        setStatus(`${name} — ${(dist / 1609.344).toFixed(2)} mi (${(dist / 1000).toFixed(2)} km)`, 'success');
        return;
      }
    } catch {}
  }
  setStatus(`No ${amenityType} found nearby`, 'error');
}
