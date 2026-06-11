// Analyze pipeline — orchestrates LLM calls for VC matching, KPI suggestion,
// risk identification, strategic alignment, and reasoning audit.
//
// Produces the unified `analysis` object used by every UI screen.

const fs = require('fs');
const path = require('path');
const llm = require('./llm');
const lexicon = require('./lexicon');

function loadJson(file) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', file), 'utf-8'));
}

function loadRefData() {
  return {
    categories: loadJson('value-categories.json').categories,
    kpis: loadJson('kpis.json').kpis,
    risks: loadJson('risks.json').risks,
    tolerance: loadJson('tolerance.json').framework,
    priorities: loadJson('strategic-priorities.json').priorities,
  };
}

// Build the free-text blob the lexicon scores against.
function inputBlob(input) {
  return [input.title, input.description, input.outcome, input.openText].filter(Boolean).join(' ');
}

function buildAnalyzeSystemPrompt(refData) {
  return `You are a senior public-sector value realization consultant for the City of Ottawa. ` +
    `Given an initiative description, you must:\n` +
    `1. Score every Value Category in the supplied taxonomy on a 0-100 scale of contextual fit ` +
    `(scores must sum to 100). Identify PRIMARY and SECONDARY winners.\n` +
    `   The user message includes a "lexicon_prior" containing a deterministic distribution computed ` +
    `from the City's keyword/phrase lexicon. Use this as STRONG evidence, but you may override it when the ` +
    `semantic intent of the initiative clearly diverges from the lexical signal. State your rationale.\n` +
    `2. Recommend the most relevant KPIs from the supplied library. Prefer KPIs whose ` +
    `\`useWhen\` matches the initiative and avoid those flagged by \`avoidWhen\`. KPIs flagged in ` +
    `lexicon_prior.suggested_kpis carry extra weight.\n` +
    `3. Identify the most relevant risks from the risk taxonomy and their tolerance alignment.\n` +
    `4. Identify best-fit Strategic Priority from the supplied list.\n` +
    `5. Produce reasoning for EVERY category (including non-winners) for full explainability.\n` +
    `6. Produce 'suggested' content for the Success Story builder.\n` +
    `7. Produce three /100 scores: impact, ai-leverage, future-impact.\n` +
    `8. Produce a 7-column Theory of Change logic model: context, inputs, activities, outputs, outcomes, impact, learning. Each is a list of 3-4 concise bullet items derived from the input + analysis.\n` +
    `9. Generate a project reference identifier OTT-{DEPT}-{YEAR}-{SEQ}.\n\n` +
    `Matching MUST be definition-based (semantic) supplemented by lexicon evidence, not pure keyword counting. Every output must include rationale.\n\n` +
    `Reference taxonomies are provided in the user message. ` +
    `Output strictly as a JSON object matching the schema implied by the prompt.`;
}

function buildAnalyzeUserPrompt({ input, refData, lexiconPrior }) {
  return JSON.stringify({
    task: 'analyze',
    user_input: input,
    lexicon_prior: lexiconPrior,
    taxonomies: {
      categories: refData.categories.map(c => ({ id: c.id, code: c.code, name: c.name, definition: c.definition })),
      kpis: refData.kpis.map(k => ({
        id: k.id, name: k.name, type: k.type, definition: k.definition,
        categories: k.categories, dataSource: k.dataSource, calculation: k.calculation,
        useWhen: k.useWhen, avoidWhen: k.avoidWhen, driverKeywords: k.driverKeywords,
        strategicAlignment: k.strategicAlignment, department: k.department,
      })),
      risks: refData.risks.map(r => ({ id: r.id, name: r.name, intentArea: r.intentArea, definition: r.definition })),
      tolerance: refData.tolerance,
      priorities: refData.priorities.map(p => ({ id: p.id, name: p.name, definition: p.definition })),
    },
    expected_schema: {
      categories: '[{ id, name, color, score }]  // sums to 100, sorted desc',
      primary: '{ id, name, color, score }',
      secondary: '{ id, name, color, score } | null',
      kpis: '[{ id, name, type, alignment, rationale, recommendation: "PRIMARY"|"SECONDARY", dataSource, calculation, definition }]',
      risks: '[{ id, name, intentArea, rationale, cityTolerance, toleranceVerdict, consultantInsight }]',
      alignment: '{ primary: { id, name, definition }, secondary, rationale }',
      audit: '[{ id, name, color, role: "PRIMARY"|"SECONDARY"|null, rationale }]  // every category',
      storySuggested: '{ challenge, initiative, outcome, value }',
      theoryOfChange: '{ context: [..], inputs: [..], activities: [..], outputs: [..], outcomes: [..], impact: [..], learning: [..] }  // each is a short list of bullet items',
      projectReference: 'OTT-{DEPT}-{YEAR}-{SEQ} string identifier',
      validationStatus: '"PENDING" | "SUCCESS" | "FAILED"',
      scores: '{ impact, aiLeverage, futureImpact, valueScore }',
    },
  });
}

