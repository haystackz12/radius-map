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

/* --- Init --- */
buildColorOptions();
restoreFromURL();
buildPresets();
initMap();

const urlParams = new URLSearchParams(location.search);
if (!urlParams.has('lat')) detectLocation();
