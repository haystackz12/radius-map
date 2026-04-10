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
  const shortLabel = label.split(',').slice(0, 2).join(',').trim();
  const labelMarker = L.marker([currentLat, currentLng], {
    icon: L.divIcon({
      className: '',
      html: `<div class="pin-map-label">${shortLabel}</div>`,
      iconSize: [120, 20],
      iconAnchor: [60, -10]
    })
  }).addTo(map);
  pins.push({ id: Date.now(), lat: currentLat, lng: currentLng, radiusVal: val, unit: currentUnit, color: currentColor, label, layer, labelMarker });
  renderPinList();
  setStatus('Pinned: ' + label, 'success');
}

function removePin(id) {
  const i = pins.findIndex(p => p.id === id);
  if (i < 0) return;
  map.removeLayer(pins[i].layer);
  if (pins[i].labelMarker) map.removeLayer(pins[i].labelMarker);
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

function fitCircle() {
  if (circle) map.flyToBounds(circle.getBounds(), { padding: [40, 40] });
}

function startOnboarding() {
  if (localStorage.getItem('rm_onboarded')) return;
  const steps = [
    { target: '.header-search', title: 'Search an address', text: 'Type any address, city, or place to center the map.' },
    { target: '#radius-slider', title: 'Set your radius', text: 'Drag the slider or pick a preset to adjust the circle size.' },
    { target: '.gear-btn[aria-label="Settings"]', title: 'Explore the tools', text: 'Open Settings to pin locations, change colors, and export your map.' }
  ];
  let step = 0;

  const overlay = document.createElement('div');
  overlay.className = 'onboard-overlay';
  document.body.appendChild(overlay);

  function show() {
    overlay.innerHTML = '';
    if (step >= steps.length) { finish(); return; }
    const s = steps[step];
    const el = document.querySelector(s.target);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const card = document.createElement('div');
    card.className = 'onboard-card';
    card.innerHTML = `<div class="onboard-step">Step ${step + 1} of ${steps.length}</div>` +
      `<h3>${s.title}</h3><p>${s.text}</p>` +
      `<div class="onboard-actions">` +
      `<button class="onboard-skip">Skip</button>` +
      `<button class="onboard-next">${step < steps.length - 1 ? 'Next' : 'Done'}</button></div>`;
    card.querySelector('.onboard-skip').onclick = finish;
    card.querySelector('.onboard-next').onclick = () => { step++; show(); };
    overlay.appendChild(card);
  }

  function finish() {
    localStorage.setItem('rm_onboarded', 'true');
    overlay.remove();
  }

  show();
}

document.addEventListener('keydown', function(e) {
  const tag = (e.target.tagName || '').toLowerCase();
  const inInput = tag === 'input' || tag === 'textarea';

  if (e.key === 'Escape') {
    if (document.getElementById('help-overlay').classList.contains('open')) toggleHelp();
    else if (document.getElementById('modal-overlay').classList.contains('open')) toggleModal();
    return;
  }

  if (inInput) return;

  if (e.key === '?' || e.key === '/') { e.preventDefault(); toggleHelp(); return; }
  if (e.key === '+' || e.key === '=') {
    e.preventDefault();
    const slider = document.getElementById('radius-slider');
    slider.value = Math.min(parseFloat(slider.max), parseFloat(slider.value) + 1);
    drawCircle();
    return;
  }
  if (e.key === '-') {
    e.preventDefault();
    const slider = document.getElementById('radius-slider');
    slider.value = Math.max(parseFloat(slider.min), parseFloat(slider.value) - 1);
    drawCircle();
    return;
  }
});

/* --- Init --- */
buildColorOptions();
restoreFromURL();
buildPresets();

const urlParams = new URLSearchParams(location.search);
const willDetect = !urlParams.has('lat');
initMap(willDetect);
if (willDetect) detectLocation();
setTimeout(startOnboarding, 800);
