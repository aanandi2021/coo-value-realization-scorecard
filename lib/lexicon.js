// Lexicon-based scorer using the City of Ottawa's keyword & phrase weights.
// Sourced from VRF_Scorecard_MVP/Keywords_Master.csv and Phrases_Master.csv,
// converted by scripts/build-data-from-vrf.js.
//
// The scorer computes a deterministic per-value-category score from raw user
// text. It is used in two places:
//   1. lib/analyze.js — supplied to the LLM as `prior_evidence` so the model
//      can blend lexicon signal with semantic reasoning.
//   2. lib/llm.js mock — used directly to drive the deterministic mock path
//      so the offline demo produces sensible category distributions.
//
// Exports:
//   scoreText(text)       → { scores, distribution, evidence, kpiHints, riskScore }
//   summarizeForPrompt(s) → compact JSON-friendly summary safe to embed in a prompt
//   loadLexicon()         → { keywords, phrases } (cached)

const fs = require('fs');
const path = require('path');

const CATEGORY_CODES = ['ISD', 'CC', 'DCS'];

let _lex = null;

function loadLexicon() {
  if (_lex) return _lex;
  const keywords = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'keywords.json'), 'utf-8')).keywords;
  const phrases = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'phrases.json'), 'utf-8')).phrases;

  // Sort phrases longest-first so multi-word phrases consume tokens before
  // their constituent keywords score them again.
  phrases.sort((a, b) => b.phrase.length - a.phrase.length);
  // Sort keywords longest-first as well so "service delivery" wins over "service".
  keywords.sort((a, b) => b.keyword.length - a.keyword.length);

  _lex = { keywords, phrases };
  return _lex;
}

// Map a free-text blob to per-category lexicon scores.
//
// Strategy:
//   1. Lowercase + collapse whitespace.
//   2. Walk phrases (longest-first); each match adds `weight` to the
//      phrase's primary category and is recorded as evidence. Matched
//      spans are blanked out so the same characters don't double-count.
//   3. Walk keywords (longest-first); each match adds weights to all
//      four scoring buckets (ISD, CC, DCS, RISK) per the keyword's weights.
//   4. Normalise category scores into a distribution that sums to 100.
function scoreText(text) {
  const { keywords, phrases } = loadLexicon();
  const haystack = normalize(text);
  let working = ' ' + haystack + ' ';      // pad so word-boundary checks are easy

  const scores = { ISD: 0, CC: 0, DCS: 0 };
  let RISK = 0;
  const evidence = [];
  const kpiHints = new Map();

  // ---- Phrases first -------------------------------------------------
  for (const p of phrases) {
    if (!p.phrase || p.phrase.length < 3) continue;
    const needle = ' ' + p.phrase + ' ';
    let idx = working.indexOf(needle);
    if (idx === -1) continue;
    while (idx !== -1) {
      const cat = (p.primaryCategory || '').toUpperCase();
      if (CATEGORY_CODES.includes(cat)) scores[cat] += p.weight;
      else if (cat === 'RISK') RISK += p.weight;
      if (p.kpiLink && p.kpiLink !== 'n/a') {
        kpiHints.set(p.kpiLink, (kpiHints.get(p.kpiLink) || 0) + p.weight);
      }
      evidence.push({ type: 'phrase', term: p.phrase, category: cat, weight: p.weight, kpiLink: p.kpiLink || null });
      // Blank the matched span to avoid double-counting from keyword pass.
      working = working.slice(0, idx + 1) + ' '.repeat(p.phrase.length) + working.slice(idx + 1 + p.phrase.length);
      idx = working.indexOf(needle, idx + p.phrase.length);
    }
  }

  // ---- Keywords ------------------------------------------------------
  for (const k of keywords) {
    if (!k.keyword || k.keyword.length < 3) continue;
    const needle = ' ' + k.keyword + ' ';
    let idx = working.indexOf(needle);
    if (idx === -1) continue;
    while (idx !== -1) {
      scores.ISD += k.weights.ISD || 0;
      scores.CC += k.weights.CC || 0;
      scores.DCS += k.weights.DCS || 0;
      RISK += k.weights.RISK || 0;
      evidence.push({
        type: 'keyword',
        term: k.keyword,
        weights: k.weights,
      });
      working = working.slice(0, idx + 1) + ' '.repeat(k.keyword.length) + working.slice(idx + 1 + k.keyword.length);
      idx = working.indexOf(needle, idx + k.keyword.length);
    }
  }

  const total = scores.ISD + scores.CC + scores.DCS;
  const distribution = total > 0
    ? {
        ISD: Math.round((scores.ISD / total) * 100),
        CC: Math.round((scores.CC / total) * 100),
        DCS: Math.round((scores.DCS / total) * 100),
      }
    : { ISD: 0, CC: 0, DCS: 0 };

  // Force distribution to sum to exactly 100 by adjusting the largest bucket.
  fixupDistribution(distribution);

  // Cap evidence to the top contributors so we don't blow up the prompt.
  evidence.sort((a, b) => (b.weight || sumWeights(b.weights)) - (a.weight || sumWeights(a.weights)));
  const topEvidence = evidence.slice(0, 25);

  const topKpis = [...kpiHints.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([kpiLink, weight]) => ({ kpiLink, weight }));

  return {
    scores,
    distribution,
    riskScore: RISK,
    evidence: topEvidence,
    evidenceCount: evidence.length,
    kpiHints: topKpis,
  };
}

function sumWeights(w) {
  if (!w) return 0;
  return (w.ISD || 0) + (w.CC || 0) + (w.DCS || 0) + (w.RISK || 0);
}

function fixupDistribution(d) {
  const sum = d.ISD + d.CC + d.DCS;
  const drift = 100 - sum;
  if (drift === 0 || sum === 0) return;
  const top = ['ISD', 'CC', 'DCS'].reduce((a, b) => d[a] >= d[b] ? a : b);
  d[top] += drift;
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Compact summary for inclusion in an LLM prompt. We deliberately keep
// `evidence` short so prompt tokens stay bounded.
function summarizeForPrompt(scored) {
  return {
    distribution_pct: scored.distribution,
    raw_scores: scored.scores,
    risk_score: scored.riskScore,
    top_evidence: scored.evidence.slice(0, 12).map(e => e.type === 'phrase'
      ? { phrase: e.term, category: e.category, weight: e.weight, kpiLink: e.kpiLink }
      : { keyword: e.term, weights: e.weights }
    ),
    suggested_kpis: scored.kpiHints.slice(0, 5),
    evidence_count: scored.evidenceCount,
  };
}

module.exports = { scoreText, summarizeForPrompt, loadLexicon, CATEGORY_CODES };
