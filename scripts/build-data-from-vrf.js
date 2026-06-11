// Build script: read the upstream City VRF_Scorecard_MVP CSVs and write the
// local app's reference JSON files. Idempotent — safe to re-run.
//
// Usage:   node scripts/build-data-from-vrf.js
// Source:  ../VRF_Scorecard_MVP/*.csv  (clone of github.com/madads1305/VRF_Scorecard_MVP)
// Output:  data/value-categories.json
//          data/kpis.json
//          data/risks.json
//          data/tolerance.json
//          data/examples.json
//          data/keywords.json   (lexicon — server-side only)
//          data/phrases.json    (lexicon — server-side only)

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const VRF = path.join(ROOT, '..', 'VRF_Scorecard_MVP');
const DATA = path.join(ROOT, 'data');

// ---- CSV reader ---------------------------------------------------------

function readCsvFile(file) {
  const abs = path.join(VRF, file);
  return parseCsv(normalize(readCp1252(abs)));
}

// Upstream CSVs are Windows-1252 encoded. Decode bytes manually so the
// C1 range (0x80-0x9F) maps to its proper Win-1252 printable characters
// rather than Latin-1's unassigned control codes.
const CP1252_C1 = {
  0x80: '\u20AC', 0x82: '\u201A', 0x83: '\u0192', 0x84: '\u201E', 0x85: '\u2026',
  0x86: '\u2020', 0x87: '\u2021', 0x88: '\u02C6', 0x89: '\u2030', 0x8A: '\u0160',
  0x8B: '\u2039', 0x8C: '\u0152', 0x8E: '\u017D',
  0x91: '\u2018', 0x92: '\u2019', 0x93: '\u201C', 0x94: '\u201D', 0x95: '\u2022',
  0x96: '\u2013', 0x97: '\u2014', 0x98: '\u02DC', 0x99: '\u2122', 0x9A: '\u0161',
  0x9B: '\u203A', 0x9C: '\u0153', 0x9E: '\u017E', 0x9F: '\u0178',
};
function readCp1252(abs) {
  const buf = fs.readFileSync(abs);
  let out = '';
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (b < 0x80) out += String.fromCharCode(b);
    else if (b >= 0xA0) out += String.fromCharCode(b);   // latin1 range
    else out += (CP1252_C1[b] || ' ');
  }
  return out;
}

// Replace assorted Unicode dashes, smart quotes, bullets, and non-printing
// chars with ASCII equivalents so downstream string compares behave
// predictably.
function normalize(s) {
  return s
    .replace(/\uFEFF/g, '')                     // BOM
    .replace(/\uFFFD/g, '')                     // replacement char
    .replace(/[\u2010-\u2015]/g, '-')           // hyphens / en-dash / em-dash
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2022\u00B7]/g, '-')            // bullet / middle dot -> hyphen
    .replace(/\u2026/g, '...')                  // ellipsis
    .replace(/\u00A0/g, ' ');                   // non-breaking space
}

// Minimal RFC-4180 CSV parser supporting quoted fields w/ embedded commas,
// newlines, and "" escapes. Returns an array of arrays.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\r') { /* skip — handled by \n */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  // Drop trailing empty row if any.
  while (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') rows.pop();
  return rows;
}

// Convert raw-row CSV (with header row) into array of objects.
function toObjects(rows) {
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => {
    const o = {};
    headers.forEach((h, i) => { o[h] = (r[i] != null ? r[i] : '').trim(); });
    return o;
  });
}

