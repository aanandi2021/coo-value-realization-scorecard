// Build the "Use Case #2 — Value Realization Scorecard" client walkthrough deck.
// Tells the story: original AI Use Case Discovery workshop (May 7, 2026) → PEAK (UC1)
// → pivot to UC2 (VRF Scorecard) → City's own rules merged → live demo on :5260.
//
// Run from repo root: `node coo-value-realization-scorecard/docs/build-uc2-deck.js`
// Output: coo-value-realization-scorecard/docs/UC2-Value-Realization-Scorecard-Walkthrough.pptx

const path = require('path');
const PptxGenJS = require('pptxgenjs');

const OUT = path.join(__dirname, 'UC2-Value-Realization-Scorecard-Walkthrough.pptx');

// ---- Ocean Gradient palette (civic, calm, trustworthy) -----------------------
const C = {
  navy:    '21295C', // primary dark
  deep:    '065A82', // primary
  teal:    '1C7293', // secondary
  ice:     'CADCFC', // soft accent
  cream:   'F5F7FA', // content background
  white:   'FFFFFF',
  ink:     '0F172A', // body text on light
  muted:   '64748B', // captions
  amber:   'E8A33D', // accent for callouts (warm contrast)
  green:   '2C9A6E', // success/positive
};

const FONT_H = 'Calibri';        // headers
const FONT_B = 'Calibri Light';  // body

const pres = new PptxGenJS();
pres.layout = 'LAYOUT_WIDE'; // 13.3" x 7.5"
pres.author  = 'Amit Nandi (Microsoft ATS)';
pres.company = 'Microsoft';
pres.title   = 'Use Case #2 — Value Realization Scorecard';
pres.subject = 'City of Ottawa client walkthrough';

// =============================================================================
// Helpers
// =============================================================================
const SW = 13.3, SH = 7.5;

function footer(slide, page, total) {
  // bottom band
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: SH - 0.32, w: SW, h: 0.32, fill: { color: C.navy }, line: { type: 'none' },
  });
  slide.addText('City of Ottawa  ·  Value Realization Scorecard  ·  Use Case #2 Walkthrough', {
    x: 0.4, y: SH - 0.30, w: 9, h: 0.28,
    fontFace: FONT_B, fontSize: 9, color: C.ice, valign: 'middle', margin: 0,
  });
  slide.addText(`${page} / ${total}`, {
    x: SW - 1.0, y: SH - 0.30, w: 0.8, h: 0.28,
    fontFace: FONT_B, fontSize: 9, color: C.ice, align: 'right', valign: 'middle', margin: 0,
  });
}

function eyebrow(slide, txt) {
  slide.addText(txt.toUpperCase(), {
    x: 0.5, y: 0.45, w: 12, h: 0.3,
    fontFace: FONT_B, fontSize: 11, color: C.teal, bold: true, charSpacing: 3, margin: 0,
  });
}

function title(slide, txt, y = 0.8) {
  slide.addText(txt, {
    x: 0.5, y, w: 12.3, h: 0.85,
    fontFace: FONT_H, fontSize: 32, bold: true, color: C.navy, margin: 0,
  });
}

function sectionHeader(slide, txt) {
  slide.addText(txt, {
    x: 0.5, y: 1.7, w: 12.3, h: 0.45,
    fontFace: FONT_H, fontSize: 16, color: C.teal, bold: true, margin: 0,
  });
}

function card(slide, x, y, w, h, opts = {}) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: opts.fill || C.white },
    line: { color: opts.border || 'E2E8F0', width: 0.75 },
    shadow: { type: 'outer', color: '000000', blur: 8, offset: 1, angle: 90, opacity: 0.06 },
  });
  if (opts.accent) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.08, h,
      fill: { color: opts.accent }, line: { type: 'none' },
    });
  }
}

function pageBg(slide) {
  slide.background = { color: C.cream };
}

// =============================================================================
// SLIDE 1 — Cover
// =============================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  // big accent block (top-right)
  s.addShape(pres.shapes.RECTANGLE, {
    x: SW - 3.6, y: 0, w: 3.6, h: SH, fill: { color: C.deep }, line: { type: 'none' },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: SW - 0.5, y: 0, w: 0.5, h: SH, fill: { color: C.amber }, line: { type: 'none' },
  });

  s.addText('USE CASE #2', {
    x: 0.7, y: 1.6, w: 8, h: 0.5,
    fontFace: FONT_B, fontSize: 14, bold: true, color: C.amber, charSpacing: 6, margin: 0,
  });
  s.addText('Value Realization\nScorecard', {
    x: 0.7, y: 2.1, w: 9, h: 2.5,
    fontFace: FONT_H, fontSize: 60, bold: true, color: C.white, lineSpacingMultiple: 1.0, margin: 0,
  });
  s.addText('A walkthrough of the pivot from public engagement analysis (PEAK) to a hybrid LLM + City-of-Ottawa-rules scoring engine for project value.', {
    x: 0.7, y: 4.75, w: 8.5, h: 1.4,
    fontFace: FONT_B, fontSize: 16, color: C.ice, italic: true, margin: 0,
  });

  // Meta block
  s.addText([
    { text: 'Presented by\n', options: { fontSize: 10, color: C.ice, bold: true, charSpacing: 3, breakLine: true } },
    { text: 'Amit Nandi  ·  Microsoft ATS\n', options: { fontSize: 14, color: C.white, breakLine: true } },
    { text: '\n', options: { fontSize: 6, breakLine: true } },
    { text: 'For\n', options: { fontSize: 10, color: C.ice, bold: true, charSpacing: 3, breakLine: true } },
    { text: 'City of Ottawa — CIO Office, Analytics & Strategy', options: { fontSize: 14, color: C.white } },
  ], {
    x: 0.7, y: 6.0, w: 8, h: 1.2, fontFace: FONT_B, margin: 0,
  });

  // Date strip on right column
  s.addText('DEMO', {
    x: SW - 3.4, y: 2.4, w: 3.0, h: 0.4,
    fontFace: FONT_B, fontSize: 12, bold: true, color: C.amber, charSpacing: 6, margin: 0,
  });
  s.addText('Live on\nhttp://localhost:5260', {
    x: SW - 3.4, y: 2.8, w: 3.0, h: 1.5,
    fontFace: FONT_H, fontSize: 22, bold: true, color: C.white, margin: 0, lineSpacingMultiple: 1.1,
  });
  s.addText('Today, on this machine', {
    x: SW - 3.4, y: 4.3, w: 3.0, h: 0.4,
    fontFace: FONT_B, fontSize: 11, color: C.ice, italic: true, margin: 0,
  });

  s.addShape(pres.shapes.LINE, {
    x: SW - 3.4, y: 5.0, w: 2.8, h: 0,
    line: { color: C.amber, width: 1.5 },
  });

  s.addText('What you will see:', {
    x: SW - 3.4, y: 5.15, w: 3.0, h: 0.3,
    fontFace: FONT_B, fontSize: 11, color: C.ice, bold: true, margin: 0,
  });
  s.addText([
    { text: 'How we got here', options: { bullet: true, breakLine: true } },
    { text: 'The pivot to UC2', options: { bullet: true, breakLine: true } },
    { text: "The City's own rules, merged", options: { bullet: true, breakLine: true } },
    { text: 'A working demo', options: { bullet: true } },
  ], {
    x: SW - 3.4, y: 5.45, w: 3.0, h: 1.5,
    fontFace: FONT_B, fontSize: 12, color: C.white, margin: 0, paraSpaceAfter: 4,
  });
}

