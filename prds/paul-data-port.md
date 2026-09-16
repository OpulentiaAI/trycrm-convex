# PRD — Port Paul's Climate Week dataset + Ramp Ryu restyle

- Created: 2026-09-15 23:55 UTC
- Last Updated: 2026-09-15 23:55 UTC
- Status: In Progress

## Problem

Fork the CRM for Paul Cushman (`paul@opulent.ai`, fractional CRO attending
Climate Week NYC 2026, Sep 20-27). Two bodies of data must be ported verbatim,
with zero loss:

1. `paul-data/paul-large-datafiles/` — events, company research, candidate
   universe, intent mapping, and full context docs (31 files, ~1.5 MB).
2. Ramp "Ryu" design tokens — replace the default Mona Sans + Composio/Minimax
   palette with Lausanne + the Ryu light/dark palettes and type traits.

## Proposed solution

### Data model (new `paul*` tables, single tenant)

- `paulEvents`: 1068 rows — all 838 official inventory rows (schema A) plus
  all 230 screened ecosystem rows (schema B). Fields = union of both CSV
  schemas, all optional except `key` + `origin`. `lists` records which source
  files each record appears in; `priorityRank` merges ranked-top10/top20.
- `paulVerifications`: 32 primary-source Luma observations.
- `paulCandidates`: the 480-name universe with status + host-match counts.
- `paulProspects`: the 26 corrected scored identities (all research fields,
  rank, warm path, deltas).
- `paulLaneProfiles`: the 24 recovered lane A/B/C profiles incl. sources.
- `paulRelationships`: 79 entity<->event evidence rows.
- `paulAuditFindings`: 12 entity-resolution corrections.
- `paulIntentMappings`: 24 artifact dispositions vs intent.
- `paulDocuments`: every .md/.json/.txt/.csv companion file verbatim
  (README, context, asks, receipts, manifest, HISTORICAL retired ranking).

Native CRM seed also becomes Paul's: workspace "Paul Cushman — Climate Week",
users Paul (owner) + Jeremy (member), the 26 scored entities become
`companies` rows with scores written to the `facts` evidence ledger. No deals
are seeded: the source data explicitly says 0/26 fit the CRO ICP and the lists
are source data, not a pipeline. Qualification ≠ admission.

### Seeding

- `scripts/build-paul-seed.mjs` regenerates `convex/paulData/*.ts` data modules
  from `paul-data/` (checked in, so the seed needs no runtime file access).
- `convex/model/paulSeed.ts` inserts everything in scheduled batches
  (idempotent, resumable via `paulProgress` bookkeeping is avoided — instead
  each table is cleared-then-inserted by a per-table internal mutation).
- `demo.seedPublic` first-boot calls the Paul seed; `demo.reset` wipes paul
  tables too so the demo-reset cron reseeds Paul's canonical state.
- `paul.seedPaul` public mutation re-loads paul tables on demand.

### Frontend

- New nav items: Events (`/app/events`), Universe (`/app/universe`),
  Research (`/app/research`), Dossier (`/app/dossier`).
- Events page: stats strip + list/status filters + table + row detail expand.
- Universe: 480 candidates w/ status grouping.
- Research: scored prospects, audit findings, relationships, intent map.
- Dossier: document browser rendering markdown/JSON/text verbatim.
- Companies page shows the 26 prospects via the existing list view.

### Theme (`src/index.css`)

- Lausanne from `https://assets.ramp.com/fonts/fonts.css`, fallback stack per
  Ryu spec; Mona Sans import removed.
- Dark theme mapped to ryu-dark palette (canvas #1a1919, surface steps, warm
  grays, ryu-info accent #a1b3df); light theme to ryu-light (#425e93 accent).
- Radii -> 0 (Ryu rounds almost nothing); body weight 300, headings 400 with
  Ryu letter-spacing; mono for ids/numbers stays ui-monospace stack.

## Files to change

- `convex/schema.ts`, `convex/paul.ts`, `convex/model/paulSeed.ts`,
  `convex/paulData/*.ts` (generated), `convex/demo.ts` (TABLES + seed wiring),
  `src/index.css`, `src/App.tsx`, `src/app/AppLayout.tsx`,
  `src/app/{Events,Universe,Research,Dossier}.tsx`, `src/lib/format.ts`,
  `package.json` (drop fontsource/mona-sans, add seed:paul script),
  `paul-data/**` (new), `scripts/build-paul-seed.mjs` (new), `files.md`,
  `CHANGELOG.md`, `task.md`, `README.md`.

## Edge cases

- CSV commas/quotes/newlines handled by a real parser in the build script.
- `official838` rows have no `record_id`: keyed on `slug`.
- Ranked files subset the qualified file; merge `priorityRank` onto the master
  screened row instead of duplicating records.
- `prior-candidate-names-480.txt` duplicates the CSV names; keep file verbatim
  in `paulDocuments`, use CSV as the typed source.
- HISTORICAL-UNCORRECTED ranking is explicitly retired data: ported verbatim
  into `paulDocuments` flagged `retired`, never typed into prospects.
- Demo reset continues to reseed (documented in PR) — user edits to paul rows
  are rebuilt to canonical state every 10 min while demo mode is on.

## Verification

- `npm run check-types`, `npm run lint`, `npm run build` all clean.
- Re-run `node scripts/build-paul-seed.mjs` is deterministic (sha check vs
  manifest counts: 838/230/99/114/17/20/10/480/26/24/79/12/32/24/docs).
- Seed counts verified against `verification-summary.json` + manifest.

## Task completion log

- (to be filled as work proceeds)