function writeJson(file, payload) {
  const abs = path.join(DATA, file);
  fs.writeFileSync(abs, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
  console.log(`  ✓ wrote ${path.relative(ROOT, abs)}`);
}

function slug(s) {
  return String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ---- Value Categories ---------------------------------------------------
// Source CSV: Category Code, Category_Name, Definition, Example KPIs
// Locked to the city's 3 canonical categories (ISD/CC/DCS).

const CATEGORY_COLORS = {
  ISD: '#2563eb',
  CC: '#10b981',
  DCS: '#f59e0b',
};

function buildValueCategories() {
  const rows = toObjects(readCsvFile('Value Category_Definitions.csv'));
  const categories = rows.map(r => {
    const code = r['Category Code'];
    const name = r['Category_Name'];
    return {
      id: slug(name),
      code,
      name,
      color: CATEGORY_COLORS[code] || '#64748b',
      definition: r['Definition'].replace(/\s+/g, ' ').trim(),
      exampleKpis: (r['Example KPIs'] || '').split(/\r?\n/).map(s => s.replace(/^[\s\-•]+/, '').trim()).filter(Boolean),
    };
  });
  writeJson('value-categories.json', {
    version: '1.0.0',
    source: 'City of Ottawa VRF_Scorecard_MVP — Value Category_Definitions.csv',
    categories,
  });
  return categories;
}

// ---- KPIs ---------------------------------------------------------------
// Source CSV columns:
//   KPI_ID,Category,KPI_Title,Definition,Calculation,Driver_Keywords,
//   Use_When,Avoid_When,Strategic_Alignment,Notes,KPI_Type,Department

function buildKpis(categoryByName) {
  const rows = toObjects(readCsvFile('General KPI List.csv'));
  const kpis = rows.map(r => {
    const catName = r['Category'];
    const catId = categoryByName[catName] || slug(catName);
    return {
      id: (r['KPI_ID'] || slug(r['KPI_Title'])).trim().replace(/\?/g, '-'),
      name: r['KPI_Title'],
      categories: [catId],
      category: catName,
      type: r['KPI_Type'],
      definition: r['Definition'],
      calculation: r['Calculation'],
      driverKeywords: (r['Driver_Keywords'] || '').split(/,/).map(s => s.trim()).filter(Boolean),
      useWhen: r['Use_When'],
      avoidWhen: r['Avoid_When'],
      strategicAlignment: r['Strategic_Alignment'],
      department: r['Department'],
      notes: r['Notes'],
      dataSource: defaultDataSource(catName),
    };
  });
  writeJson('kpis.json', {
    version: '1.0.0',
    source: 'City of Ottawa VRF_Scorecard_MVP — General KPI List.csv',
    kpis,
  });
  return kpis;
}

function defaultDataSource(catName) {
  switch ((catName || '').toLowerCase()) {
    case 'improved service delivery': return 'Service request system / 311 / departmental SLA logs';
    case 'capacity creation': return 'Workflow audit logs / time-and-effort study';
    case 'direct cost savings': return 'Financial system (SAP) / budget vs. actuals';
    default: return 'Departmental performance tracker';
  }
}

// ---- Risks --------------------------------------------------------------
// Source CSV: Risk Category, Definition (13 rows)

// Canonical risk-area names — used to bridge naming inconsistencies between
// Risk_Category_Definitions.csv and Risk_Tolerance_Statements.csv so the
// analyze pipeline can join tolerance entries to risks by intentArea.
function canonicalRiskArea(name) {
  const n = String(name || '').trim();
  const map = {
    'Human Resources (HR) Management': 'Human Resources Management',
    'Human Resources Management': 'Human Resources Management',
    'Technology /Digital': 'Technology',
    'Technology/Digital': 'Technology',
    'Technology': 'Technology',
  };
  return map[n] || n;
}

function buildRisks() {
  const rows = toObjects(readCsvFile('Risk_Category_Definitions.csv'));
  const risks = rows.map(r => {
    const name = canonicalRiskArea(r['Risk Category']);
    const id = slug(name);
    return {
      id,
      name,
      // intentArea acts as the join key against tolerance.framework[].intentArea.
      intentArea: name,
      definition: (r['Definition'] || '').replace(/\s+/g, ' ').trim(),
      // Light-weight indicators derived from category name — the lexicon is the
      // primary signal, but the mock pipeline still uses indicators as a fallback.
      indicators: deriveIndicators(name),
    };
  });
  writeJson('risks.json', {
    version: '1.0.0',
    source: 'City of Ottawa VRF_Scorecard_MVP — Risk_Category_Definitions.csv',
    risks,
  });
  return risks;
}

function deriveIndicators(name) {
  const base = String(name).toLowerCase();
  const map = {
    'climate change': ['climate', 'weather', 'emission', 'greenhouse', 'flood', 'heat'],
    'compliance': ['compliance', 'regulation', 'policy', 'audit', 'breach'],
    'continuity of operations': ['outage', 'disruption', 'continuity', 'recover', 'disaster'],
    'cybersecurity': ['cyber', 'breach', 'malware', 'phishing', 'attack', 'vulnerability'],
    'data and privacy': ['data', 'privacy', 'PII', 'FIPPA', 'consent', 'personal information'],
    'financial': ['cost', 'budget', 'spend', 'savings', 'overrun'],
    'governance': ['governance', 'oversight', 'accountability', 'decision'],
    'health and safety': ['safety', 'injury', 'hazard', 'wellbeing', 'incident'],
    'human resources management': ['staff', 'workforce', 'training', 'morale', 'attrition'],
    'legal': ['legal', 'litigation', 'liability', 'contract', 'lawsuit'],
    'reputation': ['reputation', 'trust', 'media', 'public', 'complaint'],
    'reputational': ['reputation', 'trust', 'media', 'public', 'complaint'],
    'strategic': ['strategy', 'objective', 'priority', 'misalignment'],
    'technology': ['technology', 'system', 'integration', 'platform', 'API'],
    'innovation': ['innovation', 'experiment', 'pilot', 'novel', 'new'],
    'partnerships': ['partner', 'vendor', 'supplier', 'collaboration', 'third-party'],
    'political': ['council', 'political', 'public', 'governance'],
    'infrastructure': ['infrastructure', 'asset', 'facility', 'maintenance'],
    'fraud': ['fraud', 'misuse', 'corruption', 'theft'],
    'staff and public health and safety': ['safety', 'injury', 'health', 'wellbeing', 'hazard'],
  };
  return map[base] || [base.split(/\s+/)[0]];
}

// ---- Risk Tolerance -----------------------------------------------------
// Source CSV is HEADERLESS in upstream — 4 cols: Risk Category, Statement,
// Tolerance Statement, Level (HIGH/LOW/MEDIUM)

function buildTolerance() {
  // Read raw (no header object mapping) because upstream omits the header row.
  // Use the same Win-1252 decode path as the other CSVs.
  const rows = parseCsv(normalize(readCp1252(path.join(VRF, 'Risk_Tolerance_Statements.csv'))));
  // Detect whether the first row looks like a header (contains the word
  // "Tolerance" in any cell). The data we saw has no header, but be defensive.
  const looksLikeHeader = rows.length && rows[0].join('|').toLowerCase().includes('risk category');
  const dataRows = looksLikeHeader ? rows.slice(1) : rows;
  const framework = dataRows
    .filter(r => r.length >= 4 && r[0].trim())
    .map(r => ({
      intentArea: canonicalRiskArea(r[0]),
      statement: r[1].trim(),
      tolerance: r[2].trim(),
      level: r[3].trim().toUpperCase(),
      // For UI compat with the existing `cityTolerance` + `guidance` shape.
      cityTolerance: titleCase(r[3].trim()),
      guidance: r[2].trim(),
    }));
  writeJson('tolerance.json', {
    version: '1.0.0',
    source: 'City of Ottawa VRF_Scorecard_MVP — Risk_Tolerance_Statements.csv',
    framework,
  });
  return framework;
}

function titleCase(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// ---- Examples (Sample CSI Initiatives) ----------------------------------
// CSV cols: Department Code, Department, Project Name, Project Description,
//           CSI-Value Categories

function buildExamples() {
  const rows = toObjects(readCsvFile('Sample CSI Initiatives.csv'));
  const examples = rows
    .filter(r => r['Project Name'])
    .map((r, i) => ({
      id: slug(r['Project Name']).slice(0, 60) || `example-${i + 1}`,
      label: `${r['Project Name']} (${r['Department Code']})`,
      department: r['Department Code'],
      departmentName: r['Department'],
      title: r['Project Name'],
      description: r['Project Description'],
      outcome: '',
      openText: '',
      tagged: (r['CSI-Value Categories'] || '').split(/,/).map(s => s.trim()).filter(Boolean),
    }));
  writeJson('examples.json', {
    version: '1.0.0',
    source: 'City of Ottawa VRF_Scorecard_MVP — Sample CSI Initiatives.csv',
    examples,
  });
  return examples;
}

// ---- Keywords lexicon ---------------------------------------------------
// CSV cols: Keyword,ISD_Wt,CC_Wt,DCS_Wt,RISK_Wt,Notes,Source,Word_Count

function buildKeywords() {
  const rows = toObjects(readCsvFile('Keywords_Master.csv'));
  const keywords = rows
    .map(r => ({
      keyword: (r['Keyword'] || '').trim().toLowerCase(),
      weights: {
        ISD: numOr0(r['ISD_Wt']),
        CC: numOr0(r['CC_Wt']),
        DCS: numOr0(r['DCS_Wt']),
        RISK: numOr0(r['RISK_Wt']),
      },
      notes: (r['Notes'] || '').trim(),
      source: (r['Source'] || '').trim(),
      wordCount: numOr0(r['Word_Count']),
    }))
    .filter(k => k.keyword);
  writeJson('keywords.json', {
    version: '1.0.0',
    source: 'City of Ottawa VRF_Scorecard_MVP — Keywords_Master.csv',
    count: keywords.length,
    keywords,
  });
  return keywords;
}

// ---- Phrases lexicon ----------------------------------------------------
// CSV cols: Phrase, Primary_Category, Weight, Word_Count, KPI_Link, Notes

function buildPhrases() {
  const rows = toObjects(readCsvFile('Phrases_Master.csv'));
  const phrases = rows
    .map(r => ({
      phrase: (r['Phrase'] || '').trim().toLowerCase(),
      primaryCategory: (r['Primary_Category'] || '').trim(),
      weight: numOr0(r['Weight']),
      wordCount: numOr0(r['Word_Count']),
      kpiLink: (r['KPI_Link'] || '').trim(),
      notes: (r['Notes'] || '').trim(),
    }))
    .filter(p => p.phrase);
  writeJson('phrases.json', {
    version: '1.0.0',
    source: 'City of Ottawa VRF_Scorecard_MVP — Phrases_Master.csv',
    count: phrases.length,
    phrases,
  });
  return phrases;
}

function numOr0(v) {
  const n = parseInt(String(v).trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

// ---- Main ---------------------------------------------------------------

function main() {
  if (!fs.existsSync(VRF)) {
    console.error(`ERROR: upstream repo not found at ${VRF}`);
    console.error('Clone it first:  git clone https://github.com/madads1305/VRF_Scorecard_MVP ../VRF_Scorecard_MVP');
    process.exit(1);
  }
  console.log(`Reading from: ${VRF}`);
  console.log(`Writing to:   ${DATA}\n`);

  console.log('Value Categories...');
  const categories = buildValueCategories();
  const categoryByName = Object.fromEntries(categories.map(c => [c.name, c.id]));

  console.log('KPIs...');
  const kpis = buildKpis(categoryByName);

  console.log('Risks...');
  const risks = buildRisks();

  console.log('Tolerance...');
  const tolerance = buildTolerance();

  console.log('Examples...');
  const examples = buildExamples();

  console.log('Keywords lexicon...');
  const keywords = buildKeywords();

  console.log('Phrases lexicon...');
  const phrases = buildPhrases();

  console.log('\nSummary:');
  console.log(`  ${categories.length} value categories`);
  console.log(`  ${kpis.length} KPIs`);
  console.log(`  ${risks.length} risk categories`);
  console.log(`  ${tolerance.length} tolerance statements`);
  console.log(`  ${examples.length} sample initiatives`);
  console.log(`  ${keywords.length} keywords`);
  console.log(`  ${phrases.length} phrases`);
}

main();
