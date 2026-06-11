// LLM service — calls GitHub Models when GITHUB_TOKEN is set, otherwise falls
// back to a deterministic mock so the demo runs without any credentials.
//
// All callers go through `complete()` and receive `{ content, usage }`.
// `usage` is `{ prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd, model }`.

const fs = require('fs');
const path = require('path');
const lexicon = require('./lexicon');

const MODEL = 'openai/gpt-4o';
// Rough GPT-4o pricing for cost-transparency estimates.
const COST_PER_PROMPT_1K = 0.0025;
const COST_PER_COMPLETION_1K = 0.01;

function tokenAvailable() {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim());
}

function approxTokens(text) {
  if (!text) return 0;
  return Math.ceil(String(text).length / 4);
}

function estimateCost(prompt, completion) {
  return (prompt / 1000) * COST_PER_PROMPT_1K + (completion / 1000) * COST_PER_COMPLETION_1K;
}

async function callGithubModels({ system, user, temperature = 0.2, maxTokens = 2000 }) {
  const resp = await fetch('https://models.github.ai/inference/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  });
  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`GitHub Models call failed (${resp.status}): ${detail.slice(0, 400)}`);
  }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || '';
  const usage = data.usage || {
    prompt_tokens: approxTokens(system + user),
    completion_tokens: approxTokens(content),
    total_tokens: approxTokens(system + user + content),
  };
  return {
    content,
    usage: {
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
      estimated_cost_usd: estimateCost(usage.prompt_tokens, usage.completion_tokens),
      model: MODEL,
      mode: 'live',
    },
  };
}

// ---- Mock LLM ----------------------------------------------------------
//
// The mock returns realistic, deterministic JSON shaped to match what the
// pipeline expects. It uses keyword-style heuristics over the inputs and the
// definitions of the supplied reference data — but its OUTPUT shape is the
// same as the real LLM, so the rest of the pipeline does not change.

function loadJson(file) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', file), 'utf-8'));
}

function mockResponseForTask({ task, input, refData }) {
  switch (task) {
    case 'analyze':
      return JSON.stringify(mockAnalyze(input, refData));
    case 'story':
      return JSON.stringify(mockStory(input));
    case 'reasoning-audit':
      return JSON.stringify(mockReasoningAudit(input, refData));
    case 'automation-insight':
      return JSON.stringify(mockAutomationInsight(input));
    default:
      return JSON.stringify({ error: `unknown task: ${task}` });
  }
}

function scoreText(text, indicators) {
  const t = String(text || '').toLowerCase();
  let hits = 0;
  for (const ind of indicators) {
    if (t.includes(ind.toLowerCase())) hits++;
  }
  return hits;
}

function topWeightCode(weights) {
  if (!weights) return null;
  const order = ['ISD', 'CC', 'DCS'];
  return order.reduce((a, b) => (weights[b] || 0) > (weights[a] || 0) ? b : a);
}

