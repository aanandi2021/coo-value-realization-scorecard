// App controller — bootstrap, routing, state, analyze workflow.

const STATE = window.STATE = {
  refdata: null,
  examples: null,
  health: null,
  session: null,
  kpiCanvas: null,
  selectedKpiId: null,

  input: null,
  analysis: null,
  insight: '',
  story: null,
  storyMode: 'combine',
  storyUser: {},

  lastUsage: null,
  lastLatencyMs: null,
};

const SCREENS_IN_ORDER = ['input', 'scorecard', 'kpi', 'canvas', 'risk', 'story', 'summary', 'strategic', 'toc'];
const SCREEN_LABELS = {
  input: 'INPUT',
  scorecard: 'SCORECARD',
  kpi: 'KPI ALIGNMENT',
  canvas: 'KPI CANVAS',
  risk: 'RISK ANALYSIS',
  story: 'SUCCESS STORY',
  summary: 'SUMMARY SNAPSHOT',
  strategic: 'STRATEGIC ANALYSIS',
  toc: 'THEORY OF CHANGE',
};

let currentScreen = 'input';

function navigate(screen) {
  if (!SCREENS_IN_ORDER.includes(screen)) screen = 'input';
  currentScreen = screen;
  window.location.hash = screen;
  rerender();
}

function rerender() {
  // Highlight active nav link
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.screen === currentScreen);
  });

  // Mount the screen
  const content = document.getElementById('content');
  content.innerHTML = '';
  const fn = Screens[currentScreen];
  if (!fn) {
    content.appendChild(emptyState('Unknown screen.', 'input'));
    return;
  }
  try {
    content.appendChild(fn());
  } catch (err) {
    console.error(err);
    content.innerHTML = `<div class="loading">Render error: ${err.message}</div>`;
  }
  content.scrollTop = 0;

  // Update header right-side
  document.getElementById('valueScore').textContent =
    STATE.analysis?.scores?.valueScore != null ? STATE.analysis.scores.valueScore : '—';
  const nextBtn = document.getElementById('nextStepBtn');
  const idx = SCREENS_IN_ORDER.indexOf(currentScreen);
  const next = idx >= 0 && idx < SCREENS_IN_ORDER.length - 1 ? SCREENS_IN_ORDER[idx + 1] : null;
  if (next && STATE.analysis) {
    nextBtn.disabled = false;
    nextBtn.textContent = 'NEXT: ' + SCREEN_LABELS[next];
    nextBtn.onclick = () => navigate(next);
  } else if (currentScreen === 'input' && !STATE.analysis) {
    nextBtn.disabled = true;
    nextBtn.textContent = 'ANALYZE FIRST';
  } else {
    nextBtn.disabled = true;
    nextBtn.textContent = 'DONE';
  }

  // Footer
  document.getElementById('latencyReadout').textContent =
    STATE.lastLatencyMs != null ? STATE.lastLatencyMs + 'ms' : '—';
  document.getElementById('llmMode').textContent = STATE.health?.mode || '…';
}

async function runAnalyze(input) {
  try {
    toast('Analyzing initiative…');
    const t0 = Date.now();
    const res = await API.analyze(input);
    STATE.input = input;
    STATE.analysis = res.analysis;
    STATE.insight = res.insight || '';
    STATE.lastUsage = res.usage;
    STATE.lastLatencyMs = res.latencyMs || (Date.now() - t0);
    STATE.story = null;
    STATE.storyUser = {};
    STATE.storyMode = 'combine';
    STATE.session = await API.session();
    toast(`Analysis complete (${res.usage?.mode || '?'}, ${STATE.lastLatencyMs}ms).`);
    navigate('scorecard');
  } catch (err) {
    console.error(err);
    toast('Analyze failed: ' + err.message);
  }
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { t.hidden = true; }, 2800);
}

// Hash routing
window.addEventListener('hashchange', () => {
  const h = window.location.hash.replace('#', '');
  if (SCREENS_IN_ORDER.includes(h)) {
    currentScreen = h;
    rerender();
  }
});

document.querySelectorAll('.nav-link').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    navigate(a.dataset.screen);
  });
});

(async function boot() {
  try {
    const [refdata, examples, health, session, kpiCanvas] = await Promise.all([
      API.refdata(), API.examples(), API.health(), API.session(),
      API.kpiCanvas().catch(() => ({ categories: {}, kpis: [] })),
    ]);
    STATE.refdata = refdata;
    STATE.examples = examples;
    STATE.health = health;
    STATE.session = session;
    STATE.kpiCanvas = kpiCanvas;
    const h = window.location.hash.replace('#', '');
    currentScreen = SCREENS_IN_ORDER.includes(h) ? h : 'input';
    rerender();
  } catch (err) {
    document.getElementById('content').innerHTML =
      `<div class="loading">Failed to boot: ${err.message}</div>`;
  }
})();
