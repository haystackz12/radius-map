function toggleSection(name) {
  const section = document.querySelector(`[data-section="${name}"]`);
  if (!section) return;
  section.classList.toggle('collapsed');
  let collapsed = {};
  try { collapsed = JSON.parse(localStorage.getItem('rm_collapsed') || '{}'); } catch {}
  collapsed[name] = section.classList.contains('collapsed');
  localStorage.setItem('rm_collapsed', JSON.stringify(collapsed));
}

function restoreCollapsed() {
  try {
    const collapsed = JSON.parse(localStorage.getItem('rm_collapsed') || '{}');
    Object.keys(collapsed).forEach(name => {
      if (collapsed[name]) {
        const section = document.querySelector(`[data-section="${name}"]`);
        if (section) section.classList.add('collapsed');
      }
    });
  } catch {}
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
    else if (document.getElementById('about-overlay').classList.contains('open')) toggleAbout();
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

function getSecondRadiusMeters() {
  const slider2 = document.getElementById('radius-slider-2');
  if (!slider2) return 0;
  const val = parseFloat(slider2.value);
  if (currentUnit === 'mi') return val * 1609.344;
  if (currentUnit === 'ft') return val * 0.3048;
  return val * 1000;
}

function removeSecondCircle() {
  if (secondCircle) {
    if (map.hasLayer(secondCircle)) map.removeLayer(secondCircle);
    secondCircle = null;
  }
}

function drawSecondCircle() {
  removeSecondCircle();
  if (!concentricActive) return;
  secondCircle = L.circle([currentLat, currentLng], {
    radius: getSecondRadiusMeters(), color: currentColor, weight: 2, opacity: 0.6,
    fillColor: currentColor, fillOpacity: currentOpacity * 0.5, dashArray: '6,4'
  }).addTo(map);
  updateSecondStats();
}

function updateSecondStats() {
  const el = document.getElementById('stat-second');
  const display2 = document.getElementById('radius-display-2');
  const unitLabel2 = document.getElementById('radius-unit-2');
  const slider2 = document.getElementById('radius-slider-2');
  if (!slider2 || !concentricActive) {
    if (el) el.textContent = '—';
    return;
  }
  const val2 = parseFloat(slider2.value);
  const formatted = currentUnit === 'ft' ? Math.round(val2) : val2.toFixed(1);
  if (el) el.textContent = formatted + ' ' + currentUnit;
  if (display2) display2.textContent = formatted;
  if (unitLabel2) unitLabel2.textContent = currentUnit;
}

function toggleConcentric() {
  concentricActive = !concentricActive;
  const wrap = document.getElementById('concentric-wrap');
  const btn = document.getElementById('concentric-btn');
  if (wrap) wrap.style.display = concentricActive ? 'block' : 'none';
  if (btn) {
    btn.classList.toggle('active', concentricActive);
    const label = btn.childNodes[btn.childNodes.length - 1];
    if (label) label.textContent = concentricActive ? ' Remove 2nd Ring' : ' Add 2nd Ring';
  }
  if (!concentricActive) {
    removeSecondCircle();
  } else {
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
  updateSecondStats();
}

function printMap() {
  setStatus('Preparing print view…', 'loading');
  if (circle) map.flyToBounds(circle.getBounds(), { padding: [60, 60], animate: false });
  map.invalidateSize();
  setTimeout(function() {
    if (typeof leafletImage !== 'undefined') {
      leafletImage(map, function(err, canvas) {
        if (!err && canvas) {
          try { canvas.toDataURL(); openPrintTab(canvas); return; } catch {}
        }
        printFallback();
      });
    } else {
      printFallback();
    }
  }, 300);
}

function printFallback() {
  if (typeof html2canvas === 'undefined') { setStatus('Print unavailable — export libraries not loaded', 'error'); return; }
  html2canvas(document.getElementById('map'), { useCORS: true, allowTaint: false, scale: 2 })
    .then(canvas => openPrintTab(canvas))
    .catch(() => setStatus('Print failed — try Save as PNG instead', 'error'));
}

function openPrintTab(canvas) {
  const addr = document.getElementById('address-input').value || 'Radius Map';
  const radius = document.getElementById('stat-radius').textContent;
  const dataUrl = canvas.toDataURL('image/png');
  const w = window.open('');
  if (!w) { setStatus('Pop-up blocked — allow pop-ups and try again', 'error'); return; }
  w.document.write(`<html><head><title>Print — ${addr}</title><style>body{margin:0;text-align:center;font-family:sans-serif}img{max-width:100%;height:auto}p{margin:8px;font-size:12px;color:#666}</style></head><body><img src="${dataUrl}"><p>${addr} · Radius: ${radius} · ${new Date().toLocaleDateString()}</p></body></html>`);
  w.document.close();
  w.onload = function() { w.print(); };
  setStatus('Print view opened', 'success');
}

function toggleTheme() {
  const isLight = document.body.getAttribute('data-theme') === 'light';
  const newTheme = isLight ? 'dark' : 'light';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('rm_theme', newTheme);
  const btn = document.getElementById('theme-btn');
  if (btn) btn.innerHTML = newTheme === 'light'
    ? '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>';
}

function restoreTheme() {
  const theme = localStorage.getItem('rm_theme');
  if (theme === 'light') {
    document.body.setAttribute('data-theme', 'light');
    const btn = document.getElementById('theme-btn');
    if (btn) btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/></svg>';
  }
}

/* --- Init --- */
restoreTheme();

document.addEventListener('DOMContentLoaded', function() {
  const slider2 = document.getElementById('radius-slider-2');
  if (slider2) {
    slider2.addEventListener('input', function(e) {
      e.stopPropagation();
      drawSecondCircle();
    });
  }
});
buildColorOptions();
restoreFromURL();
buildPresets();
restoreCollapsed();

const urlParams = new URLSearchParams(location.search);
const willDetect = !urlParams.has('lat');
const savedTheme = localStorage.getItem('rm_theme');
initMap(willDetect);
if (willDetect) detectLocation();
setTimeout(startOnboarding, 800);
