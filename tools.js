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
  map.invalidateSize();

  setTimeout(function() {
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
  }, 100);
}

function savePNGFallback() {
  if (typeof html2canvas === 'undefined') {
    setStatus('PNG export unavailable — libraries failed to load', 'error');
    return;
  }
  setStatus('Generating PNG (fallback)…', 'loading');
  map.invalidateSize();
  setTimeout(function() {
    html2canvas(document.getElementById('map'), { useCORS: true, allowTaint: false, scale: 2 })
      .then(canvas => downloadBlob(canvas))
      .catch(e => setStatus('PNG export failed — ' + e.message, 'error'));
  }, 100);
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
        const pts = circleIntersectionPolygon(a, b, dist);
        if (pts.length > 2) {
          const poly = L.polygon(pts, { color: '#f5a623', weight: 0, fillColor: '#f5a623', fillOpacity: 0.25 }).addTo(map);
          overlapLayers.push(poly);
        }
      }
    }
  }
}

function circleIntersectionPolygon(a, b, dist) {
  const R = a.r, r = b.r, d = dist;
  const aCenter = L.latLng(a.lat, a.lng), bCenter = L.latLng(b.lat, b.lng);
  const angleA = Math.acos(Math.max(-1, Math.min(1, (R*R + d*d - r*r) / (2*R*d))));
  const angleB = Math.acos(Math.max(-1, Math.min(1, (r*r + d*d - R*R) / (2*r*d))));
  const bearing = getBearing(aCenter, bCenter);
  const pts = [];
  for (let i = 0; i <= 20; i++) pts.push(destinationPoint(aCenter, R, bearing - angleA + (2*angleA*i/20)));
  for (let i = 0; i <= 20; i++) pts.push(destinationPoint(bCenter, r, (bearing+Math.PI) + angleB - (2*angleB*i/20)));
  return pts;
}

function getBearing(from, to) {
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const lat1 = from.lat * Math.PI / 180, lat2 = to.lat * Math.PI / 180;
  return Math.atan2(Math.sin(dLng) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng));
}

function destinationPoint(origin, distM, bearing) {
  const R = 6371000, lat1 = origin.lat * Math.PI / 180, lng1 = origin.lng * Math.PI / 180, d = distM / R;
  const lat2 = Math.asin(Math.sin(lat1)*Math.cos(d) + Math.cos(lat1)*Math.sin(d)*Math.cos(bearing));
  const lng2 = lng1 + Math.atan2(Math.sin(bearing)*Math.sin(d)*Math.cos(lat1), Math.cos(d) - Math.sin(lat1)*Math.sin(lat2));
  return [lat2 * 180 / Math.PI, lng2 * 180 / Math.PI];
}

async function fetchElevation(lat, lng) {
  const el = document.getElementById('elevation-box');
  if (!el) return;
  el.innerHTML = 'Elevation: <i style="color:var(--accent)">loading…</i>';
  try {
    const resp = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`);
    const data = await resp.json();
    if (data.results && data.results[0] && data.results[0].elevation != null) {
      const m = data.results[0].elevation;
      const ft = Math.round(m * 3.28084);
      el.innerHTML = `Elevation: <b style="color:var(--text)">${ft.toLocaleString()} ft</b> / <b style="color:var(--text)">${Math.round(m).toLocaleString()} m</b>`;
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
      document.getElementById('address-input').value = data.display_name.split(',').slice(0,3).join(',');
      setStatus('Found: ' + data.display_name.split(',').slice(0,2).join(','), 'success');
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
  e.stopPropagation();
  localStorage.removeItem('rm_recent_searches');
  document.getElementById('suggestions').style.display = 'none';
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
  document.getElementById('qr-download-btn').style.display = 'flex';
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
      className: '',
      html: `<div class="pin-map-label">${name}</div>`,
      iconSize: [140, 20],
      iconAnchor: [70, -10]
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
      icon: L.divIcon({ className: '', html: `<div class="pin-map-label">${newName}</div>`, iconSize: [140, 20], iconAnchor: [70, -10] })
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

