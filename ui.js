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

function toggleTheme() {
  const isLight = document.body.getAttribute('data-theme') === 'light';
  const newTheme = isLight ? 'dark' : 'light';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('rm_theme', newTheme);
  const btn = document.getElementById('theme-btn');
  if (btn) btn.innerHTML = newTheme === 'light'
    ? '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>';
  if (map) setTileLayer(newTheme === 'dark' ? 'dark' : 'street');
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
  if (slider2) slider2.addEventListener('input', function() { drawSecondCircle(); });
});
buildColorOptions();
restoreFromURL();
buildPresets();
restoreCollapsed();

const urlParams = new URLSearchParams(location.search);
const willDetect = !urlParams.has('lat');
const savedTheme = localStorage.getItem('rm_theme');
initMap(willDetect);
if (savedTheme === 'light' && map) setTileLayer('street');
if (willDetect) detectLocation();
setTimeout(startOnboarding, 800);