// =============================================================================
// SLIDE 2 — Agenda
// =============================================================================
{
  const s = pres.addSlide(); pageBg(s);
  eyebrow(s, 'Agenda');
  title(s, '15 minutes, four beats.');

  const beats = [
    { n: '1', t: 'Where we started',         d: 'AI Use Case Discovery — May 7, 2026.  PEAK as UC #1.' },
    { n: '2', t: 'The pivot',                d: 'Why VRF Scorecard surfaced as UC #2, and what stayed the same.' },
    { n: '3', t: "Adopting the City's rules", d: "We pulled the City's own VRF_Scorecard_MVP repo and merged it into a working app." },
    { n: '4', t: 'Live demo + what is next', d: 'See the hybrid scorer in action.  Discuss roadmap.' },
  ];

  const y0 = 2.1, rowH = 1.05;
  beats.forEach((b, i) => {
    const y = y0 + i * rowH;
    // big numeral
    s.addShape(pres.shapes.OVAL, {
      x: 0.6, y, w: 0.85, h: 0.85,
      fill: { color: C.teal }, line: { type: 'none' },
    });
    s.addText(b.n, {
      x: 0.6, y, w: 0.85, h: 0.85,
      fontFace: FONT_H, fontSize: 28, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0,
    });
    // text block
    s.addText(b.t, {
      x: 1.7, y: y + 0.05, w: 10, h: 0.45,
      fontFace: FONT_H, fontSize: 18, bold: true, color: C.navy, margin: 0,
    });
    s.addText(b.d, {
      x: 1.7, y: y + 0.50, w: 10.5, h: 0.45,
      fontFace: FONT_B, fontSize: 13, color: C.muted, margin: 0,
    });
  });

  // sidebar callout
  s.addShape(pres.shapes.RECTANGLE, {
    x: 11.6, y: 2.1, w: 1.2, h: 2.7,
    fill: { color: C.navy }, line: { type: 'none' },
  });
  s.addText('UC #2', {
    x: 11.6, y: 2.3, w: 1.2, h: 0.4,
    fontFace: FONT_B, fontSize: 12, bold: true, color: C.amber, align: 'center', charSpacing: 4, margin: 0,
  });
  s.addText('VRF\nScorecard', {
    x: 11.6, y: 2.75, w: 1.2, h: 1.0,
    fontFace: FONT_H, fontSize: 15, bold: true, color: C.white, align: 'center', margin: 0, lineSpacingMultiple: 1.1,
  });
  s.addText("today's\nfocus", {
    x: 11.6, y: 3.85, w: 1.2, h: 0.8,
    fontFace: FONT_B, fontSize: 11, italic: true, color: C.ice, align: 'center', margin: 0,
  });

  footer(s, 2, 12);
}

