# Requirements — CoO Value Realization Scorecard

## 1. Purpose

Enable City of Ottawa project teams to articulate the value of an initiative by capturing a small set of inputs and using an LLM to infer five contextual outputs: a recommended Value Category, suggested KPIs, identified Risks, a polished Success Story, and alignment to strategic & corporate priorities.

**Primary audience:** project management teams who may not know which KPIs / metrics best fit their initiative. The tool surfaces relevant metrics from a curated library so they don't have to invent them.

**Positioning:** a **one-stop solution** that combines pre-work (initial analysis, value categorization, KPI inference, risk identification, alignment) with post-work (success-story narrative, executive snapshot, validation drill-down) in a single workflow.

---

## 1.5 Source of Requirements

This document is sourced from:

- The Gemini mockup screens (listed in §9 References)
- The engagement transcript captured in `ai-day-transcript.vtt` (cleaned: `ai-day-transcript.cleaned.txt`) — meeting with the City of Ottawa CMO team and Microsoft (Aditya Maddali, Eben Seaman, Stephen Rolleston, Amit Nandi)
- The existing City of Ottawa **Value Realization Framework (VRF)** — already in pilot rollout across departments
- An existing Power Apps prototype with an ~8,000-phrase manual keyword-matching scorecard (now being superseded by LLM inference for efficiency and coverage)

**Key engagement decisions captured from the transcript:**

- This product is named **"Value Realization Scorecard"** — positioned as a product, not a framework
- It is **Use Case 2** in the engagement (Use Case 1 = AI Day feedback report tool)
- The MVP will be a **standalone web app**, intentionally outside the regular 6–8 month IT intake process, used initially by a close team within the City Manager's Office (not org-wide at launch)
- The aspirational end-state target is the **Microsoft stack** — Dynamics / Power Platform / Dataverse / AI Foundry — with low-code / no-code generation eventually driven by GitHub Copilot
- The prototype is being built in the **GitHub Copilot ecosystem** so the resulting codebase is Microsoft-shop-compatible

---

## 2. User Inputs

The user shall provide:

- **Department** — dropdown selection of the department responsible for / leading this initiative
- **Project Title** — short, descriptive name (helper text: *"Provide a short, descriptive title for your proposal or project."*)
- **Description** — detail of current state, proposed changes, and methods used to achieve them
- **Expected Outcome** — tangible benefits, metrics, or qualitative improvements this initiative will deliver
- **Open Text Box** — free-form additional context (background, impact, anecdotes, metrics, quotes)

Each field should display **inline helper text** describing what to enter (see `docs/gemini-mockup-input.png`).

A **"Load Example Data"** button shall pre-fill all fields with a representative sample to support demos and first-time users.

All inputs feed a single LLM call (or coordinated set of calls) that produces the features below.

---

## 3. Architecture & AI Behavior

> **Desired AI Behavior:** Constrained, **Explainable** AI reasoning.
> See `docs/how-it-works-diagram.png` for the architecture diagram.

### 3.0 Value Realization Framework (VRF) — Organization-Wide 3-Category Rollup

The City of Ottawa VRF defines **three organization-wide value categories** that every initiative's outcome rolls up to for cross-departmental reporting:

| # | Rollup Category | Focus | Examples of outcomes |
|---|---|---|---|
| 1 | **Improved Service Delivery (ISD)** | **External** — residents-facing, customer experience, service quality | Reduced wait times, improved satisfaction, better service reliability |
| 2 | **Capacity Creation (CC)** | **Internal** — staff productivity, freed-up effort, process throughput | Manual hours saved, automation of repetitive work, faster cycle times |
| 3 | **Cost Avoidance / Cost Benefits (CA)** | **Continuous improvement** — direct savings or future cost avoidance | Reduced manual processing cost, avoided rework, optimized vendor spend |

The detailed Value Category taxonomy (e.g., Improved Service Delivery, Capacity Creation, Direct Cost Savings, Risk Reduction, Revenue Generation, Experience & Engagement) is the **operational catalog** used during analysis. Each detailed category **rolls up to one of the three org-wide categories** above so that portfolio-level reporting always aggregates against the standard 3.

Mapping of the operational catalog → org-wide rollup must be configurable in the Value Category reference dataset (a `rollup` field on each category).

### 3.1 Input Layer

- **User Inputs:** Title | Description | Outcome (+ open text)
- **Reference Inputs:**
  - Value Category definitions
  - **Risk definitions**
  - KPI library

### 3.2 AI Reasoning Layer

The reasoning layer shall:

- Compare text to definitions
- Identify **primary & secondary** Value Category
- **Identify relevant risks**

**Reasoning constraints (NOTE in source):**

