// CoO Value Realization Scorecard — Express server on port 5260.
//
// Endpoints:
//   GET  /                       → SPA shell
//   GET  /api/refdata            → categories, kpis, risks, tolerance, priorities, departments
//   GET  /api/kpi-canvas         → rich KPI master DB (definition, formula, unit, data required) for the Canvas screen
//   GET  /api/examples           → preset example datasets for the "Load Example Data" button
//   POST /api/analyze            → run the full analysis pipeline
//   POST /api/generate-story     → (re)generate the success story in a chosen mode
//   GET  /api/session            → return cumulative session telemetry (cost/tokens/runs)
//   POST /api/session/reset      → clear cumulative telemetry
//   GET  /api/export             → JSON export of the most recent assessment
//   GET  /api/health             → mode + token availability + uptime

const express = require('express');
const path = require('path');
const fs = require('fs');

// Lightweight .env loader so we don't add a dependency.
(function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
})();

const llm = require('./lib/llm');
const pipeline = require('./lib/analyze');

const PORT = parseInt(process.env.PORT || '5260', 10);
const app = express();
app.use(express.json({ limit: '256kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory session state — single-user demo prototype.
const SESSION = {
  lastInput: null,
  lastAnalysis: null,
  lastInsight: '',
  lastStory: null,
  cumulative: {
    processed_initiatives: 0,
    total_prompt_tokens: 0,
    total_completion_tokens: 0,
    total_session_cost_usd: 0,
  },
  startedAt: new Date().toISOString(),
};

function loadJsonFile(rel) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, rel), 'utf-8'));
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mode: llm.tokenAvailable() ? 'live' : 'mock',
    model: llm.MODEL,
    uptimeSec: Math.round((Date.now() - new Date(SESSION.startedAt).getTime()) / 1000),
  });
});

app.get('/api/refdata', (req, res) => {
  res.json({
    categories: loadJsonFile('data/value-categories.json').categories,
    kpis: loadJsonFile('data/kpis.json').kpis,
    risks: loadJsonFile('data/risks.json').risks,
    tolerance: loadJsonFile('data/tolerance.json').framework,
    priorities: loadJsonFile('data/strategic-priorities.json').priorities,
    departments: loadJsonFile('data/departments.json').departments,
  });
});

app.get('/api/kpi-canvas', (req, res) => {
  res.json(loadJsonFile('data/kpi-canvas.json'));
});

app.get('/api/examples', (req, res) => {
  res.json(loadJsonFile('data/examples.json'));
});

app.post('/api/analyze', async (req, res) => {
  const input = req.body || {};
  if (!input.title || !input.description) {
    return res.status(400).json({ error: 'title and description are required' });
  }
  try {
    const { analysis, insight, usage, latencyMs } = await pipeline.analyze(input);
    SESSION.lastInput = input;
    SESSION.lastAnalysis = analysis;
    SESSION.lastInsight = insight;
    SESSION.lastStory = null;
    SESSION.cumulative.processed_initiatives += 1;
    SESSION.cumulative.total_prompt_tokens += usage.prompt_tokens || 0;
    SESSION.cumulative.total_completion_tokens += usage.completion_tokens || 0;
    SESSION.cumulative.total_session_cost_usd += usage.estimated_cost_usd || 0;
    res.json({ analysis, insight, usage, latencyMs, mode: usage.mode });
  } catch (err) {
    console.error('[analyze] error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/generate-story', async (req, res) => {
  const { mode = 'combine', userInputs = {} } = req.body || {};
  if (!SESSION.lastAnalysis || !SESSION.lastInput) {
    return res.status(400).json({ error: 'no analysis in session — run /api/analyze first' });
  }
  try {
    const t0 = Date.now();
    const { story, usage } = await pipeline.generateStory({
      input: SESSION.lastInput,
      analysis: SESSION.lastAnalysis,
      mode,
      userInputs,
    });
    SESSION.lastStory = { story, mode, userInputs, generatedAt: new Date().toISOString() };
    SESSION.cumulative.total_prompt_tokens += usage.prompt_tokens || 0;
    SESSION.cumulative.total_completion_tokens += usage.completion_tokens || 0;
    SESSION.cumulative.total_session_cost_usd += usage.estimated_cost_usd || 0;
    res.json({ story, mode, usage, latencyMs: Date.now() - t0 });
  } catch (err) {
    console.error('[story] error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/validate', (req, res) => {
  if (!SESSION.lastAnalysis) return res.status(400).json({ error: 'no analysis in session' });
  const { status } = req.body || {};
  if (!['PENDING', 'SUCCESS', 'FAILED'].includes(status)) {
    return res.status(400).json({ error: 'status must be PENDING|SUCCESS|FAILED' });
  }
  SESSION.lastAnalysis.validationStatus = status;
  res.json({ ok: true, validationStatus: status });
});

app.get('/api/session', (req, res) => {
  res.json({
    cumulative: SESSION.cumulative,
    hasAnalysis: Boolean(SESSION.lastAnalysis),
    hasStory: Boolean(SESSION.lastStory),
    startedAt: SESSION.startedAt,
  });
});

app.post('/api/session/reset', (req, res) => {
  SESSION.lastInput = null;
  SESSION.lastAnalysis = null;
  SESSION.lastInsight = '';
  SESSION.lastStory = null;
  SESSION.cumulative = {
    processed_initiatives: 0,
    total_prompt_tokens: 0,
    total_completion_tokens: 0,
    total_session_cost_usd: 0,
  };
  SESSION.startedAt = new Date().toISOString();
  res.json({ ok: true });
});

app.get('/api/export', (req, res) => {
  if (!SESSION.lastAnalysis) return res.status(404).json({ error: 'no assessment to export' });
  const payload = {
    exportedAt: new Date().toISOString(),
    input: SESSION.lastInput,
    analysis: SESSION.lastAnalysis,
    insight: SESSION.lastInsight,
    story: SESSION.lastStory,
    sessionCumulative: SESSION.cumulative,
  };
  res.setHeader('Content-Disposition', `attachment; filename="value-scorecard-${Date.now()}.json"`);
  res.json(payload);
});

app.listen(PORT, () => {
  const banner = [
    '┌─────────────────────────────────────────────────────────┐',
    '│  CoO VALUE REALIZATION SCORECARD                        │',
    `│  http://localhost:${PORT}                                    │`,
    `│  LLM mode: ${llm.tokenAvailable() ? 'live (GitHub Models)' : 'mock (deterministic)'}                      │`,
    '└─────────────────────────────────────────────────────────┘',
  ].join('\n');
  console.log('\n' + banner + '\n');
});