// =============================================================================
// SLIDE 3 — Where we started: original AI Use Case Discovery workshop
// =============================================================================
{
  const s = pres.addSlide(); pageBg(s);
  eyebrow(s, 'Where we started');
  title(s, 'AI Use Case Discovery — May 7, 2026.');

  // Left: workshop card
  card(s, 0.5, 1.85, 6.0, 4.05, { accent: C.teal });
  s.addText('Discovery session', {
    x: 0.8, y: 2.0, w: 5.5, h: 0.35,
    fontFace: FONT_B, fontSize: 11, color: C.teal, bold: true, charSpacing: 3, margin: 0,
  });
  s.addText('What we co-discovered with the COO analytics team', {
    x: 0.8, y: 2.35, w: 5.5, h: 0.5,
    fontFace: FONT_H, fontSize: 18, bold: true, color: C.navy, margin: 0,
  });
  s.addShape(pres.shapes.LINE, {
    x: 0.8, y: 2.95, w: 1.2, h: 0,
    line: { color: C.teal, width: 1.5 },
  });
  s.addText([
    { text: '2h 6m working session with the COO analytics team', options: { bullet: true, breakLine: true } },
    { text: '82 engagement interactions, 80,000+ open-text inputs in scope', options: { bullet: true, breakLine: true } },
    { text: '5 languages: English, French, Somali, Punjabi, Arabic', options: { bullet: true, breakLine: true } },
    { text: 'Mind-map + transcript captured live, requirements doc produced', options: { bullet: true, breakLine: true } },
    { text: 'Surfaced several candidate AI use cases — top one prioritized first', options: { bullet: true } },
  ], {
    x: 0.85, y: 3.1, w: 5.4, h: 2.7,
    fontFace: FONT_B, fontSize: 13, color: C.ink, margin: 0, paraSpaceAfter: 6,
  });

  // Right: UC #1 card
  card(s, 6.8, 1.85, 6.0, 4.05, { fill: C.navy, border: C.navy });
  s.addText('USE CASE #1', {
    x: 7.05, y: 2.0, w: 5.5, h: 0.35,
    fontFace: FONT_B, fontSize: 11, color: C.amber, bold: true, charSpacing: 4, margin: 0,
  });
  s.addText('PEAK', {
    x: 7.05, y: 2.32, w: 5.5, h: 0.6,
    fontFace: FONT_H, fontSize: 30, bold: true, color: C.white, margin: 0,
  });
  s.addText('Public Engagement Analysis Kit', {
    x: 7.05, y: 2.92, w: 5.5, h: 0.35,
    fontFace: FONT_B, fontSize: 13, italic: true, color: C.ice, margin: 0,
  });
  s.addShape(pres.shapes.LINE, {
    x: 7.05, y: 3.35, w: 1.2, h: 0,
    line: { color: C.amber, width: 1.5 },
  });
  s.addText([
    { text: 'Ingest', options: { bold: true, color: C.amber } },
    { text: '  multi-format survey + townhall data (CSV, OCR, transcript, voice).', options: { breakLine: true } },
    { text: 'Analyze', options: { bold: true, color: C.amber } },
    { text: '  themes, sentiment, risks, what-if scenarios — with human override.', options: { breakLine: true } },
    { text: 'Visualize', options: { bold: true, color: C.amber } },
    { text: '  Power BI-friendly, accessible, copy-paste-ready charts.', options: { breakLine: true } },
    { text: 'Report', options: { bold: true, color: C.amber } },
    { text: '  auto-generate "what we heard" back to residents.', options: {} },
  ], {
    x: 7.05, y: 3.5, w: 5.5, h: 2.35,
    fontFace: FONT_B, fontSize: 12, color: C.white, margin: 0, paraSpaceAfter: 4,
  });

  // bottom strip
  s.addText('Output of that workshop: a 22-requirement spec (P-01…X-04), a 4-stage architecture, a working PEAK prototype.', {
    x: 0.5, y: 6.7, w: 12.3, h: 0.4,
    fontFace: FONT_B, fontSize: 11, italic: true, color: C.muted, align: 'center', margin: 0,
  });

  footer(s, 3, 12);
}

// =============================================================================
// SLIDE 4 — The pivot
// =============================================================================
{
  const s = pres.addSlide(); pageBg(s);
  eyebrow(s, 'The pivot');
  title(s, 'Same engine room. New cargo.');

  // Two-row comparison
  // Row 1 — UC1 (faded)
  card(s, 0.5, 1.9, 12.3, 1.85, { accent: C.muted });
  s.addText('UC #1 — PEAK', {
    x: 0.75, y: 2.05, w: 3, h: 0.4,
    fontFace: FONT_B, fontSize: 11, color: C.muted, bold: true, charSpacing: 3, margin: 0,
  });
  s.addText('Public Engagement Analysis Kit', {
    x: 0.75, y: 2.4, w: 6, h: 0.5,
    fontFace: FONT_H, fontSize: 19, bold: true, color: C.navy, margin: 0,
  });
  s.addText('Input: 80K+ resident comments  →  LLM clusters + sentiment + risks  →  "what we heard" report.', {
    x: 0.75, y: 2.95, w: 9, h: 0.4,
    fontFace: FONT_B, fontSize: 13, color: C.ink, margin: 0,
  });
  s.addText('Audience: residents.', {
    x: 0.75, y: 3.35, w: 8, h: 0.3,
    fontFace: FONT_B, fontSize: 11, italic: true, color: C.muted, margin: 0,
  });
  // status pill
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 10.5, y: 2.5, w: 2.0, h: 0.5,
    fill: { color: C.green }, line: { type: 'none' }, rectRadius: 0.25,
  });
  s.addText('PROTOTYPED', {
    x: 10.5, y: 2.5, w: 2.0, h: 0.5,
    fontFace: FONT_B, fontSize: 11, bold: true, color: C.white, align: 'center', valign: 'middle', charSpacing: 3, margin: 0,
  });

  // Arrow between (DOWN_ARROW shape, points down)
  s.addShape(pres.shapes.DOWN_ARROW, {
    x: 6.25, y: 3.85, w: 0.8, h: 0.55,
    fill: { color: C.amber }, line: { type: 'none' },
  });

  // Row 2 — UC2 (highlighted)
  card(s, 0.5, 4.35, 12.3, 2.2, { fill: C.navy, border: C.navy, accent: C.amber });
  s.addText('UC #2 — VRF SCORECARD', {
    x: 0.75, y: 4.5, w: 6, h: 0.4,
    fontFace: FONT_B, fontSize: 11, color: C.amber, bold: true, charSpacing: 3, margin: 0,
  });
  s.addText('Value Realization Scorecard', {
    x: 0.75, y: 4.85, w: 8, h: 0.55,
    fontFace: FONT_H, fontSize: 22, bold: true, color: C.white, margin: 0,
  });
  s.addText('Input: a project brief (title, description, outcome)  →  hybrid scorer  →  value category + KPIs + alignment + draft success story.', {
    x: 0.75, y: 5.42, w: 12, h: 0.45,
    fontFace: FONT_B, fontSize: 13, color: C.ice, margin: 0,
  });
  s.addText('Audience: project teams, CIO Office, portfolio review.', {
    x: 0.75, y: 5.92, w: 8, h: 0.35,
    fontFace: FONT_B, fontSize: 11, italic: true, color: C.ice, margin: 0,
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 10.5, y: 5.05, w: 2.0, h: 0.5,
    fill: { color: C.amber }, line: { type: 'none' }, rectRadius: 0.25,
  });
  s.addText('LIVE TODAY', {
    x: 10.5, y: 5.05, w: 2.0, h: 0.5,
    fontFace: FONT_B, fontSize: 11, bold: true, color: C.navy, align: 'center', valign: 'middle', charSpacing: 3, margin: 0,
  });

  // What stayed the same / what changed strip
  s.addText('What stayed:', {
    x: 0.5, y: 6.7, w: 2.0, h: 0.35,
    fontFace: FONT_B, fontSize: 12, bold: true, color: C.teal, margin: 0,
  });
  s.addText('LLM + grounded reference data + Node/Express + structured JSON outputs.', {
    x: 2.4, y: 6.7, w: 10, h: 0.35,
    fontFace: FONT_B, fontSize: 12, color: C.ink, margin: 0,
  });

  footer(s, 4, 12);
}