- Matching is **definition-based** (semantic against the supplied definitions)
- **No keyword thresholds** — the model must not rely on keyword counts or surface-level heuristics
- The AI must **explain "why"** for every recommendation (rationale citing the definition and the supporting phrase from user input)

### 3.3 Output Layer

Two output groups:

- **Recommendations:**
  - Best-fit Value Categories (primary + secondary)
  - Relevant KPIs
  - Relevant Risks
- **Success Story:**
  - AI Narrative Generation
  - Clear impact articulation
  - Outcome-focused
  - Executive-friendly tone

### 3.4 Cross-cutting Requirements

- **Contextual reasoning** over user text
- **Comparison against definitions & KPI metadata**
- **Explainable recommendations** (every output carries a "why")
- **Human approval before final output** — outputs are drafts; a human reviewer approves before they become final/published
- **M365-native / governed AI services** — preference for Microsoft 365 / Azure AI / GitHub Models with enterprise governance (not unsanctioned third-party LLMs)

---

## 4. Features

### Feature 1 — Value Category Matching (VC)

- Match the context of the user input against **Value Category definitions** from a configured taxonomy.
- Recommend the **Value Category with the highest match %**.
- Return:
  - Top recommended category
  - Match % / confidence score
  - Top N alternative categories with their match scores
  - Rationale for the recommendation (short)

### Feature 2 — KPI Suggestion

- Based on the **recommended Value Category** and the **input text**, suggest relevant KPIs from a configured **KPI Database**.
- The KPI Database has **two layers**:
  - **Generic / standardized KPIs** — applicable org-wide (e.g., Average Resolution Time, Customer Satisfaction Score)
  - **Department-customized KPIs** — specific to a department's data inventory and operating context
- The suggestion engine should prefer department-customized KPIs when a department is selected, falling back to generic KPIs otherwise.
- **MVP scope clarification:** the tool **does NOT calculate KPIs** or connect to live data sources. It points to where the data lives (data source suggestion) and how the calculation would be performed (calculation method) so the project team can take it forward as part of their normal project methodology.
- Return:
  - List of suggested KPIs (ranked)
  - For each KPI: name, definition, unit of measure, why-it-fits this initiative, **data source suggestion**, **calculation method**
  - Optionally: baseline value / target hint if inferable from input

### Feature 3 — Success Story

- Create a **success story** showcasing the impact of the initiative based on the content provided in the open text input.
- **Tone:** the LLM shall use the **tone of a process consultant** maximizing the impact of the story so that **residents can make sense of it in plain, "commonized" language** — avoid jargon, acronyms, and overly technical phrasing that obscure the value.
- Requirements for output:
  - Content moderation (remove sensitive/inappropriate content)
  - Grammatical correction
  - Tone tuned to **create impact** (compelling, executive-ready, resident-readable)
- Provide multiple length variants:
  - 1-line headline
  - Short exec summary (1 paragraph)
  - Full narrative (multi-paragraph)

### Feature 4 — Alignment

- Using the open text inputs, **match against a list of strategic and corporate priorities** and suggest the **best fit alignment**.
- Return:
  - Best-fit strategic priority
  - Confidence / match score
  - Top N alternatives
  - Rationale and supporting phrases from the user input

### Feature 5 — Risk Identification

- Based on input text and the **Risk definitions** reference, identify **relevant risks** to the initiative.
- Return:
  - Ranked list of relevant risks
  - For each risk: name, definition, why-it-applies (rationale citing supporting phrases from input)
  - Optional severity / likelihood hint if inferable

---

## 5. Reference Data (Configurable)

The system depends on five external/configured datasets:

| Dataset | Purpose | Owner |
|---|---|---|
| **Value Category Definitions** | Taxonomy + descriptions for Feature 1, including the **rollup mapping** to the 3 org-wide VRF categories (see §3.0) | CoO Value Realization team |
| **KPI Database / Library** | Catalog of KPIs (incl. type Quantitative/Qualitative), definitions, units, parent value categories, **department scope** (generic vs. department-customized), data source hints, and calculation methods — used by Feature 2 | CoO Value Realization team |
| **Risk Definitions** | Risk taxonomy + descriptions for Feature 5 | CoO Risk / Value Realization team |
| **City Tolerance Framework** | Per risk area, the City's defined tolerance level (Low/Medium/High) used for Risk Analysis tolerance alignment — **per-department** statements supported | CoO Risk team |
| **Strategic & Corporate Priorities** | Council priorities, departmental plans for Feature 4 | CoO Strategy / CIO Office |

These must be **swappable without code changes** (e.g., JSON / CSV / Excel config files).

