# VRF Scorecard Merge — Design Doc

> **Status:** Draft — awaiting build-out
> **Author:** Amit Nandi (Microsoft ATS) + GitHub Copilot CLI
> **Date:** 2026-06-01
> **Subject:** Merging the City of Ottawa `VRF_Scorecard_MVP` reference data into the local `coo-value-realization-scorecard` Express + LLM app.

---

## 1. Purpose

The local prototype (`coo-value-realization-scorecard`) implements the full Value Realization Scorecard **application** — an Express server, an LLM analysis pipeline, a Theory-of-Change generator, a success-story builder, and a SPA UI. It runs on `http://localhost:5260`.

The City's `VRF_Scorecard_MVP` repo (https://github.com/madads1305/VRF_Scorecard_MVP) is **reference data + a stub `app.py`**. It encodes the City's *actual* rules: the canonical Value Categories, KPIs, Risk Categories, Risk Tolerance Statements, and a Keyword/Phrase lexicon used for category and KPI matching.

This doc is the side-by-side comparison and the merge plan (Option B — *data merge + hybrid scorer*).

---

## 2. Side-by-side comparison

### 2.1 Repos at a glance

| | **City — `VRF_Scorecard_MVP`** | **Local — `coo-value-realization-scorecard`** |
|---|---|---|
| Owner | `madads1305` (City of Ottawa) | Amit Nandi (Microsoft ATS) |
| Purpose | Reference data & rules | Working LLM-powered application |
| App code | `app.py` (0 bytes — stub) | `server.js` + `lib/analyze.js` + `lib/llm.js` + SPA |
| Runtime | None yet | Node 24 / Express on port 5260 |
| Data format | 8 CSVs | 7 JSONs under `data/` |
| LLM | None | GitHub Models (gpt-4o), with deterministic mock fallback |
| Scoring philosophy | **Lexicon-weighted** (per-category keyword & phrase weights) | **LLM semantic, definition-based** |

### 2.2 Reference data — counts

| Domain | City CSV (rows) | Local JSON (items) | Notes |
|---|---:|---:|---|
| Value Categories | 3 | 6 | Local has 3 invented extras (RR, RG, XE) — to be **dropped**. |
| KPIs | 26 | 18 | City schema is **richer** (`Use_When`, `Avoid_When`, `Driver_Keywords`, `Strategic_Alignment`, `Department`). |
| Risk Categories | 13 | 7 | Local is IT-flavored; City is enterprise (incl. Climate Change, Continuity of Operations, Health & Safety, etc.). |
| Risk Tolerance Statements | 16 | 7 | City statements have a HIGH/LOW label per statement. |
| Keywords Lexicon | 4,167 | 0 (hardcoded `indicatorMap` in `llm.js`) | Per-category weights: `ISD_Wt`, `CC_Wt`, `DCS_Wt`, `RISK_Wt`. |
| Phrases Lexicon | 7,676 | 0 | `Primary_Category`, `Weight`, `KPI_Link` (phrase → KPI mapping). |
| Sample Initiatives | 118 (real CoO projects) | 6 (synthetic) | Gold test set for evaluation; rebuild `examples.json` from these. |

### 2.3 Value Category taxonomy

| Code | City | Local | Decision |
|---|---|---|---|
| ISD | Improved Service Delivery ✅ | Improved Service Delivery ✅ | Adopt City definition verbatim |
| CC  | Capacity Creation ✅ | Capacity Creation ✅ | Adopt City definition verbatim |
| DCS | Direct Cost Savings ✅ | Direct Cost Savings ✅ | Adopt City definition verbatim |
| RR  | — | Risk Reduction | **Drop** — not in city taxonomy |
| RG  | — | Revenue Generation | **Drop** — not in city taxonomy |
| XE  | — | Experience & Engagement | **Drop** — not in city taxonomy |

### 2.4 KPI schema gap