// =============================================================================
// SLIDE 5 — UC #2 in one picture
// =============================================================================
{
  const s = pres.addSlide(); pageBg(s);
  eyebrow(s, 'What UC #2 does');
  title(s, 'Four outputs from one short brief.');

  // Left: input
  card(s, 0.5, 1.95, 3.4, 4.6, { accent: C.teal });
  s.addText('INPUT', {
    x: 0.75, y: 2.1, w: 3, h: 0.35,
    fontFace: FONT_B, fontSize: 10, color: C.teal, bold: true, charSpacing: 4, margin: 0,
  });
  s.addText('Project brief', {
    x: 0.75, y: 2.45, w: 3, h: 0.45,
    fontFace: FONT_H, fontSize: 18, bold: true, color: C.navy, margin: 0,
  });
  s.addText([
    { text: 'Title', options: { bullet: true, breakLine: true } },
    { text: 'Description', options: { bullet: true, breakLine: true } },
    { text: 'Intended outcome', options: { bullet: true, breakLine: true } },
    { text: 'Open notes (optional)', options: { bullet: true } },
  ], {
    x: 0.85, y: 3.0, w: 3.0, h: 2.5,
    fontFace: FONT_B, fontSize: 13, color: C.ink, paraSpaceAfter: 8, margin: 0,
  });
  s.addText('~2 minutes\nto fill in', {
    x: 0.85, y: 5.7, w: 3.0, h: 0.7,
    fontFace: FONT_B, fontSize: 12, italic: true, color: C.muted, margin: 0,
  });

  // Middle: engine
  s.addShape(pres.shapes.RIGHT_ARROW, {
    x: 3.95, y: 4.0, w: 0.45, h: 0.5,
    fill: { color: C.amber }, line: { type: 'none' },
  });
  card(s, 4.4, 1.95, 3.4, 4.6, { fill: C.navy, border: C.navy });
  s.addText('ENGINE', {
    x: 4.65, y: 2.1, w: 3, h: 0.35,
    fontFace: FONT_B, fontSize: 10, color: C.amber, bold: true, charSpacing: 4, margin: 0,
  });
  s.addText('Hybrid scorer', {
    x: 4.65, y: 2.45, w: 3, h: 0.45,
    fontFace: FONT_H, fontSize: 18, bold: true, color: C.white, margin: 0,
  });
  s.addText([
    { text: '1. Lexicon prior', options: { bold: true, color: C.amber, breakLine: true } },
    { text: "City's 4,166 keywords + 7,675 phrases  → ", options: { color: C.ice, fontSize: 11.5, breakLine: true } },
    { text: 'category scores (ISD / CC / DCS) + risk score.', options: { color: C.ice, fontSize: 11.5, breakLine: true } },
    { text: '\n', options: { fontSize: 6, breakLine: true } },
    { text: '2. LLM reasoning', options: { bold: true, color: C.amber, breakLine: true } },
    { text: 'GitHub Models gpt-4o reads category & KPI definitions, blends the prior, returns final scores + rationale.', options: { color: C.ice, fontSize: 11.5 } },
  ], {
    x: 4.65, y: 2.95, w: 3.0, h: 3.5,
    fontFace: FONT_B, fontSize: 13, color: C.white, paraSpaceAfter: 4, margin: 0,
  });

  s.addShape(pres.shapes.RIGHT_ARROW, {
    x: 7.95, y: 4.0, w: 0.45, h: 0.5,
    fill: { color: C.amber }, line: { type: 'none' },
  });

  // Right: outputs as 4 mini-cards
  const outputs = [
    { code: 'VC',  t: 'Value Category',  d: 'ISD / CC / DCS with confidence & evidence' },
    { code: 'KPI', t: 'KPI Suggestions', d: 'Ranked from 26 City KPIs, with why-it-fits' },
    { code: 'ALN', t: 'Alignment',       d: 'Maps to strategic priorities & department' },
    { code: 'SS',  t: 'Success Story',   d: 'Publishable 1-line / 1-para / full narrative' },
  ];
  const ox = 8.4, ow = 4.45, oh = 1.05, gap = 0.1;
  outputs.forEach((o, i) => {
    const y = 1.95 + i * (oh + gap);
    card(s, ox, y, ow, oh, { accent: C.amber });
    s.addShape(pres.shapes.OVAL, {
      x: ox + 0.2, y: y + 0.2, w: 0.65, h: 0.65,
      fill: { color: C.teal }, line: { type: 'none' },
    });
    s.addText(o.code, {
      x: ox + 0.2, y: y + 0.2, w: 0.65, h: 0.65,
      fontFace: FONT_B, fontSize: 10, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0,
    });
    s.addText(o.t, {
      x: ox + 1.0, y: y + 0.13, w: ow - 1.2, h: 0.4,
      fontFace: FONT_H, fontSize: 15, bold: true, color: C.navy, margin: 0,
    });
    s.addText(o.d, {
      x: ox + 1.0, y: y + 0.52, w: ow - 1.2, h: 0.45,
      fontFace: FONT_B, fontSize: 11, color: C.muted, margin: 0,
    });
  });

  s.addText('All four outputs grounded in the City\'s own taxonomy, definitions, and lexicon — no Microsoft-invented categories.', {
    x: 0.5, y: 6.7, w: 12.3, h: 0.4,
    fontFace: FONT_B, fontSize: 11, italic: true, color: C.muted, align: 'center', margin: 0,
  });

  footer(s, 5, 12);
}