**Out of MVP scope:** live calculation of KPI values from data sources, automated retrieval from departmental systems, and live data-portal integration. The reference data above is used solely to inform recommendations and point the user toward where the data lives — not to compute results.

---

## 6. Non-Functional Requirements

- **LLM:** GitHub Models or M365-native / governed AI services (Azure OpenAI, Copilot) — no unsanctioned third-party LLMs
- **Explainability:** every output carries a "why" (definition + supporting phrase from input); the Strategic Analysis screen surfaces the full reasoning audit across all categories (winners AND non-winners). The reasoning audit also serves a **model fine-tuning feedback loop** — i.e., reviewers can flag inaccurate reasoning to inform future model adjustments.
- **Human-in-the-loop:** all AI outputs are **drafts** requiring **human approval** before being treated as final
- **Latency:** target sub-10s for all outputs combined; surface live latency in the UI (e.g., footer indicator)
- **Auditability:** persist input + output + reviewer decision for every run (with timestamp and user) — *for the full deployment;* see MVP scope below
- **Cost transparency:** display per-run token usage and estimated cost (Strategic Analysis → System Performance & Costing); accumulate session-level totals
- **Privacy:** no PII storage by default; content moderation on Success Story output
- **Export:** support `EXPORT DATA` from the Summary Snapshot (format TBD: JSON for re-import + PDF/Excel for sharing); future — **`EXPORT TO SHAREPOINT LIST`** button to push the summary into a configurable SharePoint list for portfolio tracking
- **State management:** `NEW ASSESSMENT` resets the workflow cleanly; assessments may optionally persist for later review
- **UI:** branded "VALUE REALIZATION SCORECARD" with `v` logo; dark left navigation; light content area; explicit "Approve / Edit / Reject" controls on outputs (Clawpilot theme aligned)
- **System status:** left-rail "System Health" indicator + latency readout (e.g., *"LATENCY: 14ms"*) for transparency
- **Deployment:** localhost demo first, port TBD (suggest 5260); production path — **standalone internal web app** for close-team use (see §6.1)

### 6.1 MVP Scope & Lifecycle

The product will be released **in stages**. The constraints in this subsection apply to the **MVP only** unless promoted otherwise.

**In MVP scope:**

- Single-page web app, no authentication required for the demo (Entra ID assumed for the internal pilot)
- **One-time use, no persistence** beyond the in-memory session — submit inputs, receive analysis, export the snapshot, walk away
- Stable reference data: the KPI database + Value Category definitions + Risk taxonomy are the only persistent backend stores; they are versioned and updated by the Value Realization team out-of-band
- Data-source suggestions are **directional only** (the tool tells you *where* the data lives — it does **not** retrieve, compute or display KPI values)
- LLM-backed reasoning with deterministic mock fallback for demos without a live key
- Snapshot export (JSON for re-import; PDF/PPTX/Excel formats TBD)

**Out of MVP scope (future):**

- Live calculation of KPI values from departmental systems / open-data-portal / Dataverse
- Portfolio-level rollup across many initiatives
- SharePoint list integration for export (planned next iteration)
- Power Platform / Dynamics / Dataverse-native rebuild (aspirational end-state)
- AI Foundry-hosted models replacing GitHub Models (aspirational end-state)
- Multi-step approval workflow with assignable reviewers

### 6.2 Usage Governance & Cost Model

To support the MVP being deployed **outside** the standard 6–8 month IT intake process — and to give the sponsoring department clear accountability over LLM spend — the system shall implement a **pre-paid credit / usage counter** model:

- **Usage counter (visible in UI):** total runs to date, total tokens, total estimated cost, **credits remaining**
- **Credit configuration:** a department/sponsor purchases a budget (e.g., `$100 of credit = ~N runs at the current model price`); the system blocks new runs (with a clear message) once credits are exhausted
- **Budget alarms:** soft warning at 75% utilization, hard stop at 100%
- **Telemetry persisted:** for each run — timestamp, run id, tokens (prompt + completion), estimated cost, model used, mode (live vs. mock)
- **Expected usage envelope** (planning assumption from the engagement): up to ~1,000 users per year, ~10,000 total runs over the product lifetime — actual numbers should be confirmed with the sponsor
- **Rationale:** the LLM cost itself is small relative to a custom-built web app's development and maintenance cost; surfacing the counter is primarily for **accountability and business-case defensibility**, not because LLM use is expected to be expensive

### 6.3 Legacy Approach (Context)

For background — the prior CoO prototype matched initiative text against an **~8,000-phrase keyword/phrase library with weighted-average scoring** built in Excel + Power Apps. That approach was constrained by (a) the limit on phrases a single author can hand-curate, and (b) sensitivity to exactly how users phrased their input. The current LLM-inference approach **replaces** that scoring layer; the keyword library is **not** carried forward.

