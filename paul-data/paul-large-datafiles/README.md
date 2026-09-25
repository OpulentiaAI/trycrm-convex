# Large data files and lists

Packaged from existing Paul Climate Week / company-research artifacts. No new research.

## Events

| File | Rows / size | What it is |
|---|---|---|
| official838.csv | 838 data rows | Full official Climate Week NYC 2026 event-search inventory |
| expanded-longlist-all-screened.csv | 230 | All 230 screened networking records |
| qualified-climate-tech-networking-longlist.csv | 99 | 99 qualified (95 core Sep 20–27 + 4 adjacent) |
| candidate-pending-verification.csv | 114 | 114 pending |
| excluded-from-qualified.csv | 17 | 17 excluded |
| ranked-top20.csv / ranked-top10.csv | 20 / 10 | Ranked subsets of the 99 |
| primary-source-verification.json | 32 Luma pages | Structured Luma observations |

## Companies / entities

| File | Count | What it is |
|---|---|---|
| prior-candidate-names-480.txt | 480 names | Original candidate-name ledger (names only) |
| candidate-universe-status.csv | 480 | Status of each name vs official hosts / profiles |
| companies-A.json / B.json / C.json | 8+8+8 = 24 | Recovered lane profiles |
| company-research.json / .csv | 26 | Corrected scored identities (Crux Alliance + Microsoft split) |
| company-event-relationships.csv | host/sponsor/speaker evidence | Official host/title plus labeled prior claims |
| entity-resolution-audit.csv | 12 issues | Crux merge, Scale AI, Google, etc. |
| prospect-ranking.csv | 26 | Corrected 0–100 scores |
| prospects-only.csv | buyers+partners only | Subset of ranking |
| HISTORICAL-UNCORRECTED-prospect-ranking.md | retired | Do not use; Crux Climate≠Alliance |

## Intent mapping

| outputs-vs-intent.csv | keep/reshape/drop of prior artifacts vs CRO + Climate Week jobs |

Qualification ≠ admission. 0/26 scored companies fit Paul as a fractional CRO client; these lists are source data, not a CRO pipeline.

## Context (added)

| File | What it is |
|---|---|
| context/ALL-ASKS-AND-FULL-CONTEXT.md | Who Paul is, every Jeremy ask in this thread, what was already produced |
| context/HOW-TO-FIND-PAUL-IN-CONVEX.md | User id, workspace, indexes, CLI query, thread/run IDs |
| context/asks-submitted/ | Exact briefs sent to Gemini 3.8, Astra medium, Fable 5.1, and the company continuation |
| context/paul-thread-and-run-receipts.json | Thread create + sendMessage receipts (no secrets) |
