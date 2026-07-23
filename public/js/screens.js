// All 7 screen renderers. Each returns an HTMLElement.
// State is held in window.STATE (set by app.js).

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (v === true) node.setAttribute(k, '');
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

function header(title, num, subtitle, rightSlot) {
  return el('div', { class: 'screen-header' }, [
    el('div', { class: 'screen-title-block' }, [
      el('h1', { class: 'screen-title' }, [
        title,
        num != null ? el('span', { class: 'screen-title-num' }, '.' + num) : null,
      ]),
      subtitle ? el('div', { class: 'screen-subtitle' }, subtitle) : null,
    ]),
    rightSlot || null,
  ]);
}

// ---------- 01 INPUT ----------
const Screens = {};

Screens.input = function () {
  const root = el('div');
  root.appendChild(header('INPUT', '01', 'Capture initiative details to generate value, KPI, risk, and strategic alignment.', null));

  const card = el('div', { class: 'card' });
  root.appendChild(card);

  // Department + Title row
  const metaRow = el('div', { class: 'input-meta-row' });
  card.appendChild(metaRow);

  const deptField = el('div', { class: 'field' });
  deptField.appendChild(el('label', { class: 'field-label' }, 'Department'));
  deptField.appendChild(el('div', { class: 'field-helper' }, 'Select the department leading this initiative.'));
  const deptSelect = el('select', { class: 'field-select', id: 'fldDept' });
  deptSelect.appendChild(el('option', { value: '' }, '— Select department —'));
  STATE.refdata.departments.forEach(d => deptSelect.appendChild(el('option', { value: d.code }, `${d.code} — ${d.name}`)));
  if (STATE.input?.department) deptSelect.value = STATE.input.department;
  deptField.appendChild(deptSelect);
  metaRow.appendChild(deptField);

  const titleField = el('div', { class: 'field' });
  titleField.appendChild(el('label', { class: 'field-label' }, 'Project Title'));
  titleField.appendChild(el('div', { class: 'field-helper' }, 'Provide a short, descriptive title for your proposal or project.'));
  titleField.appendChild(el('input', { class: 'field-input', id: 'fldTitle', type: 'text', value: STATE.input?.title || '' }));
  metaRow.appendChild(titleField);

  // Description
  const descField = el('div', { class: 'field' });
  descField.appendChild(el('label', { class: 'field-label' }, 'Description'));
  descField.appendChild(el('div', { class: 'field-helper' }, 'Detail the current state, proposed changes, and methods used to achieve them.'));
  descField.appendChild(el('textarea', { class: 'field-textarea', id: 'fldDesc', html: STATE.input?.description || '' }));
  card.appendChild(descField);

  // Expected Outcome
  const outField = el('div', { class: 'field' });
  outField.appendChild(el('label', { class: 'field-label' }, 'Expected Outcome'));
  outField.appendChild(el('div', { class: 'field-helper' }, 'Tangible benefits, metrics, or qualitative improvements this initiative will deliver.'));
  outField.appendChild(el('textarea', { class: 'field-textarea', id: 'fldOutcome', html: STATE.input?.outcome || '' }));
  card.appendChild(outField);

  // Open text
  const openField = el('div', { class: 'field' });
  openField.appendChild(el('label', { class: 'field-label' }, 'Additional Context (Open Text)'));
  openField.appendChild(el('div', { class: 'field-helper' }, 'Background, impact, anecdotes, metrics, or quotes — anything that helps tell the story.'));
  openField.appendChild(el('textarea', { class: 'field-textarea', id: 'fldOpen', html: STATE.input?.openText || '' }));
  card.appendChild(openField);

  // Actions
  const actions = el('div', { class: 'input-actions' });

  const exampleWrap = el('div', { style: 'display:flex; gap:8px; align-items:center; flex:1;' });
  const exampleSelect = el('select', { class: 'field-select', id: 'fldExample', style: 'flex:1; max-width:340px;' });
  exampleSelect.appendChild(el('option', { value: '' }, '— Choose example —'));
  STATE.examples.examples.forEach(ex => exampleSelect.appendChild(el('option', { value: ex.id }, ex.label)));
  exampleWrap.appendChild(exampleSelect);

  exampleWrap.appendChild(el('button', {
    class: 'btn btn--ghost btn--small',
    onclick: () => {
      const id = exampleSelect.value;
      const ex = STATE.examples.examples.find(e => e.id === id);
      if (!ex) { toast('Pick an example first.'); return; }
      document.getElementById('fldDept').value = ex.department;
      document.getElementById('fldTitle').value = ex.title;
      document.getElementById('fldDesc').value = ex.description;
      document.getElementById('fldOutcome').value = ex.outcome;
      document.getElementById('fldOpen').value = ex.openText || '';
      toast('Example data loaded.');
    },
  }, 'LOAD EXAMPLE DATA'));
  actions.appendChild(exampleWrap);

  actions.appendChild(el('button', {
    class: 'btn btn--dark',
    onclick: async () => {
      const input = {
        department: document.getElementById('fldDept').value,
        title: document.getElementById('fldTitle').value.trim(),
        description: document.getElementById('fldDesc').value.trim(),
        outcome: document.getElementById('fldOutcome').value.trim(),
        openText: document.getElementById('fldOpen').value.trim(),
      };
      if (!input.title || !input.description) {
        toast('Title and description are required.');
        return;
      }
      await runAnalyze(input);
    },
  }, 'ANALYZE  →'));
  card.appendChild(actions);

  return root;
};