---

## 7. UI / Navigation Structure

Per the Gemini mockups (`docs/gemini-mockup-input.png`, `docs/gemini-mockup-input-filled.png`), the app uses a **left-rail navigation** with the following sections in order:

1. **01 INPUT** — capture Department, Title, Description, Expected Outcome (+ open text); "Load Example Data" affordance
2. **02 SCORECARD** — overall scorecard view (best-fit value categories, scores, "why")
3. **03 KPI ALIGNMENT** — suggested KPIs with definitions and fit rationale
4. **04 RISK ANALYSIS** — identified risks with definitions and rationale
5. **05 SUCCESS STORY** — AI-generated narrative (headline / exec summary / full)
6. **06 SUMMARY SNAPSHOT** — one-page rollup suitable for sharing
7. **STRATEGIC ANALYSIS** — alignment to strategic & corporate priorities

**Header:** "VALUE REALIZATION SCORECARD" brand bar with `v` logo (dark blue).

**Header right side (persistent):**
- **VALUE SCORE** — live numeric score (e.g., `105`) that updates as inputs are added / re-analyzed; gives the user immediate feedback on initiative strength
- **NEXT STEP** button — primary CTA to advance to the next section in the flow

**Footer (left rail):** **System Health** indicator + **Latency** readout (e.g., *"LATENCY: 14ms"*).

### 7.1 Example Data (for demo + first-time users)

"Load Example Data" pre-fills all fields with a realistic CoO scenario. Reference example (from mockup):

- **Department:** Public Works
- **Title:** "Strategically optimized Roads MMS Mobility Project"
- **Description:** *"CURRENT STATE ANALYSIS: In its last phase of implementation, the new automated work management process leverages technology (SAP Fiori). It empowers field staff by giving them the technology to stay in the field to complete their paperwork. Our strategic objective is to roads mms mobility project leveraging automated workflow triggers and real-time performance analytics."*
- **Expected Outcome:** *"MEASURABLE IMPACT: Anticipate improved time management, workflow and management reporting, and consistent work management. Eliminating redundant administrative layers and establishing a single source of truth for departmental data."*

Multiple example datasets should be available (rotating or selectable) covering different CoO departments and initiative types.

### 7.2 Scorecard Screen (`02 SCORECARD`)

Per `docs/gemini-mockup-scorecard.png`:

- Header: `SCORECARD .02` plus an **"AI Contextual Inference"** badge (top-right of content area) confirming the recommendations are LLM-derived.
- **Scorecard table** with three columns:
  - **Value Category** — the candidate from the taxonomy
  - **Context Match %** — confidence score (numeric, e.g., `86%`)
  - **Alignment** — label: `PRIMARY` | `SECONDARY` | *(blank for 0%)*
- Each row has a **progress bar** beneath it, color-coded:
  - Green = PRIMARY
  - Amber/Orange = SECONDARY
  - Empty/gray = 0%
- The PRIMARY row is **visually highlighted** (e.g., soft yellow background) so the recommendation is unmistakable.
- All categories from the taxonomy are listed (not just top matches) so the user sees the full distribution. Example from mockup:
  - Capacity Creation — 86% — PRIMARY
  - Direct Cost Savings — 14% — SECONDARY
  - Improved Service Delivery — 0%
- **Suggested KPIs** section beneath the table — preview of top KPIs with a green check icon. Example: *Manual Processing Hours Saved (Monthly)*, *Employee Productivity & Effort Score*. Full KPI detail lives in the `03 KPI ALIGNMENT` screen.
- **Primary CTA** at the bottom of the panel: `NEXT: KPI ALIGNMENT →` (label adapts to whichever screen is next).
- **"How this is calculated"** explainer card at the very bottom — required for explainability:

  > *This system uses **LLM-powered contextual inference** to map the intent of your open-text descriptions and outcomes against standard value category definitions. It doesn't just look for exact keywords; it understands the semantic meaning of your initiative and calculates the confidence of alignment (Context Match %) to recommend the most strategically relevant category and KPIs.*

  Every output screen shall include an analogous "How this is calculated" panel reinforcing the explainability principle.

### 7.3 KPI Alignment Screen (`03 KPI ALIGNMENT`)

Per `docs/gemini-mockup-kpi-alignment.png`:

