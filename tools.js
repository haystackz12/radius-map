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

function toggleAbout() {
  document.getElementById('about-overlay').classList.toggle('open');
}

function toggleHelp() {
  document.getElementById('help-overlay').classList.toggle('open');
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

function copyShareLink() {
  const val = parseFloat(document.getElementById('radius-slider').value);
  const url = `${location.origin}${location.pathname}?lat=${currentLat.toFixed(6)}&lng=${currentLng.toFixed(6)}&r=${val}&unit=${currentUnit}`;
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
  const val = parseFloat(document.getElementById('radius-slider').value);
  const shareUrl = `${location.origin}${location.pathname}?lat=${currentLat.toFixed(6)}&lng=${currentLng.toFixed(6)}&r=${val}&unit=${currentUnit}`;
  const iframe = `<iframe src="${shareUrl}" width="600" height="450" style="border:none;border-radius:8px;" loading="lazy" allowfullscreen></iframe>`;
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

function pinCurrent() {
  const val = parseFloat(document.getElementById('radius-slider').value);
  const label = document.getElementById('address-input').value.trim() ||
                `${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`;
  const defaultName = label.split(',')[0].trim();
  const name = prompt('Name this pin:', defaultName) || defaultName;
  const layer = L.circle([currentLat, currentLng], {
    radius: getRadiusMeters(),
    color: currentColor,
    weight: 2, opacity: 0.9,
    fillColor: currentColor, fillOpacity: currentOpacity
  }).addTo(map);
  const labelMarker = L.marker([currentLat, currentLng], {
    icon: L.divIcon({
      className: 'pin-label-icon',
      html: `<div class="pin-map-label">${name}</div>`,
      iconSize: null,
      iconAnchor: null
    })
  }).addTo(map);
  pins.push({ id: Date.now(), lat: currentLat, lng: currentLng, radiusVal: val, unit: currentUnit, color: currentColor, label, name, layer, labelMarker });
  renderPinList();
  computeOverlaps();
  setStatus('Pinned: ' + name, 'success');
}

function renamePinLabel(id) {
  const pin = pins.find(p => p.id === id);
  if (!pin) return;
  const newName = prompt('Rename pin:', pin.name);
  if (!newName || newName === pin.name) return;
  pin.name = newName;
  if (pin.labelMarker) {
    map.removeLayer(pin.labelMarker);
    pin.labelMarker = L.marker([pin.lat, pin.lng], {
      icon: L.divIcon({ className: 'pin-label-icon', html: `<div class="pin-map-label">${newName}</div>`, iconSize: null, iconAnchor: null })
    }).addTo(map);
  }
  renderPinList();
}

function removePin(id) {
  const i = pins.findIndex(p => p.id === id);
  if (i < 0) return;
  map.removeLayer(pins[i].layer);
  if (pins[i].labelMarker) map.removeLayer(pins[i].labelMarker);
  pins.splice(i, 1);
  renderPinList();
  computeOverlaps();
}

function toggleFullscreen() {
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  } else {
    const el = document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
  }
  setTimeout(() => { if (typeof renderPopover === 'function') renderPopover('tools'); }, 300);
}

function resetEverything() {
  if (!confirm('Reset everything? This will clear all pins, rings, and settings.')) return;
  // Remove all pins
  pins.forEach(p => { map.removeLayer(p.layer); if (p.labelMarker) map.removeLayer(p.labelMarker); });
  pins = [];
  renderPinList();
  // Remove 2nd ring
  if (concentricActive) { concentricActive = false; removeSecondCircle(); }
  // Reset radius to 5 mi
  currentUnit = 'mi';
  const slider = document.getElementById('radius-slider');
  slider.min = 0.1; slider.max = 50; slider.step = 0.1; slider.value = 5;
  // Reset color, opacity
  currentColor = '#4f8ef7';
  currentOpacity = 0.15;
  document.getElementById('opacity-slider').value = 15;
  // Reset tile to street
  setTileLayer('street');
  document.getElementById('map').classList.remove('satellite-theme');
  // Clear search bar
  document.getElementById('address-input').value = '';
  document.getElementById('suggestions').style.display = 'none';
  const cb = document.getElementById('search-clear');
  if (cb) cb.style.display = 'none';
  // Clear distance tool
  if (distanceModeActive) toggleDistanceMode();
  if (clickModeActive) toggleClickMode();
  clearDistance();
  hideToolPill();
  // Clear overlaps
  overlapLayers.forEach(l => map.removeLayer(l));
  overlapLayers = [];
  // Re-run geolocation
  userHasSearched = false;
  locationResolved = false;
  detectLocation();
  setStatus('Reset complete', 'success');
  if (typeof updateHUD === 'function') updateHUD();
  if (typeof renderPopover === 'function') renderPopover('tools');
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
      `<span class="pin-label pin-name-edit" title="Click to rename" data-id="${p.id}">${p.name || p.label}</span>` +
      `<span class="pin-meta">${p.radiusVal.toFixed(1)} ${p.unit}</span>` +
      `<button class="pin-remove" aria-label="Remove">×</button>`;
    item.querySelector('.pin-remove').onclick = () => removePin(p.id);
    item.querySelector('.pin-name-edit').onclick = () => renamePinLabel(p.id);
    list.appendChild(item);
  });
}

