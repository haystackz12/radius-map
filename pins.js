/* ── Pin Management ── */
async function pinCurrent() {
  const val = parseFloat(document.getElementById('radius-slider').value);
  const label = document.getElementById('address-input').value.trim() ||
                `${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`;
  const defaultName = label.split(',')[0].trim();
  const name = prompt('Name this pin:', defaultName) || defaultName;
  let layer;
  if (radiusMode === 'drivetime') {
    setStatus('Calculating drive time for pin…', 'loading');
    const isoLayer = await fetchIsochroneLayer(currentLat, currentLng, currentColor, currentOpacity);
    if (isoLayer) { layer = isoLayer.addTo(map); }
    else { setStatus('Could not calculate drive time for pin', 'error'); return; }
  } else {
    layer = L.circle([currentLat, currentLng], {
      radius: getRadiusMeters(),
      color: currentColor,
      weight: 2, opacity: 0.9,
      fillColor: currentColor, fillOpacity: currentOpacity
    }).addTo(map);
  }
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
  if (radiusMode === 'radius') computeOverlaps();
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

/* ── Isochrone layer helper ── */
async function fetchIsochroneLayer(lat, lng, color, opacity) {
  const key = window.ORS_API_KEY;
  if (!key) return null;
  try {
    const resp = await fetch(`https://api.openrouteservice.org/v2/isochrones/${transportMode}`, {
      method: 'POST',
      headers: { 'Authorization': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations: [[lng, lat]], range: [travelTimeMinutes * 60], range_type: 'time' })
    });
    if (!resp.ok) return null;
    const geojson = await resp.json();
    return L.geoJSON(geojson, { style: { color: color, weight: 2, fillColor: color, fillOpacity: opacity } });
  } catch { return null; }
}

/* ── Rebuild pin layers on mode switch ── */
async function rebuildPinLayers(newMode) {
  if (!pins.length) return;
  setStatus(newMode === 'drivetime' ? 'Calculating drive time zones…' : 'Rebuilding radius circles…', 'loading');
  // First pass: remove all existing pin layers from map
  for (const p of pins) {
    if (p.layer) { map.removeLayer(p.layer); p.layer = null; }
  }
  // Second pass: rebuild each pin sequentially
  for (const p of pins) {
    if (newMode === 'drivetime') {
      const isoLayer = await fetchIsochroneLayer(p.lat, p.lng, p.color, currentOpacity);
      p.layer = isoLayer ? isoLayer.addTo(map) : L.layerGroup().addTo(map);
    } else {
      const radiusM = p.unit === 'mi' ? p.radiusVal * 1609.344 : p.unit === 'ft' ? p.radiusVal * 0.3048 : p.radiusVal * 1000;
      p.layer = L.circle([p.lat, p.lng], {
        radius: radiusM, color: p.color, weight: 2, opacity: 0.9,
        fillColor: p.color, fillOpacity: currentOpacity
      }).addTo(map);
    }
  }
  if (newMode === 'radius') computeOverlaps();
  setStatus(newMode === 'drivetime' ? 'Drive time zones ready' : 'Radius circles ready', 'success');
}

/* ── Undo / Redo ── */
let undoStack = [];
let redoStack = [];
let _lastState = null;
let _skipUndo = false;
const MAX_UNDO = 10;

function captureState() {
  return {
    lat: currentLat, lng: currentLng,
    radiusVal: parseFloat(document.getElementById('radius-slider').value),
    unit: currentUnit, color: currentColor, opacity: currentOpacity
  };
}

function statesEqual(a, b) {
  return a && b && a.lat === b.lat && a.lng === b.lng && a.radiusVal === b.radiusVal && a.unit === b.unit && a.color === b.color && a.opacity === b.opacity;
}

function pushUndo() {
  if (_skipUndo) return;
  const current = captureState();
  if (_lastState && !statesEqual(_lastState, current)) {
    undoStack.push(_lastState);
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
  }
  _lastState = current;
}

function applyState(s) {
  _skipUndo = true;
  currentLat = s.lat; currentLng = s.lng;
  currentColor = s.color; currentOpacity = s.opacity;
  if (s.unit !== currentUnit) setUnit(s.unit);
  document.getElementById('radius-slider').value = s.radiusVal;
  document.getElementById('opacity-slider').value = Math.round(s.opacity * 100);
  drawCircle();
  _lastState = captureState();
  _skipUndo = false;
  if (typeof updateHUD === 'function') updateHUD();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(captureState());
  applyState(undoStack.pop());
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(captureState());
  applyState(redoStack.pop());
}