- Header: `KPI ALIGNMENT .03` — subtitle `KPI ALIGNMENT (WEB-ENHANCED)` to indicate that the KPI recommendations can be **enriched with web/research sources**, not only the static KPI library.
- Top-right badge: **"GENERATIVE AI ASSISTED"** (amber) — signals AI involvement.
- **Target Department** dropdown — defaults to the department chosen on Input but is editable.
- **Primary Value Alignment** display (right side of header) — surfaces the previous screen's outcome for context: e.g., *"Capacity Creation"* with *"Secondary: Direct Cost Savings"* below.
- **KPI table** with four columns:
  - **KPI Selection** — KPI name + a colored ribbon tag: `PRIMARY RECOMMENDATION` (blue) or `SECONDARY RECOMMENDATION` (green)
  - **Alignment** — which value category the KPI maps to (can be combined, e.g., *"Capacity Creation / Experience"*)
  - **Definition / Context** — short rationale (e.g., *"Algorithmically selected based on stated structural outcome."*, *"Provides balancing qualitative context to primary metric."*)
  - **Type** — `QUANTITATIVE` | `QUALITATIVE`
- **Manual KPI Selection** rows — two (or more) additional rows with `-- Manual KPI Selection --` dropdowns that let the user pick KPIs from the full library beyond the AI's recommendations.
- The screen supports the human-in-the-loop principle: AI proposes, human curates.

### 7.4 Risk Analysis Screen (`04 RISK ANALYSIS`)

Per `docs/gemini-mockup-risk-analysis.png`:

- Header: `RISK ANALYSIS .04` with a ⚠ icon and title **"Risk Analysis & Tolerance"**.
- Subtitle: *"Evaluating intent against municipal risk frameworks."* — the risk evaluation is **city-specific** (uses CoO risk frameworks / tolerance definitions).
- Top-right badge: **"AI INFERENCE"** (red/coral) — distinct color from the green/amber badges to emphasize this is risk-related AI output.
- **Two-column layout:**
  - **Category Alignment** (left): card per identified risk category. Each card shows:
    - Risk category name (e.g., *Technology & Cybersecurity Risk*)
    - Short rationale (e.g., *"The initiative involves handling systems or data, increasing exposure to cyber threats or privacy breaches."*)
  - **Tolerance Alignment Assessment** (right): for each risk area, evaluate alignment to the City's defined tolerance. Each card shows:
    - **INTENT AREA** (e.g., *Data Privacy & Cybersecurity*)
    - **CITY TOLERANCE** label — `Low` / `Medium` / `High` with a colored pill (red for Low tolerance, etc.)
    - **Tolerance verdict** — `✓ Aligned with Tolerance` (green badge) or a warning equivalent if misaligned
    - **CONSULTANT INSIGHT** — AI-generated short prescriptive guidance in italics (e.g., *"The City maintains a LOW tolerance for cyber-risk; ensure robust validation gates are maintained."*)

This screen requires an additional **City Tolerance Framework** reference dataset (see Reference Data table).

### 7.5 Success Story Screen (`05 SUCCESS STORY`)

Per `docs/gemini-mockup-success-story.png`:

- Header: `SUCCESS STORY .05` — section title **"SUCCESS STORY BUILDER"**, subtitle *"Draft a compelling narrative showcasing the impact of this initiative."*
- **Structured story builder table** with four columns: `SECTION` | `GUIDING QUESTION` | `SUGGESTED` | `USER INPUT`. Four rows:

| Section | Guiding Question | Suggested (auto-extracted) | User Input |
|---|---|---|---|
| THE CHALLENGE OR OPPORTUNITY | "What problem was the initiative addressing? Was there a gap, inefficiency or opportunity?" | Auto-extracted from CURRENT STATE ANALYSIS in description | Free-text |
| THE INITIATIVE | "What was implemented or improved? How was the challenge addressed?" | Auto from Title | Free-text |
| THE OUTCOME | "What changed as a result? Identify any measurable outcomes (quantitative or qualitative)." | Recommended KPIs from `03 KPI ALIGNMENT` (e.g., Manual Processing Hours Saved, Employee Productivity & Effort Score) | Free-text |
| THE VALUE | "Which Value Category does this align to? How does it contribute to the broader goal?" | "AI mapped this to {VC} because: {rationale}" | Free-text |

  The `SUGGESTED` column shows what AI extracted/inferred; the user keeps full control via `USER INPUT`.

- **Generate Story** panel (left card) — three mutually-exclusive modes:
  1. **BASED ON AUTO SUGGESTION** — pure AI from the Suggested column
  2. **BASED ON USER INPUTS** — pure human from the User Input column
  3. **COMBINE BOTH** (default selection) — AI merges both for richest narrative
- **Generated Output** panel (right card) — shows the final narrative with:
  - Title of the initiative as heading
  - The story body (executive-friendly tone, outcome-focused, content-moderated)
  - A **COPY** action to clipboard
  - (Future) length-variant toggle: headline / paragraph / full