// ---------- 02 SCORECARD ----------
Screens.scorecard = function () {
  if (!STATE.analysis) return emptyState('Run an analysis to see the scorecard.', 'input');
  const a = STATE.analysis;
  const root = el('div');

  root.appendChild(header('SCORECARD', '02', null,
    el('div', { class: 'badge badge--ai' }, '✦ AI CONTEXTUAL INFERENCE')
  ));

  const card = el('div', { class: 'card' });
  const table = el('table', { class: 'score-table' });
  const thead = el('thead');
  thead.appendChild(el('tr', {}, [
    el('th', {}, 'Value Category'),
    el('th', { style: 'width:120px' }, 'Context Match %'),
    el('th', { style: 'width:140px' }, 'Alignment'),
  ]));
  table.appendChild(thead);

  const tbody = el('tbody');
  a.categories.forEach(cat => {
    const isPrimary = a.primary && cat.id === a.primary.id;
    const isSecondary = a.secondary && cat.id === a.secondary.id;
    const fillCls = isPrimary ? 'progress-fill--primary'
                    : isSecondary ? 'progress-fill--secondary'
                    : 'progress-fill--zero';
    const align = isPrimary
      ? el('span', { class: 'badge badge--primary' }, 'PRIMARY')
      : isSecondary
        ? el('span', { class: 'badge badge--secondary' }, 'SECONDARY')
        : '';
    const row = el('tr', { class: isPrimary ? 'row--primary' : '' }, [
      el('td', {}, [
        el('div', { class: 'score-row-name' }, cat.name),
        el('div', { class: 'progress-bar' }, [
          el('div', { class: 'progress-fill ' + fillCls, style: `width:${cat.score}%` }),
        ]),
      ]),
      el('td', { class: 'score-row-pct' }, cat.score + '%'),
      el('td', {}, align || ''),
    ]);
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  card.appendChild(table);

  // Suggested KPIs preview
  card.appendChild(el('div', { class: 'screen-section-title' }, 'Suggested KPIs'));
  const kpiList = el('ul', { class: 'suggested-kpis-list' });
  (a.kpis || []).slice(0, 4).forEach(k => {
    kpiList.appendChild(el('li', { class: 'suggested-kpi-item' }, [
      el('span', { class: 'kpi-check' }, '✓'),
      k.name,
    ]));
  });
  card.appendChild(kpiList);

  card.appendChild(el('button', {
    class: 'btn',
    style: 'margin-top: 18px;',
    onclick: () => navigate('kpi'),
  }, 'NEXT: KPI ALIGNMENT →'));
  root.appendChild(card);

  root.appendChild(el('div', { class: 'explainer' }, [
    el('div', { class: 'explainer-title' }, '✦ How this is calculated'),
    el('div', {}, 'This system uses LLM-powered contextual inference to map the intent of your open-text descriptions and outcomes against standard value category definitions. It doesn\'t just look for exact keywords; it understands the semantic meaning of your initiative and calculates the confidence of alignment (Context Match %) to recommend the most strategically relevant category and KPIs.'),
  ]));

  return root;
};

// ---------- 03 KPI ALIGNMENT ----------
Screens.kpi = function () {
  if (!STATE.analysis) return emptyState('Run an analysis to see KPI alignment.', 'input');
  const a = STATE.analysis;
  const root = el('div');

  root.appendChild(header('KPI ALIGNMENT', '03', 'KPI ALIGNMENT (WEB-ENHANCED)',
    el('div', { class: 'badge badge--gen-ai' }, '⚡ GENERATIVE AI ASSISTED')
  ));

  const card = el('div', { class: 'card' });

  const topMeta = el('div', { style: 'display:grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 18px;' });
  // Target department
  const deptCol = el('div');
  deptCol.appendChild(el('label', { class: 'field-label' }, 'Target Department'));
  const deptSel = el('select', { class: 'field-select' });
  STATE.refdata.departments.forEach(d => {
    const opt = el('option', { value: d.code }, `${d.code} — ${d.name}`);
    if (d.code === (STATE.input?.department || '')) opt.setAttribute('selected', '');
    deptSel.appendChild(opt);
  });
  deptCol.appendChild(deptSel);
  topMeta.appendChild(deptCol);

  const alignCol = el('div', { style: 'text-align:right;' });
  alignCol.appendChild(el('div', { class: 'field-label' }, 'Primary Value Alignment'));
  alignCol.appendChild(el('div', { style: 'font-size: 16px; font-weight: 700; color: var(--brand-blue);' },
    a.primary?.name || '—'));
  if (a.secondary) {
    alignCol.appendChild(el('div', { style: 'font-size: 12px; color: var(--text-muted); margin-top: 2px;' },
      'Secondary: ' + a.secondary.name));
  }
  topMeta.appendChild(alignCol);
  card.appendChild(topMeta);

  const table = el('table', { class: 'kpi-table' });
  table.appendChild(el('thead', {}, el('tr', {}, [
    el('th', { style: 'width: 32%' }, 'KPI Selection'),
    el('th', { style: 'width: 22%' }, 'Alignment'),
    el('th', {}, 'Definition / Context'),
    el('th', { style: 'width: 110px' }, 'Type'),
  ])));

  const tbody = el('tbody');
  a.kpis.forEach(k => {
    const ribbonCls = k.recommendation === 'PRIMARY' ? 'kpi-rec--primary' : 'kpi-rec--secondary';
    tbody.appendChild(el('tr', { class: 'kpi-row--click', title: 'Open KPI Canvas', onclick: () => openCanvasFor(k) }, [
      el('td', {}, [
        el('div', { class: 'kpi-name-cell' }, [
          el('div', { class: 'kpi-name' }, k.name),
          el('div', { class: 'kpi-rec-ribbon ' + ribbonCls },
            (k.recommendation || 'PRIMARY') + ' RECOMMENDATION'),
        ]),
      ]),
      el('td', { style: 'font-size: 13px;' }, k.alignment || '—'),
      el('td', { style: 'font-size: 13px; color: var(--text-secondary);' },
        el('em', {}, k.rationale || k.definition || '—')),
      el('td', {},
        el('span', { class: 'badge ' + (k.type === 'Quantitative' ? 'badge--quant' : k.type === 'Qualitative' ? 'badge--qual' : 'badge--mixed') },
          (k.type || '—').toUpperCase())),
    ]));
  });

  // Two manual selection slots
  for (let i = 0; i < 2; i++) {
    const sel = el('select', { class: 'field-select' });
    sel.appendChild(el('option', { value: '' }, '-- Manual KPI Selection --'));
    STATE.refdata.kpis.forEach(k => sel.appendChild(el('option', { value: k.id }, k.name)));
    tbody.appendChild(el('tr', {}, [
      el('td', {}, [
        el('div', { class: 'kpi-name-cell' }, [
          sel,
          el('div', { class: 'kpi-rec-ribbon kpi-rec--manual' }, 'MANUAL SELECTION'),
        ]),
      ]),
      el('td', { style: 'font-size: 12px; color: var(--text-muted);' }, 'User-curated'),
      el('td', { style: 'font-size: 12px; color: var(--text-muted);' }, 'Add your own KPI from the full library.'),
      el('td', {}, ''),
    ]));
  }
  table.appendChild(tbody);
  card.appendChild(table);

  card.appendChild(el('button', {
    class: 'btn',
    style: 'margin-top: 18px;',
    onclick: () => navigate('canvas'),
  }, 'NEXT: KPI CANVAS →'));
  root.appendChild(card);
  return root;
};

// ---------- 04 KPI CANVAS ----------

function normalizeKpiName(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Known renames between the analysis KPI library (kpis.json) and the master Canvas DB.
const KPI_NAME_ALIASES = {
  'customer satisfaction score': 'resident client satisfaction score',
};

function canvasKpis() {
  return (STATE.kpiCanvas && STATE.kpiCanvas.kpis) || [];
}

// Resolve a recommended/analysis KPI to a master Canvas KPI by NAME only.
// The two datasets use different ID namespaces, so ID matching would be unreliable.
function resolveCanvasKpi(rec) {
  const kpis = canvasKpis();
  if (!kpis.length) return null;
  const recName = normalizeKpiName(rec && (rec.name || rec));
  if (!recName) return null;
  const aliased = KPI_NAME_ALIASES[recName] || recName;
  let hit = kpis.find(k => normalizeKpiName(k.name) === aliased);
  if (hit) return hit;
  hit = kpis.find(k => {
    const n = normalizeKpiName(k.name);
    return n && (n.includes(aliased) || aliased.includes(n));
  });
  return hit || null;
}

// Used by the KPI Alignment screen rows.
function openCanvasFor(rec) {
  const hit = resolveCanvasKpi(rec);
  if (hit) {
    STATE.selectedKpiId = hit.id;
  } else {
    STATE.selectedKpiId = null;
    toast('No exact Canvas match — browse the KPI library.');
  }
  navigate('canvas');
}

function selectedCanvasKpi() {
  const kpis = canvasKpis();
  if (!kpis.length || !STATE.selectedKpiId) return null;
  return kpis.find(k => k.id === STATE.selectedKpiId) || null;
}

function validHttpUrl(s) {
  if (!s) return null;
  try {
    const u = new URL(String(s).trim());
    return (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : null;
  } catch { return null; }
}

Screens.canvas = function () {
  const root = el('div');
  const cv = STATE.kpiCanvas;
  if (!cv || !cv.kpis || !cv.kpis.length) {
    root.appendChild(header('KPI CANVAS', '04', 'KPI reference library unavailable.', null));
    root.appendChild(emptyState('KPI Canvas data could not be loaded.', 'kpi'));
    return root;
  }

  root.appendChild(header('KPI CANVAS', '04',
    'Complete measurement picture for a KPI — definition, formula, units, feasibility, and the data required to calculate it.',
    el('div', { class: 'badge badge--gen-ai' }, '📐 MEASUREMENT BLUEPRINT')));

  // --- KPI picker, grouped by value category ---
  const card = el('div', { class: 'card' });
  const pickerRow = el('div', { class: 'canvas-picker' });
  pickerRow.appendChild(el('label', { class: 'field-label' }, 'Select a KPI'));
  const sel = el('select', { class: 'field-select', id: 'canvasKpiSelect' });
  sel.appendChild(el('option', { value: '' }, '— Choose a KPI —'));

  const cats = cv.categories || {};
  const order = ['ISD', 'CC', 'DCS'];
  const groups = order.concat(Object.keys(cats).filter(c => !order.includes(c)));
  const seen = new Set();
  groups.forEach(code => {
    const inCat = cv.kpis.filter(k => k.valueCategory === code);
    if (!inCat.length) return;
    const label = (cats[code] && cats[code].name) || code;
    const og = el('optgroup', { label: `${label} (${code})` });
    inCat.forEach(k => {
      seen.add(k.id);
      og.appendChild(el('option', { value: k.id }, `${k.id} · ${k.name}`));
    });
    sel.appendChild(og);
  });
  const orphans = cv.kpis.filter(k => !seen.has(k.id));
  if (orphans.length) {
    const og = el('optgroup', { label: 'Other' });
    orphans.forEach(k => og.appendChild(el('option', { value: k.id }, `${k.id} · ${k.name}`)));
    sel.appendChild(og);
  }
  sel.value = STATE.selectedKpiId || '';
  sel.addEventListener('change', () => {
    STATE.selectedKpiId = sel.value || null;
    rerender();
  });
  pickerRow.appendChild(sel);
  card.appendChild(pickerRow);
  root.appendChild(card);

  const kpi = selectedCanvasKpi();
  if (!kpi) {
    const note = el('div', { class: 'canvas-placeholder' }, [
      el('div', { class: 'canvas-placeholder-icon' }, '📐'),
      el('div', { class: 'canvas-placeholder-text' },
        'Choose a KPI above to view its measurement canvas, or open one directly from the KPI Alignment screen.'),
    ]);
    root.appendChild(note);
    return root;
  }

  // --- Category banner ---
  const a = STATE.analysis;
  const bannerBits = [
    el('span', {}, [el('strong', {}, 'Category: '), kpi.valueCategoryName || '—']),
  ];
  if (a && a.primary) {
    bannerBits.push(el('span', { class: 'canvas-banner-sep' }, '·'));
    bannerBits.push(el('span', {}, [el('strong', {}, 'Primary: '), a.primary.name || '—']));
    if (a.secondary) {
      bannerBits.push(el('span', { class: 'canvas-banner-sep' }, '·'));
      bannerBits.push(el('span', {}, [el('strong', {}, 'Secondary: '), a.secondary.name]));
    }
  }
  if (kpi.source === 'dept') {
    bannerBits.push(el('span', { class: 'canvas-banner-sep' }, '·'));
    bannerBits.push(el('span', { class: 'canvas-dept-tag' }, 'DEPARTMENTAL KPI'));
  }
  root.appendChild(el('div', { class: 'canvas-banner' }, bannerBits));

  // --- Two-panel layout ---
  const grid = el('div', { class: 'canvas-grid' });

  // LEFT: KPI definition card
  const left = el('div', { class: 'card canvas-left' });
  left.appendChild(el('div', { class: 'canvas-kpi-title' }, `KPI: ${kpi.name}`));
  const rows = [
    ['What does it measure?', kpi.whatItMeasures],
    ['How is it calculated?', kpi.formula],
    ['Unit & Frequency', [kpi.unit, kpi.frequency].filter(Boolean).join('   ·   ')],
    ['Feasibility', kpi.feasibility],
  ];
  rows.forEach(([label, value]) => {
    const r = el('div', { class: 'canvas-def-row' });
    r.appendChild(el('div', { class: 'canvas-def-label' }, label));
    if (label === 'Feasibility' && value) {
      r.appendChild(el('div', {}, el('span', { class: 'feas-pill feas--' + value.toLowerCase() }, value)));
    } else {
      r.appendChild(el('div', { class: 'canvas-def-value' }, value || '—'));
    }
    left.appendChild(r);
  });
  grid.appendChild(left);

  // RIGHT: Data Required table
  const right = el('div', { class: 'card canvas-right' });
  right.appendChild(el('div', { class: 'canvas-right-title' }, 'Data Required'));
  const tbl = el('table', { class: 'data-req-table' });
  tbl.appendChild(el('thead', {}, el('tr', {}, [
    el('th', {}, 'Data Element'),
    el('th', {}, 'Description'),
    el('th', { style: 'width: 104px' }, 'Necessity'),
  ])));
  const tb = el('tbody');

  function necessityCell(req) {
    return el('td', {}, el('span', { class: 'necessity necessity--' + (req ? 'required' : 'optional') },
      req ? 'Required' : 'Optional'));
  }

  tb.appendChild(el('tr', {}, [
    el('td', { class: 'data-el' }, 'Definition'),
    el('td', {}, kpi.definition || '—'),
    necessityCell(true),
  ]));
  tb.appendChild(el('tr', {}, [
    el('td', { class: 'data-el' }, 'Data Source'),
    el('td', {}, kpi.suggestedSources || '—'),
    necessityCell(true),
  ]));
  const link = validHttpUrl(kpi.openDataLink);
  const linkCell = el('td', {});
  if (link) {
    linkCell.appendChild(el('a', { class: 'data-link', href: link, target: '_blank', rel: 'noopener noreferrer' }, link));
  } else {
    linkCell.appendChild(el('span', { class: 'data-muted' }, 'Not provided'));
  }
  tb.appendChild(el('tr', {}, [
    el('td', { class: 'data-el' }, 'Open Data Link'),
    linkCell,
    necessityCell(false),
  ]));
  tbl.appendChild(tb);
  right.appendChild(tbl);

  if (kpi.dataSourceType) {
    right.appendChild(el('div', { class: 'canvas-src-type' }, [
      el('span', { class: 'canvas-src-type-label' }, 'SOURCE TYPE'),
      el('span', { class: 'canvas-src-type-val' }, kpi.dataSourceType.replace(/_/g, ' ')),
    ]));
  }
  grid.appendChild(right);
  root.appendChild(grid);

  // --- Footer actions ---
  const actions = el('div', { class: 'canvas-actions' });
  actions.appendChild(el('button', { class: 'btn btn--ghost', onclick: () => navigate('kpi') }, '← Back to KPI Alignment'));
  actions.appendChild(el('button', {
    class: 'btn',
    onclick: () => { toast(`KPI "${kpi.name}" noted.`); navigate('risk'); },
  }, 'Confirm this KPI →'));
  root.appendChild(actions);

  return root;
};

// ---------- 05 RISK ANALYSIS ----------
Screens.risk = function () {
  if (!STATE.analysis) return emptyState('Run an analysis to see risk analysis.', 'input');
  const a = STATE.analysis;
  const root = el('div');

  root.appendChild(header('RISK ANALYSIS', '04',
    'Evaluating intent against municipal risk frameworks.',
    el('div', { class: 'badge badge--ai-inf' }, '◈ AI INFERENCE')
  ));
  // Sub-title row
  const subTitle = el('div', { class: 'screen-section-title' }, '⚠ Risk Analysis & Tolerance');
  root.appendChild(subTitle);

  const grid = el('div', { class: 'risk-grid' });

  // Left: Category Alignment
  const leftCol = el('div');
  leftCol.appendChild(el('div', { style: 'font-size: 12px; font-weight: 700; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 10px;' },
    'CATEGORY ALIGNMENT'));
  a.risks.forEach(r => {
    leftCol.appendChild(el('div', { class: 'risk-card' }, [
      el('div', { class: 'risk-card-title' }, r.name),
      el('div', { class: 'risk-card-rationale' }, r.rationale),
    ]));
  });
  grid.appendChild(leftCol);

  // Right: Tolerance Alignment Assessment
  const rightCol = el('div');
  rightCol.appendChild(el('div', { style: 'font-size: 12px; font-weight: 700; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 10px;' },
    'TOLERANCE ALIGNMENT ASSESSMENT'));
  a.risks.forEach(r => {
    const tolCls = `badge--tol-${(r.cityTolerance || 'Medium').toLowerCase()}`;
    rightCol.appendChild(el('div', { class: 'risk-tolerance-card' }, [
      el('div', { class: 'risk-tolerance-area' }, 'INTENT AREA'),
      el('div', { class: 'risk-tolerance-name' }, r.intentArea),
      el('div', { class: 'risk-tolerance-row' }, [
        el('span', { class: 'risk-tolerance-label' }, 'CITY TOLERANCE:'),
        el('span', { class: 'badge ' + tolCls }, r.cityTolerance || 'Medium'),
        el('span', { class: 'risk-verdict' }, '✓ ' + (r.toleranceVerdict || 'Aligned with Tolerance')),
      ]),
      el('div', { class: 'consultant-insight' }, [
        el('span', { class: 'consultant-insight-label' }, '✦ Consultant Insight'),
        r.consultantInsight || '—',
      ]),
    ]));
  });
  grid.appendChild(rightCol);
  root.appendChild(grid);

  const actions = el('div', { style: 'margin-top: 18px;' });
  actions.appendChild(el('button', {
    class: 'btn',
    onclick: () => navigate('story'),
  }, 'NEXT: SUCCESS STORY →'));
  root.appendChild(actions);

  return root;
};

// ---------- 05 SUCCESS STORY ----------
Screens.story = function () {
  if (!STATE.analysis) return emptyState('Run an analysis to draft a success story.', 'input');
  const a = STATE.analysis;
  const root = el('div');

  root.appendChild(header('SUCCESS STORY', '05', 'Draft a compelling narrative showcasing the impact of this initiative.', null));

  const card = el('div', { class: 'card' });
  card.appendChild(el('div', { class: 'screen-section-title' }, 'Success Story Builder'));

  const sections = [
    { key: 'challenge', label: 'THE CHALLENGE OR OPPORTUNITY', guiding: 'What problem was the initiative addressing? Was there a gap, inefficiency or opportunity?' },
    { key: 'initiative', label: 'THE INITIATIVE', guiding: 'What was implemented or improved? How was the challenge addressed?' },
    { key: 'outcome', label: 'THE OUTCOME', guiding: 'What changed as a result? Identify any measurable outcomes (quantitative or qualitative).' },
    { key: 'value', label: 'THE VALUE', guiding: 'Which Value Category does this align to? How does it contribute to the broader goal?' },
  ];

  const table = el('table', { class: 'story-table' });
  table.appendChild(el('thead', {}, el('tr', {}, [
    el('th', { style: 'width: 18%' }, 'Section'),
    el('th', { style: 'width: 26%' }, 'Guiding Question'),
    el('th', { style: 'width: 28%' }, 'Suggested'),
    el('th', { style: 'width: 28%' }, 'User Input'),
  ])));
  const tbody = el('tbody');
  STATE.storyUser = STATE.storyUser || {};
  sections.forEach(s => {
    const userVal = STATE.storyUser[s.key] || '';
    tbody.appendChild(el('tr', {}, [
      el('td', {}, el('span', { class: 'story-section-name' }, s.label)),
      el('td', {}, el('div', { class: 'story-guiding' }, '"' + s.guiding + '"')),
      el('td', {}, el('div', { class: 'story-suggested' }, a.storySuggested?.[s.key] || '—')),
      el('td', {}, el('textarea', {
        class: 'story-user-textarea',
        'data-key': s.key,
        oninput: (e) => { STATE.storyUser[s.key] = e.target.value; },
        html: userVal,
      })),
    ]));
  });
  table.appendChild(tbody);
  card.appendChild(table);
  root.appendChild(card);

  // Two-column generate panel + output
  const grid = el('div', { class: 'story-grid' });

  const leftCard = el('div', { class: 'card' });
  leftCard.appendChild(el('div', { class: 'screen-section-title' }, 'Generate Story'));
  STATE.storyMode = STATE.storyMode || 'combine';
  const modeGroup = el('div', { class: 'story-mode-group' });
  [
    { v: 'auto', label: 'BASED ON AUTO SUGGESTION' },
    { v: 'user', label: 'BASED ON USER INPUTS' },
    { v: 'combine', label: 'COMBINE BOTH' },
  ].forEach(opt => {
    const lbl = el('label', { class: 'story-mode-option' + (STATE.storyMode === opt.v ? ' selected' : '') }, [
      el('input', {
        type: 'radio',
        name: 'storyMode',
        value: opt.v,
        ...(STATE.storyMode === opt.v ? { checked: true } : {}),
        onchange: () => {
          STATE.storyMode = opt.v;
          modeGroup.querySelectorAll('.story-mode-option').forEach(n => n.classList.remove('selected'));
          lbl.classList.add('selected');
        },
      }),
      el('span', { class: 'story-mode-label' }, opt.label),
    ]);
    modeGroup.appendChild(lbl);
  });
  leftCard.appendChild(modeGroup);
  leftCard.appendChild(el('button', {
    class: 'btn btn--dark',
    onclick: async () => {
      try {
        toast('Generating story…');
        const res = await API.generateStory({ mode: STATE.storyMode, userInputs: STATE.storyUser });
        STATE.story = res.story;
        rerender();
        toast('Story generated.');
      } catch (e) { toast('Story error: ' + e.message); }
    },
  }, 'GENERATE STORY'));
  grid.appendChild(leftCard);

  const outCard = el('div', { class: 'card' });
  const outHeader = el('div', { class: 'story-output-header' }, [
    el('div', { class: 'screen-section-title', style: 'margin: 0;' }, 'Generated Output'),
    STATE.story ? el('button', {
      class: 'btn btn--ghost btn--small',
      onclick: () => {
        navigator.clipboard.writeText(STATE.story);
        toast('Copied to clipboard.');
      },
    }, '📋 COPY') : null,
  ]);
  outCard.appendChild(outHeader);
  outCard.appendChild(el('div', { class: 'story-output' },
    STATE.story || el('em', { style: 'color: var(--text-muted);' }, 'Click GENERATE STORY to draft the narrative.')
  ));
  grid.appendChild(outCard);

  root.appendChild(grid);

  const actions = el('div', { style: 'margin-top: 18px;' });
  actions.appendChild(el('button', {
    class: 'btn',
    onclick: () => navigate('summary'),
  }, 'NEXT: SUMMARY SNAPSHOT →'));
  root.appendChild(actions);

  return root;
};

// ---------- 06 SUMMARY SNAPSHOT ----------
Screens.summary = function () {
  if (!STATE.analysis) return emptyState('Run an analysis to generate a summary snapshot.', 'input');
  const a = STATE.analysis;
  const root = el('div');

  const actions = el('div', { class: 'summary-actions' }, [
    el('button', {
      class: 'btn btn--ghost btn--small',
      onclick: () => navigate('strategic'),
    }, '◈ VIEW STRATEGIC REASONING & DESIGN'),
    el('button', {
      class: 'btn btn--ghost btn--small',
      onclick: () => { window.location.href = API.exportUrl(); },
    }, '⤓ EXPORT DATA'),
    el('button', {
      class: 'btn btn--dark btn--small',
      onclick: async () => {
        if (!confirm('Clear current assessment and start a new one?')) return;
        await API.sessionReset();
        STATE.input = null; STATE.analysis = null; STATE.story = null;
        STATE.storyUser = {}; STATE.storyMode = 'combine';
        navigate('input');
      },
    }, '↻ NEW ASSESSMENT'),
  ]);
  root.appendChild(header('SUMMARY SNAPSHOT', '06', 'Executive Snapshot', actions));

  const card = el('div', { class: 'card' });
  // Rollup table
  const tbl = el('table', { class: 'summary-table' });
  tbl.appendChild(el('thead', {}, el('tr', {}, [
    el('th', {}, 'Initiative Title'),
    el('th', {}, 'Primary Value Category'),
    el('th', {}, 'Target KPIs'),
    el('th', {}, 'Risk Category'),
  ])));
  tbl.appendChild(el('tbody', {}, el('tr', {}, [
    el('td', { style: 'font-weight: 600;' }, STATE.input?.title || '—'),
    el('td', {}, a.primary?.name || '—'),
    el('td', {}, (a.kpis || []).slice(0, 2).map(k => k.name).join(', ')),
    el('td', {}, (a.risks || [])[0]?.name || '—'),
  ])));
  card.appendChild(tbl);

  // Narrative + scores grid
  const grid = el('div', { class: 'summary-grid' });

  const narrative = el('div', { class: 'narrative-card' });
  narrative.appendChild(el('div', { class: 'narrative-card-label' }, '✦ Strategic Narrative Synthesis'));
  narrative.appendChild(el('div', { class: 'narrative-card-body' },
    STATE.story || (STATE.analysis ? defaultNarrative() : '—')
  ));
  const tags = el('div', { class: 'narrative-tags' });
  if (STATE.input?.department) tags.appendChild(el('span', { class: 'narrative-tag' }, 'DEPT: ' + STATE.input.department));
  if (a.primary) tags.appendChild(el('span', { class: 'narrative-tag' }, 'PRIMARY: ' + (categoryCode(a.primary.id) || a.primary.name)));
  narrative.appendChild(tags);
  grid.appendChild(narrative);

  const scoreCol = el('div', { class: 'snapshot-scores' });
  const sc = a.scores || {};
  scoreCol.appendChild(scoreTile('IMPACT SCORE', sc.impact, "How well this initiative aligns with the city's key goals.", false));
  scoreCol.appendChild(scoreTile('AI LEVERAGE SCORE', sc.aiLeverage, 'How much AI & modern automation are currently used.', false));
  scoreCol.appendChild(scoreTile('FUTURE IMPACT (WITH AI)', sc.futureImpact, 'Potential score if fully utilizing AI and automation.', true));
  grid.appendChild(scoreCol);

  card.appendChild(grid);

  // AI & Automation Strategy Insight
  const insightCard = el('div', { class: 'insight-panel' });
  insightCard.appendChild(el('div', { class: 'insight-title' }, ['⚡', 'AI & Automation Strategy Insight']));
  insightCard.appendChild(el('div', { style: 'font-size: 13px; color: var(--text-secondary); line-height: 1.7;' },
    STATE.insight || '—'));
  card.appendChild(insightCard);

  root.appendChild(card);
  return root;
};

function defaultNarrative() {
  const a = STATE.analysis;
  return `${STATE.input?.title || 'This initiative'} maps primarily to ${a.primary?.name}. ` +
    `Recommended KPIs: ${(a.kpis || []).slice(0, 2).map(k => k.name).join(', ')}. ` +
    `(Generate the full story on screen 05 for a polished executive narrative.)`;
}

function scoreTile(label, value, helper, accent) {
  const tile = el('div', { class: 'score-tile ' + (accent ? 'score-tile--accent' : '') });
  tile.appendChild(el('div', { class: 'score-tile-label' }, label));
  tile.appendChild(el('div', { class: 'score-tile-value ' + (accent ? 'score-tile-value--accent' : '') }, [
    String(value != null ? value : '—'),
    el('span', { class: 'score-tile-value-suffix' }, '/100'),
  ]));
  tile.appendChild(el('div', { class: 'score-tile-helper' }, helper));
  return tile;
}

function categoryCode(id) {
  const c = STATE.refdata.categories.find(x => x.id === id);
  return c?.code || null;
}

// ---------- STRATEGIC ANALYSIS ----------
Screens.strategic = function () {
  if (!STATE.analysis) return emptyState('Run an analysis to view strategic reasoning.', 'input');
  const a = STATE.analysis;
  const root = el('div');

  root.appendChild(header('STRATEGIC ANALYSIS', null, 'AI Strategic Reasoning & Design',
    el('div', { class: 'badge badge--consultant' }, '◈ CONSULTANT LENS ANALYSIS')
  ));

  // AI Reasoning Audit
  root.appendChild(el('div', { class: 'screen-section-title' }, ['🧠', 'AI Reasoning Audit']));
  const auditGrid = el('div', { class: 'audit-grid' });
  (a.audit || []).forEach(c => {
    const card = el('div', { class: 'audit-card', style: `border-top-color: ${c.color || '#9ca3af'};` });
    card.appendChild(el('div', { class: 'audit-card-title' }, c.name));
    card.appendChild(el('div', { class: 'audit-card-rationale' }, '"' + c.rationale + '"'));
    auditGrid.appendChild(card);
  });
  root.appendChild(auditGrid);

  // Dynamic KPI Recommendations
  root.appendChild(el('div', { class: 'screen-section-title' }, ['📊', 'Dynamic KPI Recommendations']));
  const kpiGrid = el('div', { class: 'dynamic-kpi-grid' });
  (a.kpis || []).forEach(k => {
    const card = el('div', { class: 'dynamic-kpi-card' });
    card.appendChild(el('div', { class: 'dynamic-kpi-name' }, k.name));
    card.appendChild(el('div', { class: 'dynamic-kpi-row' }, [
      el('div', { class: 'dynamic-kpi-row-label' }, ['◷', 'DEFINITION']),
      el('div', { class: 'dynamic-kpi-row-value' }, k.definition || k.rationale || '—'),
    ]));
    card.appendChild(el('div', { class: 'dynamic-kpi-row' }, [
      el('div', { class: 'dynamic-kpi-row-label' }, ['◉', 'DATA SOURCE SUGGESTION']),
      el('div', { class: 'dynamic-kpi-row-value' }, k.dataSource || '—'),
    ]));
    card.appendChild(el('div', { class: 'dynamic-kpi-row' }, [
      el('div', { class: 'dynamic-kpi-row-label' }, ['ƒ', 'CALCULATION METHOD']),
      el('div', { class: 'dynamic-kpi-row-value' },
        el('span', { class: 'dynamic-kpi-row-value--code' }, k.calculation || '—')),
    ]));
    kpiGrid.appendChild(card);
  });
  root.appendChild(kpiGrid);

  // System Performance & Costing
  root.appendChild(el('div', { class: 'screen-section-title' }, ['⚙', 'System Performance & Costing']));
  const costGrid = el('div', { class: 'cost-grid' });

  const cur = STATE.lastUsage || {};
  const cumLatencyTxt = STATE.lastLatencyMs != null ? STATE.lastLatencyMs + 'ms' : '—';

  const curCard = el('div', { class: 'cost-card' });
  curCard.appendChild(el('div', { class: 'cost-card-title' }, 'Current Run Metrics'));
  curCard.appendChild(costRow('Prompt Tokens', cur.prompt_tokens || 0));
  curCard.appendChild(costRow('Response Tokens', cur.completion_tokens || 0));
  curCard.appendChild(costRow('Estimated Cost', '$' + (cur.estimated_cost_usd || 0).toFixed(4)));
  curCard.appendChild(costRow('Latency', cumLatencyTxt));
  curCard.appendChild(costRow('Model', cur.model || '—'));
  costGrid.appendChild(curCard);

  const cum = STATE.session?.cumulative || {};
  const cumCard = el('div', { class: 'cost-card cost-card--dark' });
  cumCard.appendChild(el('div', { class: 'cost-card-title' }, 'Cumulative Session Tracking'));
  cumCard.appendChild(costRow('Processed Initiatives', cum.processed_initiatives || 0));
  cumCard.appendChild(costRow('Total Prompt Tokens', cum.total_prompt_tokens || 0));
  cumCard.appendChild(costRow('Total Response Tokens', cum.total_completion_tokens || 0));
  cumCard.appendChild(costRow('Total Session Cost', '$' + (cum.total_session_cost_usd || 0).toFixed(4)));
  costGrid.appendChild(cumCard);

  root.appendChild(costGrid);

  // Drill-down link to Theory of Change.
  root.appendChild(el('div', { style: 'margin-top: 24px; text-align: right;' },
    el('button', { class: 'btn btn--dark', onclick: () => navigate('toc') },
      'VIEW DETAILED VALIDATION (THEORY OF CHANGE) →')
  ));
  return root;
};

// ---------- THEORY OF CHANGE ----------
const TOC_COLUMNS = [
  { key: 'context',    num: 1, label: 'CONTEXT',    icon: 'ⓘ',  color: '#6b7280' },
  { key: 'inputs',     num: 2, label: 'INPUTS',     icon: '📋', color: '#1e2761' },
  { key: 'activities', num: 3, label: 'ACTIVITIES', icon: '🔗', color: '#10b981' },
  { key: 'outputs',    num: 4, label: 'OUTPUTS',    icon: '⚡', color: '#2563eb' },
  { key: 'outcomes',   num: 5, label: 'OUTCOMES',   icon: '📈', color: '#f59e0b' },
  { key: 'impact',     num: 6, label: 'IMPACT',     icon: '🎯', color: '#ef4444' },
  { key: 'learning',   num: 7, label: 'LEARNING',   icon: '📖', color: '#8b5cf6' },
];

Screens.toc = function () {
  if (!STATE.analysis) return emptyState('Run an analysis to view the Theory of Change validation.', 'input');
  const a = STATE.analysis;
  const root = el('div');

  // Header strip: Return to board | Project ref | Validation pill
  const status = (a.validationStatus || 'PENDING').toLowerCase();
  const statusLabel = status === 'success' ? 'VALIDATION SUCCESS'
                       : status === 'failed' ? 'VALIDATION FAILED'
                       : 'VALIDATION PENDING';
  const headerStrip = el('div', { class: 'toc-header-strip' }, [
    el('button', {
      class: 'btn btn--ghost btn--small',
      onclick: () => navigate('summary'),
    }, '← RETURN TO STRATEGY BOARD'),
    el('div', { class: 'toc-header-strip-right' }, [
      el('div', { class: 'toc-project-ref' }, [
        el('div', { class: 'toc-project-ref-label' }, 'Project Reference'),
        el('div', { class: 'toc-project-ref-value' }, a.projectReference || 'OTT-GEN-0000-X00'),
      ]),
      el('span', {
        class: 'validation-pill validation-pill--' + status,
        title: 'Click to toggle validation status',
        onclick: async () => {
          // Cycle: PENDING → SUCCESS → FAILED → PENDING
          const next = status === 'pending' ? 'SUCCESS'
                       : status === 'success' ? 'FAILED'
                       : 'PENDING';
          try {
            const res = await fetch('/api/validate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: next }),
            }).then(r => r.json());
            STATE.analysis.validationStatus = res.validationStatus;
            toast('Validation status: ' + res.validationStatus);
            rerender();
          } catch (e) { toast('Validation error: ' + e.message); }
        },
      }, statusLabel),
    ]),
  ]);
  root.appendChild(headerStrip);

  // Theory of Change section title
  root.appendChild(el('div', { class: 'toc-section-title' }, [
    el('div', { class: 'toc-section-title-left' }, '🔗  Theory of Change'),
    el('div', { class: 'toc-section-title-right' }, 'Value Progression Model V2.1'),
  ]));

  const toc = a.theoryOfChange || {};
  const grid = el('div', { class: 'toc-grid' });
  TOC_COLUMNS.forEach(col => {
    const items = toc[col.key] || [];
    const card = el('div', { class: 'toc-col', style: `border-top-color: ${col.color};` });
    card.appendChild(el('div', { class: 'toc-col-icon' }, col.icon));
    card.appendChild(el('div', { class: 'toc-col-title' }, [
      el('span', { class: 'toc-col-num' }, col.num + '.'),
      col.label,
    ]));
    const list = el('ul', { class: 'toc-col-list' });
    items.forEach(item => {
      list.appendChild(el('li', { class: 'toc-col-item' }, [
        el('span', { class: 'toc-col-bullet', style: `background:${col.color}` }),
        el('span', {}, item),
      ]));
    });
    card.appendChild(list);
    grid.appendChild(card);
  });
  root.appendChild(grid);

  // Strategic Metrics block
  root.appendChild(el('div', { class: 'strategic-metrics-title' }, [
    el('div', { class: 'strategic-metrics-title-main' }, '📊  Strategic Metrics'),
    el('div', { class: 'strategic-metrics-title-sub' },
      'Recommended portfolio for ' + (STATE.input?.title || 'this initiative')),
  ]));

  const mg = el('div', { class: 'strategic-metrics-grid' });
  (a.kpis || []).forEach(k => {
    const linkedColumn = k.type === 'Quantitative' ? 'Outputs / Outcomes' : 'Outcomes / Impact';
    const card = el('div', { class: 'metric-card' });
    card.appendChild(el('div', { class: 'metric-card-name' }, k.name));
    card.appendChild(metricRow('Definition', k.definition || k.rationale || '—'));
    card.appendChild(metricRow('Data Source', k.dataSource || '—'));
    card.appendChild(metricRow('Calculation', k.calculation || '—'));
    card.appendChild(metricRow('Type', k.type || '—'));
    card.appendChild(el('span', { class: 'metric-card-link' },
      '↗ Linked to Theory of Change: ' + linkedColumn));
    mg.appendChild(card);
  });
  root.appendChild(mg);

  return root;
};

function metricRow(label, value) {
  return el('div', { class: 'metric-card-row' }, [
    el('div', { class: 'metric-card-label' }, label),
    el('div', { class: 'metric-card-value' }, value),
  ]);
}

function costRow(label, value) {
  return el('div', { class: 'cost-metric' }, [
    el('span', { class: 'cost-metric-label' }, label),
    el('span', { class: 'cost-metric-value' }, String(value)),
  ]);
}

// ---------- Helpers ----------
function emptyState(message, ctaScreen) {
  const root = el('div', { class: 'empty-state' });
  root.appendChild(el('div', { class: 'empty-state-icon' }, '◌'));
  root.appendChild(el('div', { class: 'empty-state-title' }, 'No analysis yet'));
  root.appendChild(el('div', { class: 'empty-state-body' }, message));
  if (ctaScreen) {
    root.appendChild(el('div', { style: 'margin-top: 20px;' },
      el('button', { class: 'btn', onclick: () => navigate(ctaScreen) }, 'GO TO INPUT →')
    ));
  }
  return root;
}