function mockAnalyze(input, refData) {
  const blob = `${input.title || ''} ${input.description || ''} ${input.outcome || ''} ${input.openText || ''}`;
  const lower = blob.toLowerCase();

  // Lexicon-driven scoring (City of Ottawa keyword + phrase weights).
  const scored = lexicon.scoreText(blob);
  const codeToId = Object.fromEntries(refData.categories.map(c => [c.code, c.id]));

  // Map lexicon's per-code distribution onto the actual category records.
  let pct = refData.categories.map(c => ({
    id: c.id,
    name: c.name,
    color: c.color,
    score: scored.distribution[c.code] || 0,
  }));

  // If the lexicon found nothing (very thin input), spread evenly.
  if (pct.every(p => p.score === 0) && pct.length > 0) {
    const each = Math.floor(100 / pct.length);
    pct.forEach(p => (p.score = each));
    pct[0].score += 100 - each * pct.length;
  }

  // Ensure the distribution sums to exactly 100 (rounding fixup).
  const drift = 100 - pct.reduce((s, x) => s + x.score, 0);
  if (pct.length > 0) pct[0].score += drift;
  pct.sort((a, b) => b.score - a.score);

  const primary = pct[0];
  const secondary = pct[1] && pct[1].score > 0 ? pct[1] : null;

  // KPIs: prefer lexicon-suggested KPI links (matched by KPI id), then
  // backfill with KPIs tagged to the primary first, then secondary.
  const lexicalKpiIds = new Set(scored.kpiHints.map(h => h.kpiLink));
  const primaryKpis = refData.kpis.filter(k => k.categories.includes(primary.id));
  const secondaryKpis = secondary
    ? refData.kpis.filter(k => k.categories.includes(secondary.id) && !k.categories.includes(primary.id))
    : [];
  const lexicalKpis = refData.kpis.filter(k => lexicalKpiIds.has(k.id));
  const seen = new Set();
  const orderedKpis = [...lexicalKpis, ...primaryKpis, ...secondaryKpis].filter(k => {
    if (seen.has(k.id)) return false;
    seen.add(k.id);
    return true;
  });

  const kpis = orderedKpis.slice(0, 3).map((k, i) => ({
    id: k.id,
    name: k.name,
    type: k.type,
    alignment: k.categories.map(cid => refData.categories.find(c => c.id === cid)?.name).filter(Boolean).join(' / '),
    rationale: lexicalKpiIds.has(k.id)
      ? `Lexicon-matched: phrases in the input directly map to this KPI in the City's phrase lexicon.`
      : (i === 0
        ? 'Selected based on the dominant value category for this initiative.'
        : 'Provides balancing context to the primary KPI.'),
    recommendation: i === 0 ? 'PRIMARY' : 'SECONDARY',
    dataSource: k.dataSource,
    calculation: k.calculation,
    definition: k.definition,
    useWhen: k.useWhen,
    avoidWhen: k.avoidWhen,
  }));

  // Risks: score each risk's indicators against the blob, plus apply a
  // contribution from the lexicon's RISK channel.
  const riskScored = refData.risks.map(r => ({
    risk: r,
    hits: scoreText(blob, r.indicators || []),
  })).filter(x => x.hits > 0).sort((a, b) => b.hits - a.hits);

  // If nothing matched but the lexicon registered risk signal, surface the
  // first risk in the taxonomy so downstream pieces have something to render.
  if (riskScored.length === 0 && scored.riskScore > 0 && refData.risks.length > 0) {
    riskScored.push({ risk: refData.risks[0], hits: 1 });
  }

  const risks = riskScored.slice(0, 3).map(({ risk }) => {
    const tol = refData.tolerance.find(t => t.intentArea === risk.intentArea);
    return {
      id: risk.id,
      name: risk.name,
      intentArea: risk.intentArea,
      rationale: `The initiative involves ${(risk.indicators || []).slice(0, 3).join(', ') || 'factors relevant to this risk category'} — patterns associated with this risk.`,
      cityTolerance: tol ? tol.cityTolerance : 'Medium',
      toleranceVerdict: 'Aligned with Tolerance',
      consultantInsight: tol ? tol.guidance : 'Apply standard controls.',
    };
  });

  // Strategic priorities — pick best match by keyword overlap with name + definition.
  const priorityScored = refData.priorities.map(p => {
    const hits = scoreText(blob, p.name.toLowerCase().split(/\s+/).concat(p.definition.toLowerCase().split(/\s+/).filter(w => w.length > 5)));
    return { p, hits };
  }).sort((a, b) => b.hits - a.hits);
  const alignment = {
    primary: priorityScored[0].p,
    secondary: priorityScored[1] ? priorityScored[1].p : null,
    rationale: `The initiative's outcomes align with "${priorityScored[0].p.name}" through emphasis on ${primary.name.toLowerCase()}.`,
  };

  // Reasoning audit — explanation for EVERY category, anchored to the lexicon evidence.
  const evidenceByCode = scored.evidence.reduce((acc, e) => {
    const code = e.category || (e.weights ? topWeightCode(e.weights) : null);
    if (!code) return acc;
    (acc[code] = acc[code] || []).push(e.term);
    return acc;
  }, {});
  const audit = refData.categories.map(c => {
    const isPrimary = c.id === primary.id;
    const isSecondary = secondary && c.id === secondary.id;
    const terms = (evidenceByCode[c.code] || []).slice(0, 3);
    let rationale;
    if (isPrimary) {
      rationale = terms.length
        ? `Primary fit: lexicon evidence dominated by ${terms.join(', ')}.`
        : `Primary fit based on overall semantic match to the category definition.`;
    } else if (isSecondary) {
      rationale = terms.length
        ? `Supporting fit: lexicon shows ${terms.join(', ')} but not dominant.`
        : `Secondary fit derived from partial alignment.`;
    } else {
      rationale = terms.length
        ? `Minor signal (${terms.join(', ')}) but not material for this initiative.`
        : `Not a primary driver for this initiative based on lexicon evidence.`;
    }
    return { id: c.id, name: c.name, color: c.color, role: isPrimary ? 'PRIMARY' : (isSecondary ? 'SECONDARY' : null), rationale };
  });

  // Story suggested fields (the "auto" content for each section of the story builder).
  const storySuggested = {
    challenge: extractChallenge(input.description),
    initiative: input.title,
    outcome: kpis.map(k => k.name).join(', '),
    value: `AI mapped this to ${primary.name} because: ${audit.find(a => a.id === primary.id).rationale}`,
  };

  // Theory of Change — 7-column logic model derived from the inputs + analysis.
  const theoryOfChange = buildTheoryOfChange({ input, primary, secondary, kpis, risks, alignment });

  // Project reference — OTT-{DEPT}-{YEAR}-{SEQ-PLACEHOLDER}.
  const deptCode = (input.department || 'GEN').toUpperCase();
  const year = new Date().getFullYear();
  const seq = (input.title || 'F00').replace(/[^A-Z0-9]/gi, '').slice(0, 3).toUpperCase().padEnd(3, '0');
  const projectReference = `OTT-${deptCode}-${year}-${seq}`;

  // Scores for the summary snapshot.
  const impactScore = Math.min(100, 50 + Math.round((primary.score / 100) * 40) + (priorityScored[0].hits > 0 ? 10 : 0));
  const aiLeverageScore = Math.min(100, 20 + scoreText(blob, ['ai', 'automation', 'workflow', 'mobile', 'digital', 'analytics']) * 5);
  const futureImpactScore = Math.min(100, impactScore + Math.round((100 - aiLeverageScore) * 0.4));

  return {
    categories: pct,
    primary,
    secondary,
    kpis,
    risks,
    alignment,
    audit,
    storySuggested,
    theoryOfChange,
    projectReference,
    validationStatus: 'PENDING',
    scores: {
      impact: impactScore,
      aiLeverage: aiLeverageScore,
      futureImpact: futureImpactScore,
      valueScore: impactScore + (secondary ? Math.round(secondary.score / 5) : 0),
    },
  };
}