- Story shall be **regenerable** — user can switch modes and re-run without losing inputs.

### 7.6 Summary Snapshot Screen (`06 SUMMARY SNAPSHOT`)

Per `docs/gemini-mockup-summary-snapshot.png`:

- Header: `SUMMARY SNAPSHOT .06` — section title **"EXECUTIVE SNAPSHOT"**.
- **Header action buttons** (right of title):
  - `VIEW STRATEGIC REASONING & DESIGN` — jumps to Strategic Analysis section
  - `EXPORT DATA` — downloads the assessment (format TBD: JSON / Excel / PDF)
  - `EXPORT TO SHAREPOINT LIST` *(future)* — appends the snapshot to a configured SharePoint list for portfolio tracking
  - `NEW ASSESSMENT` (dark primary) — clears state and returns to Input
- **Summary table** (one-row, four columns) — top-line rollup:
  `INITIATIVE TITLE` | `PRIMARY VALUE CATEGORY` | `TARGET KPIS` | `RISK CATEGORY`
- **Strategic Narrative Synthesis** card (dark navy background) — the final exec-ready narrative (from Success Story screen) plus department + value-category tags (e.g., `DEPT: PWD`, `PRIMARY: CC`).
- **Right-side scorecards** — three vertically stacked KPI tiles:
  1. **IMPACT SCORE** — `nn/100` — *"How well this initiative aligns with the city's key goals."*
  2. **AI LEVERAGE SCORE** — `nn/100` — *"How much AI & modern automation are currently used."* — *(optional / forward-looking metric; intended to inform future-project planning rather than score the current initiative)*
  3. **FUTURE IMPACT (WITH AI)** — `nn/100` (highlighted accent) — *"Potential score if fully utilizing AI and automation."*
- **AI & AUTOMATION STRATEGY INSIGHT** panel — prescriptive recommendation paragraph generated by the LLM:
  > *"Significant opportunity exists to introduce Robotic Process Automation (RPA) or Large Language Models (LLMs) to streamline data ingestion and reduce manual touchpoints. Enhancing automation would accelerate service delivery SLAs and drive further direct cost savings."*

The Summary Snapshot is the **share-out artifact** — designed to be exported or screenshotted for executive briefings.

### 7.7 Strategic Analysis Screen (`STRATEGIC ANALYSIS`)

Per `docs/gemini-mockup-strategic-analysis.png`:

- Header: `STRATEGIC ANALYSIS` — section title **"AI STRATEGIC REASONING & DESIGN"** with a top-right **"CONSULTANT LENS ANALYSIS"** badge.
- This screen is the **deep-explainability view** — answers "why" for every recommendation in one place.

**Three subsections:**

1. **🧠 AI REASONING AUDIT** — one card per Value Category in the taxonomy, each with a top color stripe (matches the scorecard color coding):
   - Card title = Value Category name
   - Body = AI rationale, including **why a category was NOT picked** (e.g., *"Not a primary driver for this initiative based on intent mapping."*) as well as why others were picked (*"Mapped to this category because the use of terms like 'time' indicates a desire to reduce manual burden..."*).
   - This is critical for explainability — users see the AI's full reasoning across the taxonomy, not just the winner.

2. **📊 DYNAMIC KPI RECOMMENDATIONS** — one card per recommended KPI with:
   - KPI name (heading, blue)
   - **DEFINITION** — what the KPI measures, tied back to this initiative
   - **DATA SOURCE SUGGESTION** — where to source the data (e.g., *Departmental Performance Tracker*, *Post-Service Survey / Feedback Portal*, *Workflow Audit Logs*)
   - **CALCULATION METHOD** — formula string in monospace (e.g., `Total Count / Total Period (Monthly)`, `(Positive Responses / Total Responses) * 100`, `Avg(New Process Time) - Avg(Old Process Time)`)

3. **⚙️ SYSTEM PERFORMANCE & COSTING** — telemetry and cost transparency for governance/audit:
   - **CURRENT RUN METRICS** (light card): `PROMPT TOKENS`, `RESP. TOKENS`, `EST. COST` — for the current assessment
   - **CUMULATIVE SESSION TRACKING** (dark card): `PROCESSED INITIATIVES`, `TOTAL SESSION COST` — rollup for the user's session
   - **CREDIT / BUDGET METER** *(see §6.2)* — `RUNS USED`, `CREDITS REMAINING`, `% BUDGET CONSUMED` with soft-warning / hard-stop thresholds

This screen makes the system's reasoning **and** its operational cost visible — both required for governed AI deployment. It also serves as the **model fine-tuning feedback loop**: reviewers can flag inaccurate reasoning so the prompt / model / definitions can be tuned over time.

