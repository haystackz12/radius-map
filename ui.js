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

/* --- Init --- */
buildColorOptions();
restoreFromURL();
buildPresets();
restoreCollapsed();

const urlParams = new URLSearchParams(location.search);
const willDetect = !urlParams.has('lat');
initMap(willDetect);
if (willDetect) detectLocation();
setTimeout(startOnboarding, 800);