// =============================================================================
// SLIDE 6 — The City's source of truth
// =============================================================================
{
  const s = pres.addSlide(); pageBg(s);
  eyebrow(s, "Adopting the City's rules");
  title(s, 'We pulled the City\'s own VRF repo and adopted it verbatim.');

  // Source card
  card(s, 0.5, 1.9, 6.0, 4.6, { accent: C.teal });
  s.addText('SOURCE OF TRUTH', {
    x: 0.75, y: 2.05, w: 5, h: 0.35,
    fontFace: FONT_B, fontSize: 10, color: C.teal, bold: true, charSpacing: 4, margin: 0,
  });
  s.addText('madads1305 /\nVRF_Scorecard_MVP', {
    x: 0.75, y: 2.4, w: 5.5, h: 1.2,
    fontFace: FONT_H, fontSize: 22, bold: true, color: C.navy, margin: 0, lineSpacingMultiple: 1.1,
  });
  s.addText('A GitHub repo authored by the City — eight CSVs that encode the canonical Value Categories, KPIs, Risk Categories, Tolerance Statements, and Keyword/Phrase lexicon.', {
    x: 0.75, y: 3.7, w: 5.5, h: 1.2,
    fontFace: FONT_B, fontSize: 13, color: C.ink, margin: 0,
  });
  s.addText('app.py is 0 bytes — the repo IS the rules.', {
    x: 0.75, y: 5.0, w: 5.5, h: 0.4,
    fontFace: FONT_B, fontSize: 12, italic: true, color: C.amber, bold: true, margin: 0,
  });
  s.addText('Our job: make those rules executable, without diluting them.', {
    x: 0.75, y: 5.5, w: 5.5, h: 0.9,
    fontFace: FONT_B, fontSize: 13, color: C.muted, italic: true, margin: 0,
  });

  // Files table
  card(s, 6.8, 1.9, 6.0, 4.6, { accent: C.amber });
  s.addText('8 CSV FILES, ADOPTED', {
    x: 7.05, y: 2.05, w: 5, h: 0.35,
    fontFace: FONT_B, fontSize: 10, color: C.amber, bold: true, charSpacing: 4, margin: 0,
  });

  const rows = [
    ['Value_Category_Definitions',  '3'],
    ['General_KPI_List',            '26'],
    ['Risk_Category_Definitions',   '13'],
    ['Risk_Tolerance_Statements',   '17'],
    ['Keyword_Lexicon',             '4,166'],
    ['Phrase_Lexicon',              '7,675'],
    ['Sample_CSI_Initiatives',      '118'],
    ['Driver_Keywords',             'merged'],
  ];
  const ry = 2.5, rh = 0.42;
  rows.forEach((r, i) => {
    const y = ry + i * rh;
    if (i % 2 === 0) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: 7.0, y, w: 5.6, h: rh, fill: { color: C.cream }, line: { type: 'none' },
      });
    }
    s.addText(r[0], {
      x: 7.1, y, w: 4.0, h: rh,
      fontFace: 'Consolas', fontSize: 11, color: C.ink, valign: 'middle', margin: 0,
    });
    s.addText(r[1], {
      x: 11.1, y, w: 1.4, h: rh,
      fontFace: FONT_B, fontSize: 12, bold: true, color: C.deep, align: 'right', valign: 'middle', margin: 0,
    });
  });

  s.addText('Total: 12,018 reference records, ingested.', {
    x: 0.5, y: 6.7, w: 12.3, h: 0.4,
    fontFace: FONT_B, fontSize: 12, bold: true, italic: true, color: C.navy, align: 'center', margin: 0,
  });

  footer(s, 6, 12);
}

// =============================================================================
// SLIDE 7 — Before / After
// =============================================================================
{
  const s = pres.addSlide(); pageBg(s);
  eyebrow(s, 'What changed');
  title(s, 'Before the merge  →  after the merge.');

  const headers = ['Dimension', 'Before (our prototype)', 'After (City rules merged)'];
  const data = [
    ['Value Categories',   '6 (3 invented extras)',         '3 — ISD / CC / DCS, City verbatim'],
    ['KPIs',               '18, light schema',              '26, with Use_When / Avoid_When / Drivers'],
    ['Risk Categories',    '7, IT-flavoured',               '13, enterprise (Climate, Continuity, HR…)'],
    ['Tolerance Statements','7 generic',                    '17 with HIGH / LOW / MODERATE per risk'],
    ['Keyword lexicon',    '~10 hand-coded indicators',     '4,166 City-weighted keywords'],
    ['Phrase lexicon',     'none',                          '7,675 phrases with primary category + KPI link'],
    ['Examples / test set','6 synthetic',                   '118 real CoO initiatives, City-tagged'],
    ['Scoring',            'LLM only',                      'Lexicon prior + LLM (explainable hybrid)'],
  ];

  const tx = 0.5, ty = 1.95, tw = 12.3;
  // header
  s.addShape(pres.shapes.RECTANGLE, {
    x: tx, y: ty, w: tw, h: 0.5,
    fill: { color: C.navy }, line: { type: 'none' },
  });
  const colW = [3.3, 4.5, 4.5];
  let cx = tx;
  headers.forEach((h, i) => {
    s.addText(h, {
      x: cx + 0.15, y: ty, w: colW[i] - 0.2, h: 0.5,
      fontFace: FONT_B, fontSize: 12, bold: true, color: C.white, charSpacing: 2, valign: 'middle', margin: 0,
    });
    cx += colW[i];
  });

  const rh = 0.52;
  data.forEach((row, ri) => {
    const y = ty + 0.5 + ri * rh;
    if (ri % 2 === 0) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: tx, y, w: tw, h: rh, fill: { color: C.white }, line: { type: 'none' },
      });
    } else {
      s.addShape(pres.shapes.RECTANGLE, {
        x: tx, y, w: tw, h: rh, fill: { color: C.cream }, line: { type: 'none' },
      });
    }
    let cx2 = tx;
    row.forEach((cell, ci) => {
      s.addText(cell, {
        x: cx2 + 0.15, y, w: colW[ci] - 0.2, h: rh,
        fontFace: ci === 0 ? FONT_B : FONT_B,
        fontSize: ci === 0 ? 12 : 12,
        bold: ci === 0,
        color: ci === 2 ? C.navy : (ci === 0 ? C.teal : C.ink),
        italic: ci === 1,
        valign: 'middle', margin: 0,
      });
      cx2 += colW[ci];
    });
  });

  s.addText('Zero Microsoft-invented taxonomy left.  100% of the rules are the City\'s.', {
    x: 0.5, y: 6.85, w: 12.3, h: 0.4,
    fontFace: FONT_B, fontSize: 12, bold: true, italic: true, color: C.amber, align: 'center', margin: 0,
  });

  footer(s, 7, 12);
}