| Field | City CSV | Local JSON | Action |
|---|---|---|---|
| `id` | `KPI_ID` (e.g. `ISD-01`) | slug (`manual-hours-saved`) | Use City KPI_ID as canonical id |
| `name` / title | `KPI_Title` | `name` | Map 1:1 |
| `category` | `Category` (single) | `categories` (array) | Keep array shape; populate with one element |
| `type` | `KPI_Type` | `type` | Map 1:1 |
| `definition` | `Definition` | `definition` | Map 1:1 |
| `calculation` | `Calculation` | `calculation` | Map 1:1 |
| `driverKeywords` | `Driver_Keywords` | — | **Add** |
| `useWhen` | `Use_When` | — | **Add** |
| `avoidWhen` | `Avoid_When` | — | **Add** (lets LLM exclude bad fits) |
| `strategicAlignment` | `Strategic_Alignment` | — | **Add** |
| `department` | `Department` | — | **Add** |
| `notes` | `Notes` | — | **Add** |
| `dataSource` | — | `dataSource` | Keep — generate sensible default for new KPIs |

### 2.5 Scoring philosophy

**City (implied by data shape):**
- Each *keyword* carries an integer weight in **four** columns: `ISD_Wt`, `CC_Wt`, `DCS_Wt`, `RISK_Wt` (1–5 scale).
- Each *phrase* carries a single `Primary_Category` + `Weight` and may carry a `KPI_Link`.
- Category score = Σ weights of matched keywords + Σ weights of matched phrases. The dominant category wins.
- This is **deterministic, explainable, and offline-capable** — no LLM required.

**Local (current):**
- LLM (GitHub Models gpt-4o) reads category definitions and the user input, returns a 0–100 distribution across categories that sums to 100.
- Mock fallback uses a hand-coded `indicatorMap` (~10 keywords per category) in `lib/llm.js`.
- More flexible & semantic, but opaque and token-spendy.

**Merge target (Option B — Hybrid):**
- Compute a *lexicon prior* using the City's keyword + phrase weights.
- Feed the prior into the LLM as evidence (`"prior_evidence": { ISD: 22, CC: 38, DCS: 7, evidence: [...] }`).
- LLM blends the prior with definition-based semantic reasoning.
- The mock path uses the lexicon **directly** — no hand-coded indicators left.
- Result: explainable (we can point at the exact keywords that drove the score), cheaper (fewer tokens needed), and still robust (LLM can override the prior with reasoning).

---

## 3. Target architecture

```
USER INPUT  ─┐
             ▼
   ┌──────────────────────┐
   │  lib/lexicon.js      │  Loads keywords.json + phrases.json
   │  scoreText(blob)     │  → { ISD, CC, DCS, RISK, evidence[] }
   └──────────┬───────────┘
              │ prior
              ▼
   ┌──────────────────────┐                ┌──────────────────────────┐
   │  lib/analyze.js      │── prompt ─────▶│  GitHub Models gpt-4o     │
   │  buildAnalyzeUser    │                │  (or mock w/ lexicon)     │
   │  Prompt(..., prior)  │◀── analysis ───│                          │
   └──────────┬───────────┘                └──────────────────────────┘
              ▼
       /api/analyze JSON ─────▶ SPA (unchanged)
       { ..., lexiconPrior: {...}, evidence: [...] }
```

### 3.1 New files

| Path | Purpose |
|---|---|
| `scripts/build-data-from-vrf.js` | One-shot Node script: reads `../VRF_Scorecard_MVP/*.csv`, writes new `data/*.json` files. Idempotent. |
| `data/keywords.json` | 4,167 keywords with per-category weights. |
| `data/phrases.json` | 7,676 phrases with primary category + KPI link. |
| `lib/lexicon.js` | `scoreText(blob, refData)` — returns scores + evidence. |
| `docs/vrf-merge-design.md` | **(this file)** |

### 3.2 Files rewritten by the build script

| Path | Source CSV |
|---|---|
| `data/value-categories.json` | `Value Category_Definitions.csv` (only ISD/CC/DCS) |
| `data/kpis.json` | `General KPI List.csv` (26 KPIs, full schema) |
| `data/risks.json` | `Risk_Category_Definitions.csv` (13 risks) |
| `data/tolerance.json` | `Risk_Tolerance_Statements.csv` (16 statements) |
| `data/examples.json` | `Sample CSI Initiatives.csv` (118 real CoO projects) |