### 7.8 Theory of Change & Strategic Metrics (Detailed Validation View)

Per `docs/gemini-mockup-theory-of-change.png`:

This is the **detailed validation drill-down** for a fully analyzed initiative — accessible from the Summary Snapshot via `VIEW STRATEGIC REASONING & DESIGN` (or as a dedicated sub-view of Strategic Analysis).

**Header strip (sticky / top of view):**
- `← RETURN TO STRATEGY BOARD` — back-link to the Summary Snapshot / portfolio view
- **PROJECT REFERENCE** — generated initiative identifier in the form `OTT-{DEPT-CODE}-{YEAR}-{SEQ}` (e.g., `OTT-VRF-2026-F01`). Required for portfolio-level rollup and citation.
- **VALIDATION STATUS** pill — `● VALIDATION SUCCESS` (green) | `● VALIDATION PENDING` (amber) | `● VALIDATION FAILED` (red). Status reflects whether the AI outputs have been human-approved per the human-in-the-loop NFR.

**Section: 🔗 THEORY OF CHANGE** — 7-column logic model that maps the full initiative journey end-to-end:

| # | Column | Icon | Color stripe | Content |
|---|---|---|---|---|
| 1 | **CONTEXT** | ⓘ | gray | Current-state problems, gaps, pain points (e.g., *"Predominantly reactive maintenance cycle resulting in unexpected failures"*) |
| 2 | **INPUTS** | 📋 | navy | Resources, hardware, software, people invested (e.g., *"IoT telematics hardware for city fleet vehicle installation"*) |
| 3 | **ACTIVITIES** | 🔗 | green | Concrete actions taken (e.g., *"Deploying IoT sensors across specialized and heavy-duty city vehicles"*) |
| 4 | **OUTPUTS** | ⚡ | blue | Direct deliverables — what is produced (e.g., *"Centralized real-time vehicle health and location dashboard"*) |
| 5 | **OUTCOMES** | 📈 | amber | Short-/medium-term changes — what improves (e.g., *"Significant shift from reactive to proactive maintenance schedules"*) |
| 6 | **IMPACT** | 🎯 | red | Long-term, citizen-facing value (e.g., *"Enhanced public safety and service reliability for Ottawa residents"*) |
| 7 | **LEARNING** | 📖 | purple | Insights, optimization, future iteration (e.g., *"Identification of specific vehicle models with high failure frequencies"*) |

Each column is rendered as a card with:
- Color stripe at top (matches the table above)
- Centered icon
- Column number + label
- Bulleted list of items (bullet dots colored to match the stripe)

Right-side caption: **"VALUE PROGRESSION MODEL V2.1"** — indicates which version of the Theory of Change model was used to generate the breakdown.

**Section: 📊 STRATEGIC METRICS — Recommended Portfolio for {Initiative}**

A more detailed restatement of the recommended KPIs from `03 KPI ALIGNMENT`, scoped to this specific validated initiative. Each metric is presented as a card with:
- Metric name
- Definition / what it tells us
- Target / baseline (if known)
- Data source
- Calculation method
- Linkage to the THEORY OF CHANGE columns it supports (Outputs vs. Outcomes vs. Impact)

This view is the **board-ready / council-ready artifact** — designed to support program approval, validation reviews, and benefits-realization tracking. It must be exportable as PDF.

**AI Behavior for this view:**
- The 7-column theory of change is **LLM-derived** from the user inputs + analysis (not hand-entered) but is **fully editable** by the human reviewer before validation
- `VALIDATION SUCCESS` is set only after a human approves — never automatically
- The project reference (`OTT-...`) is generated once the assessment is saved/validated

> **Distinction from §7.9:** §7.8 is the **detailed validation view** of an *already-analyzed* initiative — a board-ready artifact. §7.9 below is a separate **upstream KPI-development template** that produces *new candidate KPIs* to add to the KPI database.

### 7.9 Theory of Change Template — KPI Development Tool (Companion Mini-Tool)

A **companion mini-tool** (separate workflow / page) used by the Value Realization team to **develop new KPIs** that are then added to the KPI Database backing the Scorecard's KPI Alignment screen.

**Purpose:** when an initiative needs a metric that doesn't exist in the standard catalog, this tool helps an analyst draft candidate KPIs that follow CoO's Theory-of-Change logic.

**Inputs (simpler than the main Scorecard):**

- **Problem / Context** — the situation the initiative addresses
- **Solution** — what is being implemented
- **Outputs** — direct deliverables (what is produced)
- **Impact** — the intended long-term value

**Output:**