// =============================================================================
// SLIDE 8 — Architecture (hybrid scorer)
// =============================================================================
{
  const s = pres.addSlide(); pageBg(s);
  eyebrow(s, 'Under the hood');
  title(s, 'Hybrid scoring: deterministic prior + LLM blending.');

  // input → lexicon → llm → output as a horizontal pipeline
  const pipeY = 2.6, blockH = 1.6, blockW = 2.6, gap = 0.55;
  const startX = 0.6;

  const blocks = [
    { t: 'Project brief',  s: 'title · desc · outcome', c: C.teal },
    { t: 'Lexicon prior',  s: '4,166 kw + 7,675 phrases', c: C.deep },
    { t: 'LLM reasoning',  s: 'gpt-4o + definitions', c: C.navy },
    { t: 'Scorecard JSON', s: 'VC · KPI · ALN · SS', c: C.amber, txtColor: C.navy },
  ];
  blocks.forEach((b, i) => {
    const x = startX + i * (blockW + gap);
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: pipeY, w: blockW, h: blockH,
      fill: { color: b.c }, line: { type: 'none' },
      shadow: { type: 'outer', color: '000000', blur: 8, offset: 1, angle: 90, opacity: 0.12 },
    });
    s.addText(b.t, {
      x: x + 0.1, y: pipeY + 0.35, w: blockW - 0.2, h: 0.55,
      fontFace: FONT_H, fontSize: 17, bold: true,
      color: b.txtColor || C.white, align: 'center', margin: 0,
    });
    s.addText(b.s, {
      x: x + 0.1, y: pipeY + 0.95, w: blockW - 0.2, h: 0.5,
      fontFace: FONT_B, fontSize: 11.5, italic: true,
      color: b.txtColor || C.ice, align: 'center', margin: 0,
    });
    if (i < blocks.length - 1) {
      s.addShape(pres.shapes.RIGHT_ARROW, {
        x: x + blockW + 0.05, y: pipeY + blockH / 2 - 0.22, w: 0.42, h: 0.45,
        fill: { color: C.amber }, line: { type: 'none' },
      });
    }
  });

  // Below-pipeline annotations
  const annY = 4.55;
  const annW = (blockW * 4 + gap * 3) / 4;
  const anns = [
    { y: 'Form fields\nfrom the SPA' },
    { y: 'Deterministic\nweights per category' },
    { y: 'Blends prior + KPI defs\n+ Use_When / Avoid_When' },
    { y: 'Goes to the UI\nwith full evidence trail' },
  ];
  anns.forEach((a, i) => {
    const x = startX + i * (blockW + gap);
    s.addText(a.y, {
      x: x, y: annY, w: blockW, h: 0.85,
      fontFace: FONT_B, fontSize: 11, italic: true, color: C.muted,
      align: 'center', margin: 0, lineSpacingMultiple: 1.2,
    });
  });

  // Bottom strip — why hybrid
  card(s, 0.5, 5.65, 12.3, 1.0, { fill: C.navy, border: C.navy, accent: C.amber });
  s.addText('WHY HYBRID', {
    x: 0.75, y: 5.75, w: 2, h: 0.3,
    fontFace: FONT_B, fontSize: 10, color: C.amber, bold: true, charSpacing: 4, margin: 0,
  });
  s.addText([
    { text: 'Explainable', options: { bold: true, color: C.amber } },
    { text: ' — we point at the exact keywords that drove the score.   ', options: { color: C.white } },
    { text: 'Cheaper', options: { bold: true, color: C.amber } },
    { text: ' — fewer tokens; prior does heavy lifting.   ', options: { color: C.white } },
    { text: 'Robust', options: { bold: true, color: C.amber } },
    { text: ' — LLM can override the prior with reasoning.   ', options: { color: C.white } },
    { text: 'Offline-capable', options: { bold: true, color: C.amber } },
    { text: ' — mock path works without any API key.', options: { color: C.white } },
  ], {
    x: 0.75, y: 6.05, w: 11.8, h: 0.6, fontFace: FONT_B, fontSize: 12.5, margin: 0,
  });

  footer(s, 8, 12);
}