/* ── Fullscreen ── */
function toggleFullscreen() {
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  } else {
    const el = document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
  }
}

/* ── Reset ── */
function resetEverything() {
  if (!confirm('Reset everything? This will clear all pins, rings, and settings.')) return;
  pins.forEach(p => { map.removeLayer(p.layer); if (p.labelMarker) map.removeLayer(p.labelMarker); });
  pins = [];
  renderPinList();
  if (concentricActive) { concentricActive = false; removeSecondCircle(); }
  currentUnit = 'mi';
  const slider = document.getElementById('radius-slider');
  slider.min = 0.1; slider.max = 50; slider.step = 0.1; slider.value = 5;
  currentColor = '#4f8ef7';
  currentOpacity = 0.15;
  document.getElementById('opacity-slider').value = 15;
  setTileLayer('street');
  document.getElementById('map').classList.remove('satellite-theme');
  document.getElementById('address-input').value = '';
  document.getElementById('suggestions').style.display = 'none';
  const cb = document.getElementById('search-clear');
  if (cb) cb.style.display = 'none';
  if (distanceModeActive) toggleDistanceMode();
  if (clickModeActive) toggleClickMode();
  clearDistance();
  if (typeof hideToolPill === 'function') hideToolPill();
  overlapLayers.forEach(l => map.removeLayer(l));
  overlapLayers = [];
  // Remove isochrone if present
  if (typeof isochroneLayer !== 'undefined' && isochroneLayer) { map.removeLayer(isochroneLayer); isochroneLayer = null; }
  if (typeof radiusMode !== 'undefined') radiusMode = 'radius';
  userHasSearched = false;
  locationResolved = false;
  detectLocation();
  setStatus('Reset complete', 'success');
  if (typeof updateHUD === 'function') updateHUD();
}

/* ── CSV Import ── */
function downloadCSVTemplate() {
  const csv = 'Address\n1600 Pennsylvania Ave NW Washington DC\n221B Baker Street London\n1 Infinite Loop Cupertino CA\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'drawradius-import-template.csv';
  a.click();
}

let _csvImporting = false;
let _csvProgress = '';

function handleCSVImport(file) {
  const reader = new FileReader();
  reader.onload = async function(e) {
    const lines = e.target.result.split('\n').map(l => l.trim()).filter(Boolean);
    const start = /^(address|name|location|city)/i.test(lines[0]) ? 1 : 0;
    const addresses = lines.slice(start).map(l => l.split(',')[0].trim()).filter(Boolean).slice(0, 20);
    if (!addresses.length) { setStatus('No addresses found in CSV', 'error'); return; }
    _csvImporting = true;
    let imported = 0;
    const bounds = L.latLngBounds([]);
    for (let i = 0; i < addresses.length; i++) {
      _csvProgress = `Geocoding ${i + 1} of ${addresses.length}…`;
      if (typeof renderPopover === 'function' && activeFab === 'settings') renderPopover('settings');
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(addresses[i])}&limit=1`;
        const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data = await resp.json();
        if (data.length) {
          const r = data[0];
          const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
          const radiusVal = parseFloat(document.getElementById('radius-slider').value);
          const radiusM = getRadiusMeters();
          const layer = L.circle([lat, lng], {
            radius: radiusM, color: currentColor, weight: 2, opacity: 0.9,
            fillColor: currentColor, fillOpacity: currentOpacity
          }).addTo(map);
          const name = addresses[i].split(',')[0].trim();
          const labelMarker = L.marker([lat, lng], {
            icon: L.divIcon({ className: 'pin-label-icon', html: `<div class="pin-map-label">${name}</div>`, iconSize: null, iconAnchor: null })
          }).addTo(map);
          pins.push({ id: Date.now() + i, lat, lng, radiusVal, unit: currentUnit, color: currentColor, label: addresses[i], name, layer, labelMarker });
          bounds.extend(layer.getBounds());
          imported++;
        }
      } catch {}
      if (i < addresses.length - 1) await new Promise(res => setTimeout(res, 1100));
    }
    _csvImporting = false;
    _csvProgress = '';
    renderPinList();
    computeOverlaps();
    if (bounds.isValid()) map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    setStatus(`Imported ${imported} of ${addresses.length} locations`, 'success');
    if (typeof renderPopover === 'function') renderPopover('settings');
  };
  reader.readAsText(file);
}

/* ── Circle Helpers ── */
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

/* ── Overlaps ── */
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
