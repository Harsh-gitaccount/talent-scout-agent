# Architecture — AI-Powered Talent Scout Agent

## System Overview

```
┌─────────────────┐     POST /api/analyze      ┌──────────────────────────────┐
│                  │ ──────────────────────────▶ │         Express.js           │
│  React Frontend  │                            │         Backend              │
│  (Vite + TW)     │ ◀────── SSE Stream ─────── │                              │
│                  │                            │  ┌─────────────────────────┐  │
└─────────────────┘                            │  │   Agent Pipeline        │  │
                                               │  │                         │  │
                                               │  │  1. JD Parser           │  │
                                               │  │  2. Candidate Discovery │  │
                                               │  │  3. Match Scorer        │  │
                                               │  │  4. Outreach Agent      │  │
                                               │  │  5. Interest Scorer     │  │
                                               │  │  6. Ranker              │  │
                                               │  └─────────────────────────┘  │
                                               │                              │
                                               │  ┌──────┐  ┌──────────────┐  │
                                               │  │Gemini│  │ MiniLM-L6-v2 │  │
                                               │  │/Groq │  │ (Embeddings) │  │
                                               │  └──────┘  └──────────────┘  │
                                               └──────────────────────────────┘
```

## Data Flow

1. **User pastes JD** → React frontend sends POST to `/api/analyze`
2. **Backend opens SSE stream** → Sends real-time events as each pipeline step completes
3. **Step 1 — JD Parsing**: LLM extracts structured data (skills, seniority, salary, etc.)
4. **Step 2 — Discovery**: JD embedding compared against pre-cached candidate embeddings via cosine similarity. Hard filter removes candidates with < 20% skill overlap.
5. **Step 3 — Match Scoring**: Rule-based scoring (skills 40pts + seniority 20pts + location 10pts + semantic 30pts)
6. **Step 4 — Outreach**: Top 3 candidates (capped for free API limits) get a 6-turn simulated conversation via LLM
7. **Step 5 — Interest Scoring**: LLM analyzes transcripts for enthusiasm, availability, salary alignment, proactiveness
8. **Step 6 — Ranking**: Combined score = (0.6 × Match) + (0.4 × Interest), adjustable via UI slider

## Module Responsibilities

| Module | Purpose | Approach |
|--------|---------|----------|
| `jdParser.js` | Extract structured data from raw JD | LLM with structured JSON output; rule-based fallback |
| `candidateDiscovery.js` | Find relevant candidates | Cosine similarity on embeddings + skill overlap filter |
| `matchScorer.js` | Score candidate-JD fit | Deterministic: skill matching (fuzzy), seniority range, location, semantic |
| `outreachAgent.js` | Simulate recruiter-candidate dialogue | 6-turn LLM conversation with varying enthusiasm levels |
| `interestScorer.js` | Assess candidate interest from dialogue | LLM analysis of transcripts across 4 dimensions |
| `ranker.js` | Final ranking + summaries | Weighted score combination + LLM-generated summaries |

## Scoring Formulas

### Match Score (0-100) — Deterministic
```
SkillScore     = (matched_skills / required_skills) × 40
SeniorityScore = fit_within_range(YOE, level) × 20
LocationScore  = location_compatibility × 10
SemanticScore  = cosine_similarity × 30
────────────────────────────────────────────────
MatchScore     = min(100, sum of above)
```

**Rationale**: Skills are weighted highest (40%) because they're the strongest predictor of job fit. Semantic similarity captures nuanced relevance that keyword matching misses. Seniority and location are important but secondary.

### Interest Score (0-100) — LLM-Assessed
```
Enthusiasm     = 0-35 pts (response depth, positive language, engagement)
AvailabilityFit = 0-25 pts (notice period, start date alignment)
SalaryAlignment = 0-25 pts (expected vs offered range)
Proactiveness  = 0-15 pts (questions asked about role/team)
```

**Rationale**: Enthusiasm gets the highest weight because genuinely interested candidates perform better in interviews and accept offers. Salary and availability are practical deal-breakers.

### Combined Score
```
CombinedScore = (matchWeight × MatchScore) + ((1 - matchWeight) × InterestScore)
Default: 60% Match, 40% Interest — adjustable via UI slider
```

## Embedding Strategy

**Why hybrid (semantic + rule-based)?**
- **Semantic search** catches candidates whose bios/skills are conceptually similar even if exact keywords differ (e.g., "Redux" vs "state management")
- **Rule-based filtering** ensures hard requirements aren't violated (e.g., minimum skill overlap threshold of 20%)
- The combination provides both recall (semantic) and precision (rules)

**Model choice**: all-MiniLM-L6-v2 runs locally with zero API cost, produces 384-dim vectors, and is fast enough for 60 candidates in < 5 seconds.

## Trade-offs

| Decision | Trade-off | Rationale |
|----------|-----------|-----------|
| Local embeddings vs OpenAI | Lower quality but zero cost | Hackathon priority: no billing required |
| Simulated conversations vs real | Not testing real candidate behavior | Demonstrates the concept; real integration would use email/LinkedIn APIs |
| In-memory data vs database | Not persistent across restarts | Simplicity for demo; production would use PostgreSQL |
| Top-3 Cap & Sequential Outreach | Slower, evaluates fewer candidates | Strict rate limits on free API tiers (Groq/Gemini) dictate sequential, capped calls. A paid API key would instantly unlock parallel processing for 50+ candidates. |
| 6-turn conversations vs variable | Less natural | Predictable structure makes scoring consistent |

## What "Agentic" Means Here

This system is **agentic** because:
1. **Autonomous decision-making**: The pipeline independently decides which candidates to pursue (discovery), how to engage them (enthusiasm-aware outreach), and how to rank the final list
2. **Self-contained pipeline**: A single API call triggers a multi-step workflow that coordinates 6 specialized modules
3. **Tool-use pattern**: Each service acts as a "tool" — the orchestrator (route handler) decides when to call each one based on intermediate results
4. **Adaptive behavior**: Outreach enthusiasm is determined by match quality; interest scoring adapts to conversation content
5. **Explainability**: Every decision is documented with reasoning (match explanations, interest breakdowns, why-not-hired suggestions)