async function analyze(input) {
  const t0 = Date.now();
  const refData = loadRefData();
  const lexiconScored = lexicon.scoreText(inputBlob(input));
  const lexiconPrior = lexicon.summarizeForPrompt(lexiconScored);
  const result = await llm.complete({
    task: 'analyze',
    system: buildAnalyzeSystemPrompt(refData),
    user: buildAnalyzeUserPrompt({ input, refData, lexiconPrior }),
    input,
    refData,
    lexiconScored,
    mockPayload: input,
    temperature: 0.2,
    maxTokens: 3000,
  });

  let analysis;
  try {
    analysis = JSON.parse(result.content);
  } catch (err) {
    throw new Error(`LLM did not return valid JSON: ${err.message}\n\n${result.content.slice(0, 400)}`);
  }

  // Surface the lexicon prior on the analysis payload for UI / debugging.
  analysis.lexiconPrior = lexiconPrior;

  // Generate the AI Automation Strategy Insight (separate call so it can be regenerated).
  const insightResult = await llm.complete({
    task: 'automation-insight',
    system: 'You are an AI/automation strategy consultant. Given an analysed initiative, produce a single short prescriptive paragraph identifying the next-best automation opportunity. Output JSON: { "insight": "..." }',
    user: JSON.stringify({ analysis, input }),
    input,
    refData,
    mockPayload: { analysis, input },
    temperature: 0.4,
    maxTokens: 400,
  });
  let insight = '';
  try {
    insight = JSON.parse(insightResult.content).insight || '';
  } catch {
    insight = insightResult.content;
  }

  const latencyMs = Date.now() - t0;
  return {
    analysis,
    insight,
    usage: combineUsage(result.usage, insightResult.usage),
    latencyMs,
  };
}

async function generateStory({ input, analysis, mode, userInputs }) {
  const result = await llm.complete({
    task: 'story',
    system: `You are an executive communications writer for the City of Ottawa. ` +
      `Write a compelling, outcome-focused success story for the supplied initiative. ` +
      `Tone: confident, citizen-focused, executive-ready. No marketing fluff. ` +
      `Apply content moderation — no PII, no inflammatory language. ` +
      `Output JSON: { "story": "...", "mode": "${mode}" }`,
    user: JSON.stringify({ task: 'story', input, analysis, mode, userInputs }),
    input,
    refData: loadRefData(),
    mockPayload: { input, analysis, mode, userInputs },
    temperature: 0.5,
    maxTokens: 800,
  });
  let parsed;
  try { parsed = JSON.parse(result.content); } catch { parsed = { story: result.content, mode }; }
  return { ...parsed, usage: result.usage };
}

function combineUsage(a, b) {
  return {
    prompt_tokens: (a.prompt_tokens || 0) + (b.prompt_tokens || 0),
    completion_tokens: (a.completion_tokens || 0) + (b.completion_tokens || 0),
    total_tokens: (a.total_tokens || 0) + (b.total_tokens || 0),
    estimated_cost_usd: (a.estimated_cost_usd || 0) + (b.estimated_cost_usd || 0),
    model: a.model,
    mode: a.mode,
  };
}

module.exports = { analyze, generateStory, loadRefData };