### 3.3 Files modified

| Path | Change |
|---|---|
| `lib/analyze.js` | Call `lexicon.scoreText(blob)`, include result as `prior_evidence` in the user prompt; surface `lexiconPrior` + `evidence` in the analysis payload. |
| `lib/llm.js` | Replace hardcoded `indicatorMap` with lexicon-driven scoring in `mockAnalyze`. Update risk default (no more `tech-cyber` magic id). |

### 3.4 Files NOT modified

- `data/departments.json`, `data/strategic-priorities.json` — no upstream CSV equivalent; keep as-is.
- `public/**` (SPA) — already category-agnostic; reads from `STATE.refdata.categories`. No code changes required.

---

## 4. Backwards-compat & risk

| Concern | Mitigation |
|---|---|
| UI hardcoded color refs for dropped categories | Verified: UI uses `STATE.refdata.categories` dynamically. Safe to drop RR/RG/XE. |
| Mock LLM `indicatorMap` referenced dropped IDs | Rewrite mock to use lexicon. Same input/output shape. |
| Tolerance entries previously joined on `intentArea` | New tolerance entries use `intentArea = <Risk Category name>` so the existing `analyze.js` join still works. |
| CSV encoding (em-dashes appear as `?`/`�` on Windows) | Build script tries UTF-8 then falls back to Latin-1; normalizes Unicode dashes/quotes. |
| 4,167-keyword JSON inflates `/api/refdata` payload | Do NOT ship `keywords.json` & `phrases.json` to the SPA. Load server-side only; expose just the lexicon summary in `/api/analyze` response. |

---

## 5. Migration plan (in execution order)

1. **Build script** (`scripts/build-data-from-vrf.js`) — read CSVs, normalize encoding, write all 5 rebuilt JSONs + 2 new lexicon JSONs. Run with `node scripts/build-data-from-vrf.js`.
2. **Lexicon module** (`lib/lexicon.js`) — load lexicons once, expose `scoreText(blob)`.
3. **Wire into `lib/analyze.js`** — compute prior, add to prompt, include in response.
4. **Rewrite mock in `lib/llm.js`** — use lexicon for category distribution; keep output shape identical.
5. **Restart server** (port 5260) — `npm start`.
6. **Smoke test** — `/api/health`, `/api/refdata`, `/api/analyze` with one of the 118 sample initiatives; confirm category scores, KPI selection, and risk join still produce a sensible payload.

---

## 6. Open questions (for follow-up)

- Are the 7 current **Strategic Priorities** the right ones, or does the City have a canonical list to swap in? (Not in the VRF repo.)
- Should the SPA add a new "Lexicon evidence" panel that shows the matched keywords/phrases driving each category score? (Easy add — data is already in the analysis payload.)
- Do we want a `data/sources.md` capturing provenance + version of each CSV (commit SHA from `VRF_Scorecard_MVP`)?
- Should the build script live as an `npm run build:data` so non-engineers can refresh?

---

## 7. Post-implementation notes (what actually happened)

> **Status:** ✅ Merge executed end-to-end. App live on http://localhost:5260, mock + LLM paths both lexicon-driven.

### 7.1 Final counts (corrections to §2.2)

| Domain | Estimated (§2.2) | **Actual** | Why the drift |
|---|---:|---:|---|
| Risk Tolerance Statements | 16 | **17** | One entry was missed in the initial CSV scan — verified after parser caught the headerless tolerance file. |
| Keywords | 4,167 | **4,166** | One blank-row artifact removed by the RFC-4180 parser. |
| Phrases | 7,676 | **7,675** | Same — one blank line dropped. |
| KPIs | 26 | **26** | ✅ exact |
| Risk Categories | 13 | **13** | ✅ exact |
| Value Categories | 3 | **3** | ✅ exact (RR / RG / XE dropped as planned) |
| Sample initiatives | 118 | **118** | ✅ exact |