function buildTheoryOfChange({ input, primary, secondary, kpis, risks, alignment }) {
  const blob = `${input.title} ${input.description} ${input.outcome} ${input.openText || ''}`.toLowerCase();
  // Extract heuristic phrases.
  const tech = pickPhrase(blob, ['sap', 'mobile', 'iot', 'sensor', 'platform', 'workflow', 'ai', 'automation', 'analytics']);
  const inv = pickPhrase(blob, ['training', 'staff', 'change', 'process', 'integration', 'system']);
  const out = pickPhrase(blob, ['report', 'dashboard', 'data', 'single source of truth', 'analytics']);
  return {
    context: [
      `Current state shows inefficiency around ${primary.name.toLowerCase()} that this initiative targets.`,
      ...(input.description?.match(/CURRENT STATE[^:]*:\s*([\s\S]+?)(?:\.|$)/i) ? [input.description.match(/CURRENT STATE[^:]*:\s*([\s\S]+?)(?:\.|$)/i)[1].trim() + '.'] : []),
      `Existing workflow creates friction for ${input.department ? 'the ' + input.department + ' department' : 'the responsible department'}.`,
    ].slice(0, 4),
    inputs: [
      tech ? `${capitalize(tech)} technology investment for ${input.title.toLowerCase()}.` : `Technology platform investment to enable the new workflow.`,
      `Dedicated municipal project management and IT support staff.`,
      inv ? `${capitalize(inv)}-focused enablement program for end-users.` : `Change management and training program for affected teams.`,
    ],
    activities: [
      `Implementing ${input.title.toLowerCase()} across the targeted scope.`,
      tech ? `Configuring ${tech}-driven workflow triggers and validation rules.` : `Configuring the new workflow with automated triggers.`,
      `Integrating with existing enterprise systems and data sources.`,
      `Conducting training and rollout sessions with field/operational teams.`,
    ],
    outputs: [
      out ? `Centralized ${out} delivering real-time visibility.` : `Centralized operational dashboard delivering real-time visibility.`,
      `Automated work-orders and notifications triggered by the new process.`,
      `Standardized reporting cadence (weekly/monthly) for senior management.`,
    ],
    outcomes: [
      `Significant shift from reactive to proactive ${primary.name.toLowerCase()}.`,
      kpis[0] ? `Measurable improvement against ${kpis[0].name}.` : `Measurable improvement across the recommended KPIs.`,
      secondary ? `Supporting gains in ${secondary.name.toLowerCase()}.` : `Improved staff productivity and effort scores.`,
    ],
    impact: [
      `Enhanced service reliability and trust for Ottawa residents.`,
      `Lowered total cost of ownership for municipal operations in this area.`,
      `Standardization of data-driven operational culture across departments.`,
      alignment?.primary ? `Direct contribution to strategic priority: ${alignment.primary.name}.` : null,
    ].filter(Boolean),
    learning: [
      `Identification of specific patterns and edge cases that warrant follow-up investment.`,
      `Optimization of intervals and thresholds based on actual usage data.`,
      `Correlation between operational patterns and downstream outcomes for future modelling.`,
    ],
  };
}