// =============================================================================
// SLIDE 9 — By the numbers
// =============================================================================
{
  const s = pres.addSlide(); pageBg(s);
  eyebrow(s, 'By the numbers');
  title(s, 'What is in the box, today.');

  const stats = [
    { n: '3',     l: 'Value Categories', sub: 'ISD · CC · DCS, City verbatim', c: C.deep },
    { n: '26',    l: 'KPIs',             sub: 'with Use_When / Avoid_When',    c: C.teal },
    { n: '13',    l: 'Risk Categories',  sub: 'enterprise scope',              c: C.navy },
    { n: '17',    l: 'Tolerance stmts',  sub: 'HIGH / LOW / MODERATE',         c: C.deep },
    { n: '4,166', l: 'Keywords',         sub: 'weighted per category',          c: C.teal },
    { n: '7,675', l: 'Phrases',          sub: 'with KPI links',                 c: C.navy },
    { n: '118',   l: 'Sample initiatives', sub: 'real CoO projects',           c: C.amber, txtColor: C.navy },
    { n: '3 / 4', l: 'Mock-path matches', sub: 'vs. City\'s own tagging',       c: C.green },
  ];

  // 4 x 2 grid
  const gx0 = 0.5, gy0 = 1.95;
  const cw = 3.1, ch = 2.2, hg = 0.1, vg = 0.15;
  stats.forEach((st, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = gx0 + col * (cw + hg);
    const y = gy0 + row * (ch + vg);
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: cw, h: ch, fill: { color: st.c }, line: { type: 'none' },
      shadow: { type: 'outer', color: '000000', blur: 6, offset: 1, angle: 90, opacity: 0.1 },
    });
    s.addText(st.n, {
      x: x + 0.15, y: y + 0.3, w: cw - 0.3, h: 1.0,
      fontFace: FONT_H, fontSize: 50, bold: true,
      color: st.txtColor || C.white, align: 'center', margin: 0,
    });
    s.addText(st.l, {
      x: x + 0.15, y: y + 1.35, w: cw - 0.3, h: 0.4,
      fontFace: FONT_H, fontSize: 15, bold: true,
      color: st.txtColor || C.white, align: 'center', margin: 0,
    });
    s.addText(st.sub, {
      x: x + 0.15, y: y + 1.72, w: cw - 0.3, h: 0.4,
      fontFace: FONT_B, fontSize: 11, italic: true,
      color: st.txtColor === C.navy ? C.navy : C.ice, align: 'center', margin: 0,
    });
  });

  s.addText('12,018 total reference records, ingested from the City\'s own GitHub repo.', {
    x: 0.5, y: 6.75, w: 12.3, h: 0.4,
    fontFace: FONT_B, fontSize: 12, italic: true, color: C.muted, align: 'center', margin: 0,
  });

  footer(s, 9, 12);
}

// =============================================================================
// SLIDE 10 — Live demo plan
// =============================================================================
{
  const s = pres.addSlide(); pageBg(s);
  eyebrow(s, 'Live demo');
  title(s, 'Three projects.  Three different verdicts.');

  // demo URL block
  card(s, 0.5, 1.9, 4.2, 4.6, { fill: C.navy, border: C.navy, accent: C.amber });
  s.addText('OPEN IN BROWSER', {
    x: 0.75, y: 2.05, w: 4, h: 0.4,
    fontFace: FONT_B, fontSize: 11, color: C.amber, bold: true, charSpacing: 4, margin: 0,
  });
  s.addText('localhost:5260', {
    x: 0.75, y: 2.45, w: 4, h: 0.8,
    fontFace: 'Consolas', fontSize: 26, bold: true, color: C.white, margin: 0,
  });
  s.addText('Express + Vanilla SPA\nGitHub Models gpt-4o (live)\nDeterministic mock fallback', {
    x: 0.75, y: 3.4, w: 4, h: 1.3,
    fontFace: FONT_B, fontSize: 12, color: C.ice, margin: 0, lineSpacingMultiple: 1.3,
  });

  s.addShape(pres.shapes.LINE, {
    x: 0.75, y: 4.85, w: 3.5, h: 0,
    line: { color: C.amber, width: 1.5 },
  });

  s.addText('Endpoints exercised:', {
    x: 0.75, y: 5.0, w: 4, h: 0.35,
    fontFace: FONT_B, fontSize: 11, bold: true, color: C.white, margin: 0,
  });
  s.addText([
    { text: 'GET /api/health', options: { bullet: true, breakLine: true } },
    { text: 'GET /api/refdata', options: { bullet: true, breakLine: true } },
    { text: 'POST /api/analyze', options: { bullet: true } },
  ], {
    x: 0.85, y: 5.35, w: 4, h: 1.2,
    fontFace: 'Consolas', fontSize: 11, color: C.ice, paraSpaceAfter: 4, margin: 0,
  });

  // demo scenarios
  const scenarios = [
    { tag: 'ISD', t: 'Online permit renewal',
      d: 'Residents self-serve permit renewals 24/7 instead of in-person.',
      x: 'Expect: ISD dominant, KPIs around channel-shift & cycle time.', c: C.teal },
    { tag: 'DCS', t: 'Bulk procurement consolidation',
      d: 'Combine 4 departmental contracts into one enterprise vendor.',
      x: 'Expect: DCS dominant, KPIs around vendor consolidation savings.', c: C.deep },
    { tag: 'CC',  t: 'Field crew handheld upgrade',
      d: 'Replace paper inspection logs with mobile devices.',
      x: 'Expect: CC dominant, KPIs around hours released for field work.', c: C.amber },
  ];
  scenarios.forEach((sc, i) => {
    const x = 4.95, y = 1.9 + i * 1.6, w = 7.85, h = 1.45;
    card(s, x, y, w, h, { accent: sc.c });
    // tag pill
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.15, y: y + 0.18, w: 0.65, h: 0.4,
      fill: { color: sc.c }, line: { type: 'none' }, rectRadius: 0.2,
    });
    s.addText(sc.tag, {
      x: x + 0.15, y: y + 0.18, w: 0.65, h: 0.4,
      fontFace: FONT_B, fontSize: 11, bold: true,
      color: sc.tag === 'CC' ? C.navy : C.white,
      align: 'center', valign: 'middle', margin: 0,
    });
    s.addText(sc.t, {
      x: x + 0.95, y: y + 0.12, w: w - 1.1, h: 0.45,
      fontFace: FONT_H, fontSize: 16, bold: true, color: C.navy, margin: 0,
    });
    s.addText(sc.d, {
      x: x + 0.95, y: y + 0.55, w: w - 1.1, h: 0.4,
      fontFace: FONT_B, fontSize: 12, color: C.ink, margin: 0,
    });
    s.addText(sc.x, {
      x: x + 0.95, y: y + 0.95, w: w - 1.1, h: 0.4,
      fontFace: FONT_B, fontSize: 11, italic: true, color: C.muted, margin: 0,
    });
  });

  s.addText('Why three? To show the engine does not just always pick the same category — the prior is genuinely driving differentiation.', {
    x: 0.5, y: 6.75, w: 12.3, h: 0.4,
    fontFace: FONT_B, fontSize: 11, italic: true, color: C.muted, align: 'center', margin: 0,
  });

  footer(s, 10, 12);
}