- **Strategy Metrics** — exactly **5 candidate KPI options** the LLM proposes based on the inputs, each with name, definition, suggested unit, suggested data source, and a short rationale tying it back to the Theory-of-Change inputs.

**Workflow integration:**

- Analyst reviews / edits the 5 candidates and selects which (if any) to **promote into the KPI Database**
- Promoted KPIs become available immediately for selection on the Scorecard's `03 KPI ALIGNMENT` screen
- Provenance: each promoted KPI carries metadata noting it was developed via the ToC template and a link back to the originating Theory-of-Change session

This tool is **out of MVP scope** for the Scorecard prototype (the Scorecard MVP uses the existing curated KPI Database) but is captured here as the next major feature so the data model + KPI Database schema can accommodate it now.

---

## 8. Open Questions

- [ ] Confirm canonical source for Value Category taxonomy
- [ ] Confirm source/format for KPI database / library (incl. per-department customization layer)
- [ ] **Confirm source/format for Risk definitions**
- [ ] Confirm strategic priorities document (current Council term?)
- [ ] **Confirm M365-native target — Copilot Studio agent? Azure OpenAI? Power Platform? Dataverse? AI Foundry?**
- [ ] **Human approval workflow — who approves? Single reviewer or multi-step? Where is the approval audit stored?**
- [ ] Will users be authenticated? If so, what identity provider (Entra ID assumed)?
- [ ] Is there an export requirement (PDF/PPTX/Excel) for the result?
- [ ] Should scored outputs be persisted to a shared store for portfolio-level rollup? *(MVP says no; future iteration likely yes via SharePoint list)*
- [ ] **Pre-paid credit / budget model** — what dollar budget will the sponsoring department fund? What is the policy when credits are exhausted (block, warn-only, auto-renew)?
- [ ] **SharePoint list integration** — confirm target site / list schema for `EXPORT TO SHAREPOINT LIST`
- [ ] **Theory of Change KPI Development Tool** (§7.9) — confirm when this becomes in-scope; does it ship in v1.1 or later?
- [ ] **Hosting** — does the MVP web app run on Azure App Service / Static Web Apps / something else? Who owns the subscription?
- [ ] **IT intake bypass** — confirm with the sponsoring exec that a sponsor-funded standalone web app is acceptable outside the standard 6–8 month IT intake

---

## 9. References

- `docs/use-case-diagram.png` — original CoO Ottawa use case diagram ("What we are trying to enable")
- `docs/how-it-works-diagram.png` — CoO Ottawa architecture diagram ("How we want it to work")
- `docs/gemini-mockup-input.png` — UI mockup: Input screen + left-rail nav (empty state)
- `docs/gemini-mockup-input-filled.png` — UI mockup: Input screen with example data, Value Score header, Next Step CTA
- `docs/gemini-mockup-scorecard.png` — UI mockup: Scorecard screen with category table, suggested KPIs, "How this is calculated" panel
- `docs/gemini-mockup-kpi-alignment.png` — UI mockup: KPI Alignment screen (web-enhanced, generative AI assisted, manual override slots)
- `docs/gemini-mockup-risk-analysis.png` — UI mockup: Risk Analysis screen with Category Alignment + Tolerance Alignment Assessment + Consultant Insight
- `docs/gemini-mockup-success-story.png` — UI mockup: Success Story Builder (4-row Section/Guiding/Suggested/User Input table + 3-mode Generate Story + Generated Output + Copy)
- `docs/gemini-mockup-summary-snapshot.png` — UI mockup: Executive Snapshot (rollup table + Strategic Narrative + 3 scores + AI & Automation Strategy Insight)
- `docs/gemini-mockup-strategic-analysis.png` — UI mockup: Strategic Analysis (AI Reasoning Audit, Dynamic KPI Recommendations, System Performance & Costing)
- `docs/gemini-mockup-theory-of-change.png` — UI mockup: Theory of Change & Strategic Metrics validation drill-down (7-column logic model + project reference + validation status)
- `docs/example-kpis-coo.png` — reference KPIs from CoO Value Realization team (Average Resolution Time, Average Response Time, Complaint Reduction Rate, Customer Satisfaction Score, Ease of Interaction Index)
- `ai-day-transcript.vtt` — raw WebVTT transcript of the engagement meeting with the CoO CMO team (source of §1.5, §3.0, §6.1, §6.2, §6.3, §7.9 and assorted clarifications)
- `ai-day-transcript.cleaned.txt` — consolidated, speaker-grouped, interjection-filtered transcript for easier review (generated by `clean-transcript.js`)
- `clean-transcript.js` — utility script that produces the cleaned transcript from the raw VTT
- `README.md` — project overview