function pickPhrase(text, terms) {
  for (const t of terms) {
    if (text.includes(t)) return t;
  }
  return null;
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function extractChallenge(description) {
  const s = String(description || '');
  // Pull the part after "CURRENT STATE" markers if present.
  const m = s.match(/(?:current state[^:]*:)\s*([\s\S]+?)(?:\.|$)/i);
  if (m) return m[1].trim() + '.';
  // Otherwise: first ~250 chars.
  return s.slice(0, 250) + (s.length > 250 ? '…' : '');
}

function mockStory({ input, analysis, mode, userInputs }) {
  const primary = analysis.primary;
  const kpis = analysis.kpis.map(k => k.name);

  let challenge, initiative, outcome, value;
  if (mode === 'user') {
    challenge = userInputs.challenge || analysis.storySuggested.challenge;
    initiative = userInputs.initiative || analysis.storySuggested.initiative;
    outcome = userInputs.outcome || analysis.storySuggested.outcome;
    value = userInputs.value || analysis.storySuggested.value;
  } else if (mode === 'auto') {
    challenge = analysis.storySuggested.challenge;
    initiative = analysis.storySuggested.initiative;
    outcome = analysis.storySuggested.outcome;
    value = analysis.storySuggested.value;
  } else {
    challenge = combineText(userInputs.challenge, analysis.storySuggested.challenge);
    initiative = combineText(userInputs.initiative, analysis.storySuggested.initiative);
    outcome = combineText(userInputs.outcome, analysis.storySuggested.outcome);
    value = combineText(userInputs.value, analysis.storySuggested.value);
  }

  const narrative = `**${input.title}**\n\n` +
    `The City of Ottawa identified a clear opportunity: ${challenge} ` +
    `In response, the team launched **${initiative}**, modernizing how this work is delivered. ` +
    `Measurable outcomes include ${outcome || kpis.join(', ') || 'meaningful gains across the targeted workflow'}. ` +
    `This initiative directly advances ${primary.name.toLowerCase()} — ${value || 'creating value for the City and its residents.'}`;

  return { story: narrative.replace(/\s+/g, ' ').trim(), mode };
}

function combineText(user, suggested) {
  if (user && suggested) return `${user} ${suggested.startsWith(user) ? '' : suggested}`.trim();
  return user || suggested || '';
}

function mockReasoningAudit() {
  return { ok: true };
}

function mockAutomationInsight({ analysis }) {
  const aiLow = analysis.scores.aiLeverage < 50;
  const insight = aiLow
    ? `Significant opportunity exists to introduce Robotic Process Automation (RPA) or Large Language Models (LLMs) to streamline data ingestion and reduce manual touchpoints. Enhancing automation would accelerate service delivery SLAs and drive further direct cost savings.`
    : `This initiative already demonstrates strong AI/automation leverage. Focus next on operationalizing model monitoring, equity audits, and a feedback loop with end-users to sustain and compound the value.`;
  return { insight };
}

// ---- Public API --------------------------------------------------------

async function complete({ task, system, user, input, refData, temperature = 0.2, maxTokens = 2000, mockPayload }) {
  if (tokenAvailable()) {
    try {
      const result = await callGithubModels({ system, user, temperature, maxTokens });
      return result;
    } catch (err) {
      console.warn(`[llm] live call failed, falling back to mock: ${err.message}`);
    }
  }
  // Mock path.
  const content = mockResponseForTask({ task, input: mockPayload || input, refData });
  const promptT = approxTokens(system + user);
  const completionT = approxTokens(content);
  return {
    content,
    usage: {
      prompt_tokens: promptT,
      completion_tokens: completionT,
      total_tokens: promptT + completionT,
      estimated_cost_usd: estimateCost(promptT, completionT),
      model: 'mock-deterministic',
      mode: 'mock',
    },
  };
}

module.exports = { complete, tokenAvailable, MODEL };
