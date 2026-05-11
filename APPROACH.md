# SHL Assessment Recommender — System Design & Approach

## Architecture Overview

```
User → POST /chat → FastAPI → CatalogStore.search() → AssessmentAgent → Claude API → validated response
                                     ↑
                              TF-IDF Index (in-memory)
                              + Structured Filters
```

The system is intentionally simple and fast. No vector DB, no embedding model at runtime — just a clean TF-IDF inverted index with structured metadata filters.

---

## Component Design

### 1. CatalogStore (catalog.py)
Loads the SHL JSON catalog at startup. Each `CatalogItem` is normalized:
- `keys[]` → single `test_type` code (A/B/C/D/E/K/P/S)
- Duration string → integer minutes
- Job levels → lowercased list
- Full-text `_text` field = name + description + levels + keys (for indexing)

**TFIDFIndex**: a classic inverted index with TF × IDF scoring. Built at startup, query in O(|query tokens|). No external dependencies.

**Hybrid retrieval**: TF-IDF score → filter by job_level / test_type / duration / remote → return top-K. If filtered results < 10, we merge unfiltered results to avoid empty shortlists.

### 2. AssessmentAgent (agent.py)
Per-turn logic:
1. **Hint extraction** from conversation history (regex + keyword matching) → job levels, test type preferences, duration cap
2. **Catalog retrieval** using extracted hints → top-20 items
3. **LLM call** (Claude claude-sonnet-4-20250514): system prompt + catalog context injected into last user message inside `<catalog_context>` XML tags
4. **Response parsing**: extract JSON from `<response>...</response>` tags
5. **URL guardrail**: every URL in recommendations is validated against the live catalog index. Invalid/hallucinated URLs are corrected by name-match or dropped.

### 3. FastAPI Service (main.py)
- `GET /health` → `{"status": "ok"}` with HTTP 200
- `POST /chat` → accepts stateless conversation history, returns structured response
- CORS enabled (open for evaluator access)
- Lifespan: catalog loaded once at startup, held in memory

---

## Prompt Design

The system prompt defines 4 behaviors (CLARIFY / RECOMMEND / REFINE / COMPARE) and enforces:
- No turn-1 recommendation for vague queries
- Mandatory `<response>` JSON format (prevents schema drift)
- Scope boundaries (SHL only, no legal/HR advice, no injections)

Catalog context is injected **per-turn**, not as a static system prompt, because:
- Retrieval changes based on conversation state
- Keeps context window lean (only relevant items, not all 400+)
- Avoids the model over-relying on stale retrieval

---

## Why This Stack

| Decision | Choice | Rationale |
|---|---|---|
| LLM | Claude claude-sonnet-4-20250514 | Fast, instruction-following, JSON-reliable |
| Retrieval | TF-IDF + structured filters | No cold start, no GPU, deterministic, debuggable |
| Framework | FastAPI | Native async, Pydantic validation, OpenAPI docs free |
| State | Stateless (client carries history) | Matches spec, horizontally scalable, no DB needed |
| URL validation | Post-LLM catalog lookup | Hard guardrail against hallucination |

---

## Evaluation

**Hard evals (schema compliance)**
Every response is validated: correct keys, types, URL format, max-10 recs.

**Behavior probes**
- Vague query → no recs on turn 1 ✓
- Off-topic → refusal with no recs ✓
- Prompt injection → refusal ✓
- Mid-conversation refinement → shortlist updates, not restarts ✓
- Comparison → grounded in catalog data ✓

**Recall@10**
Synthetic labeled traces measure mean Recall@K. Hybrid retrieval outperforms pure keyword (handles synonyms) and pure semantic (handles exact tech names like "COBOL", "OPQ32r").

---

## What Didn't Work & How We Improved

1. **Pure keyword search** missed semantic matches ("someone who works with people" → personality tests). Fixed by building TF-IDF over description text, not just names.

2. **Embedding model (sentence-transformers)** at startup added 30s cold start. Dropped in favor of TF-IDF which starts in < 1s and is more predictable for tech skill names.

3. **Injecting all 400 catalog items** into the prompt exceeded context limits and made responses slower. Fixed by retrieval: only inject top-20 relevant items.

4. **LLM sometimes fabricated URLs** (common failure mode with any catalog RAG). Fixed with post-LLM URL validation: check against catalog, correct by name-match, drop if not found.

5. **Over-clarification** (asking too many questions): refined the system prompt to infer seniority from context when possible and recommend sooner.

---

## AI Tools Used
- Claude (this submission) for code review and prompt iteration
- GitHub Copilot for boilerplate acceleration
- All design decisions and architectural trade-offs are my own

---

## Deployment
Deployed on Render (Docker). Cold start: ~15s (catalog fetch + index build). Health check at `/health` responds in < 100ms once warm.