// =============================================================================
// SLIDE 11 — Roadmap / what is next
// =============================================================================
{
  const s = pres.addSlide(); pageBg(s);
  eyebrow(s, 'What is next');
  title(s, '4 horizons, ordered by client value.');

  const items = [
    { h: 'Now',         t: '"Evidence" panel in the UI',  d: 'Surface the matched keywords/phrases driving each category score.  Builds trust.', c: C.amber, txt: C.navy },
    { h: 'Next 2 wks',  t: 'Full-LLM evaluation',          d: 'Run all 118 City samples through gpt-4o + lexicon.  Publish confusion matrix vs. City tagging.', c: C.teal },
    { h: 'This month',  t: 'npm run build:data',           d: 'Idempotent rebuild from the City repo on demand — non-engineers can refresh.', c: C.deep },
    { h: 'Q3',          t: 'Strategic priorities',         d: 'Validate / replace our 7-priority list with the City\'s canonical strategy.  Currently not in the VRF repo.', c: C.navy },
  ];

  const itemY0 = 1.95, itemH = 1.05, gap = 0.12;
  items.forEach((it, i) => {
    const y = itemY0 + i * (itemH + gap);
    // horizon pill
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 2.0, h: itemH, fill: { color: it.c }, line: { type: 'none' },
    });
    s.addText(it.h, {
      x: 0.5, y, w: 2.0, h: itemH,
      fontFace: FONT_H, fontSize: 16, bold: true,
      color: it.txt || C.white, align: 'center', valign: 'middle', margin: 0,
    });
    // body card
    card(s, 2.65, y, 10.15, itemH, { accent: it.c });
    s.addText(it.t, {
      x: 2.85, y: y + 0.13, w: 9.8, h: 0.4,
      fontFace: FONT_H, fontSize: 16, bold: true, color: C.navy, margin: 0,
    });
    s.addText(it.d, {
      x: 2.85, y: y + 0.55, w: 9.8, h: 0.45,
      fontFace: FONT_B, fontSize: 12, color: C.ink, margin: 0,
    });
  });

  s.addText('Each horizon is testable with the City team — no big-bang.', {
    x: 0.5, y: 6.7, w: 12.3, h: 0.4,
    fontFace: FONT_B, fontSize: 12, italic: true, color: C.teal, bold: true, align: 'center', margin: 0,
  });

  footer(s, 11, 12);
}

// =============================================================================
// SLIDE 12 — Thank you / discussion
// =============================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.5, h: SH, fill: { color: C.amber }, line: { type: 'none' },
  });

  s.addText('Thank you.', {
    x: 1.2, y: 1.8, w: 11, h: 1.3,
    fontFace: FONT_H, fontSize: 64, bold: true, color: C.white, margin: 0,
  });
  s.addText('Discussion.', {
    x: 1.2, y: 3.0, w: 11, h: 0.8,
    fontFace: FONT_H, fontSize: 36, bold: false, color: C.amber, italic: true, margin: 0,
  });

  s.addShape(pres.shapes.LINE, {
    x: 1.2, y: 4.1, w: 4, h: 0, line: { color: C.amber, width: 2 },
  });

  // Three columns: contact, links, what we want feedback on
  const cy = 4.5;
  s.addText('Contact', {
    x: 1.2, y: cy, w: 4, h: 0.4,
    fontFace: FONT_B, fontSize: 11, bold: true, color: C.amber, charSpacing: 4, margin: 0,
  });
  s.addText('Amit Nandi  ·  Microsoft ATS', {
    x: 1.2, y: cy + 0.4, w: 4, h: 0.4,
    fontFace: FONT_H, fontSize: 15, bold: true, color: C.white, margin: 0,
  });
  s.addText('amitnandi@microsoft.com', {
    x: 1.2, y: cy + 0.85, w: 4, h: 0.4,
    fontFace: FONT_B, fontSize: 12, color: C.ice, margin: 0,
  });

  s.addText('Repos', {
    x: 5.5, y: cy, w: 4, h: 0.4,
    fontFace: FONT_B, fontSize: 11, bold: true, color: C.amber, charSpacing: 4, margin: 0,
  });
  s.addText([
    { text: 'github.com/madads1305/VRF_Scorecard_MVP', options: { color: C.white, breakLine: true } },
    { text: 'coo-value-realization-scorecard (local)', options: { color: C.ice, italic: true } },
  ], {
    x: 5.5, y: cy + 0.4, w: 4.5, h: 1.0,
    fontFace: 'Consolas', fontSize: 11.5, margin: 0, paraSpaceAfter: 4,
  });

  s.addText('Today\'s artefacts', {
    x: 10.0, y: cy, w: 4, h: 0.4,
    fontFace: FONT_B, fontSize: 11, bold: true, color: C.amber, charSpacing: 4, margin: 0,
  });
  s.addText([
    { text: 'docs/vrf-merge-design.md', options: { breakLine: true } },
    { text: 'data/keywords.json  +  phrases.json', options: { breakLine: true } },
    { text: 'lib/lexicon.js  (new)', options: { breakLine: true } },
    { text: 'lib/analyze.js  +  llm.js  (hybrid)', options: {} },
  ], {
    x: 10.0, y: cy + 0.4, w: 3.2, h: 1.5,
    fontFace: 'Consolas', fontSize: 10.5, color: C.white, margin: 0, paraSpaceAfter: 3,
  });

  // Footer bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: SH - 0.6, w: SW, h: 0.6, fill: { color: C.deep }, line: { type: 'none' },
  });
  s.addText('USE CASE #2  ·  Value Realization Scorecard  ·  City of Ottawa  ·  Live demo on http://localhost:5260', {
    x: 0.5, y: SH - 0.55, w: 12.3, h: 0.5,
    fontFace: FONT_B, fontSize: 11, color: C.ice, italic: true, valign: 'middle', align: 'center', margin: 0,
  });
}

// =============================================================================
// Write
// =============================================================================
pres.writeFile({ fileName: OUT })
  .then(file => console.log('Wrote', file))
  .catch(err => { console.error(err); process.exit(1); });
