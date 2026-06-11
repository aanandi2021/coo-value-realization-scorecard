# CoO Value Realization Scorecard

> **Use Case:** Contextual inference using LLM to help City of Ottawa project teams articulate value, propose KPIs, draft success stories, and align to strategic priorities.

## 🎯 Goal

Use an LLM to take **lightweight project inputs** (title, description, outcome — plus an open text box) and produce **four contextually-inferred outputs** that make value realization fast, consistent, and high-quality across all CoO initiatives.

## 🔄 Flow

```
USER INPUT                LLM            OUTPUTS
─────────                 ───            ───────
Project Title    ──┐                ┌──► VC (Value Category)
Description      ──┼──► [LLM ] ──┼──► KPI Suggestion
Outcome          ──┤              ├──► Success Story
Open Text        ──┘              └──► Alignment
```

See `docs/use-case-diagram.png` for the original spec diagram.

## 📤 The Four LLM Outputs

### 1. **VC — Value Category Matching**
- Match input context against **value category definitions**
- Return the category with the highest match %
- Surface top-N alternative categories with confidence scores

### 2. **KPI Suggestion**
- Given the recommended Value Category + input text, suggest **relevant KPIs from a KPI database**
- Output structure: KPI name, definition, unit, baseline expectation, why-it-fits

### 3. **Success Story**
- Generate a publishable success story showcasing initiative impact
- Includes: content moderation, grammatical correction, tone tuned for impact
- Multiple length variants (1-line headline, 1-paragraph exec summary, full narrative)

### 4. **Alignment**
- Match open text against **strategic & corporate priorities**
- Return best-fit alignment with rationale and supporting quotes from input

## 🗂️ Reference Data (needed)

- **Value Category definitions** — taxonomy + descriptions
- **KPI database** — KPI catalog with definitions, units, parent value categories
- **Strategic priorities** — CoO corporate strategy, departmental plans, council priorities

## 🏛️ Stakeholders

- **CIO Office** (Sandro Carlucci) — executive sponsor
- **CISCO** (Jason Barney) — security & governance alignment
- **Business / Initiative owners** — primary users (project leads filling in the form)
- **Microsoft team** — Amit Nandi (ATS) + CSAMs/SSPs

## 🔗 Related Projects

- `../CoO-311` — 311 Call Analyzer (LLM analysis pipeline pattern to reuse)
- `../CoO-FCS` — Fleet & Common Services analytics
- `../coo-analytics` — PEAK workbench, requirements, workshop artifacts

## 📅 Status

🌱 **New project** — use case captured. Scoping next steps:

- [ ] Confirm Value Category taxonomy source
- [ ] Locate / build KPI database
- [ ] Confirm strategic priorities document
- [ ] Decide UI pattern (single-page form + 4 result cards is a natural fit)
- [ ] Decide LLM (GitHub Models, same pattern as other CoO apps)

## 📝 Notes

- Created: 2026-05-20
- Owner: Amit Nandi
- Reference: `docs/use-case-diagram.png` (from CoO Ottawa team)
- Repository: TBD