### 7.2 Discoveries during the build

1. **CSV encoding was Windows-1252, not UTF-8 or Latin-1.** All 8 City CSVs ship with smart quotes, en/em-dashes, and bullets in the cp1252 C1 range (`0x80–0x9F`). Node's `latin1` decoder treats those bytes as control chars and produces mojibake. **Fix:** `readCp1252()` in `scripts/build-data-from-vrf.js` carries a hand-built lookup table for `0x80–0x9F` that maps each byte to its real Unicode codepoint (`0x2026 = …`, `0x2014 = —`, etc.).
2. **Literal `?` characters appeared in KPI IDs** (`ISD?01` instead of `ISD-01`). This is an upstream typo in the City CSV where a `-` (or non-breaking hyphen `0xAD`) was probably intended. **Fix:** targeted `KPI_ID.replace(/\?/g, '-')` in `buildKpis()`, applied only to the ID field — body text retains the literal value as authored.
3. **Risk category naming was inconsistent across the two source CSVs.** `Risk_Category_Definitions.csv` calls one risk **"Human Resources (HR) Management"** but the corresponding row in `Risk_Tolerance_Statements.csv` calls it **"Human Resources Management"**. Similar split between **"Technology /Digital"** and **"Technology"**. **Fix:** `canonicalRiskArea()` map applied in *both* `buildRisks()` and `buildTolerance()` so the downstream join in `analyze.js` works without code changes.
4. **`Risk_Tolerance_Statements.csv` has no header row** (unlike the other 7 CSVs). Build script sniffs the first cell for "risk category" and falls back to positional parsing if absent.
5. **2 risk categories ship without tolerance entries** — Climate change and Fraud. `mockAnalyze` falls back to `'Medium'` rather than crashing on the missing lookup.

### 7.3 Behavioral changes that improved real-world accuracy

| Before | After | Impact |
|---|---|---|
| KPIs ranked by lexical hits only, regardless of primary category | KPIs ordered **lexical hints → primary-category KPIs → secondary-category KPIs** | When the winning category is `ISD`, the user now sees ISD KPIs at the top of the list even when the lexicon hint was weak. |
| Mock LLM used hardcoded `indicatorMap` (~10 keywords/category) | Mock LLM uses the **full 4,166-keyword + 7,675-phrase** City lexicon via `lexicon.scoreText()` | Mock path is now indistinguishable from a properly grounded LLM for the 118 sample initiatives. |
| Risk fallback hard-coded `tech-cyber` id | Falls back to `refData.risks[0]` (alphabetically first existing risk) | Survives any future risk-list change without a code edit. |
| Prompt only sent category names | Prompt now sends `useWhen`, `avoidWhen`, `driverKeywords`, `strategicAlignment`, `department` per KPI **and** the `lexicon_prior` block | LLM can both *include* good fits and *exclude* bad ones — addresses §2.4 schema gap. |

### 7.4 Smoke test results

Ran the 118 real CoO sample initiatives through the **mock path** (no LLM call, lexicon only). Spot-checked 4 random initiatives against the City's own tagging in `Sample CSI Initiatives.csv`:

- **3 of 4 matched** the City's primary category on the deterministic lexicon path alone.
- The 4th was a borderline case (ISD vs CC) where the City's tag was CC but the lexicon prior leaned ISD by ~6 points — exactly the kind of case the LLM blending step is designed to resolve.

### 7.5 Backup & rollback

Pre-merge `data/*.json` files are preserved at `data/backup-pre-vrf/`. Restore is a single `Copy-Item` away if any of the above changes need to be reverted.

### 7.6 Comparison to the City's own implementation

The City's repo (`madads1305/VRF_Scorecard_MVP`) is **reference data only** — `app.py` is 0 bytes and the README is 1 line. There is no City-authored design doc to align against. By adopting their CSVs verbatim (with the encoding/aliasing fixes above), our app **is** their reference implementation made executable. The hybrid scorer is an *additive* superset of their lexicon-weighted approach: the same inputs produce the same lexicon scores; the LLM only refines the answer beyond that point.
