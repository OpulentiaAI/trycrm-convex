#!/usr/bin/env node
// Regenerates convex/paulData/*.ts from paul-data/paul-large-datafiles/.
// Run: node scripts/build-paul-seed.mjs
// Deterministic: same input files -> same output, verified against the counts
// asserted in paul-data/paul-large-datafiles/SHA256-MANIFEST.json.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "paul-data/paul-large-datafiles");
const OUT = join(ROOT, "convex/paulData");
mkdirSync(OUT, { recursive: true });

// --- minimal RFC-4180-ish CSV parser (quoted fields, embedded commas/newlines)
function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  return body.map((r) =>
    Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])),
  );
}

const num = (s) => (s === "" || s === undefined ? undefined : Number(s));
const str = (s) => (s === "" || s === undefined ? undefined : String(s));

// --- events ---------------------------------------------------------------
// One row per real event. official838 is the inventory; the screened file
// annotates 153 of those by slug plus 77 Luma-only records.

const SCREENED_FILES = [
  ["expanded-longlist-all-screened.csv", "screened"],
  ["qualified-climate-tech-networking-longlist.csv", "qualified"],
  ["candidate-pending-verification.csv", "pending"],
  ["excluded-from-qualified.csv", "excluded"],
  ["ranked-top20.csv", "top20"],
  ["ranked-top10.csv", "top10"],
];

const official = parseCsv(readFileSync(join(SRC, "events/official838.csv"), "utf8"));
const screened = parseCsv(
  readFileSync(join(SRC, "events/expanded-longlist-all-screened.csv"), "utf8"),
);
const listsById = new Map();
const rankById = new Map();
for (const [file, tag] of SCREENED_FILES) {
  for (const r of parseCsv(readFileSync(join(SRC, "events/" + file), "utf8"))) {
    const id = r.record_id;
    if (!listsById.has(id)) listsById.set(id, new Set());
    listsById.get(id).add(tag);
    if (r.priority_rank) rankById.set(id, Number(r.priority_rank));
  }
}

const eventsBySlug = new Map();
const events = [];
for (const r of official) {
  const e = {
    key: `off:${r.slug}`,
    slug: r.slug,
    origin: "official-838",
    title: r.title,
    weekTag: str(r.week_tag),
    date: str(r.date),
    dateTime: str(r.date_time),
    dateTimeFull: str(r.date_time_full),
    format: str(r.format),
    type: str(r.type),
    host: str(r.host),
    location: str(r.location),
    address: str(r.address),
    themes: str(r.themes),
    registrationUrl: str(r.registration_url),
    url: str(r.url),
    duration: str(r.duration),
    language: str(r.language),
    detailStatus: str(r.detail_status),
    lists: ["official838"],
    screening: "inventory",
  };
  events.push(e);
  eventsBySlug.set(r.slug, e);
}

for (const r of screened) {
  const common = {
    recordId: str(r.record_id),
    dateLocal: str(r.date_local),
    timeLocal: str(r.time_local),
    timezone: str(r.timezone),
    venue: str(r.venue),
    neighborhood: str(r.neighborhood),
    borough: str(r.borough),
    officialUrl: str(r.official_url),
    sourceCalendars: str(r.source_calendars),
    netSignal: str(r.net_signal),
    icpScore: num(r.icp_score),
    icpFitRationale: str(r.icp_fit_rationale),
    confirmedPeopleOrgs: str(r.confirmed_people_orgs),
    targetAudience: str(r.target_audience),
    priceCurrency: str(r.price_currency),
    accessRequirements: str(r.access_requirements),
    observedRegistrationStatus: str(r.observed_registration_status),
    observationTime: str(r.observation_time),
    rankScore: num(r.rank_score),
    rankTier: str(r.rank_tier),
    remainingUncertainty: str(r.remaining_uncertainty),
    officialDescSnippet: str(r.official_desc_snippet),
    networkingEvidence: str(r.networking_evidence),
    evidenceLevel: str(r.evidence_level),
    descHasCommercial: str(r.desc_has_commercial),
    priorityRank: rankById.get(r.record_id),
    lists: [...(listsById.get(r.record_id) ?? [])],
    screening: r.rank_tier.startsWith("Excluded")
      ? "excluded"
      : r.rank_tier === "Candidate-pending-verification"
        ? "pending"
        : "qualified",
  };
  const existing = eventsBySlug.get(r.slug);
  if (existing && r.origin === "official-838") {
    Object.assign(existing, common);
  } else {
    events.push({
      key: `eco:${r.record_id}`,
      slug: r.slug,
      origin: r.origin,
      title: r.title,
      host: str(r.host),
      registrationUrl: str(r.registration_url),
      format: str(r.format),
      ...common,
    });
  }
}
// Stable order: official inventory order first (as in the CSV), then luma.
console.log(`events: ${events.length} (838 official + ${events.length - 838} luma-only)`);

// --- other tables ----------------------------------------------------------

const verifications = JSON.parse(
  readFileSync(join(SRC, "events/primary-source-verification.json"), "utf8"),
).map((r) => ({
  recordId: r.record_id,
  sourceUrl: r.source_url,
  observedAt: r.observed_at,
  eventId: r.event_id,
  title: r.title,
  startAt: r.start_at,
  endAt: r.end_at,
  timezone: r.timezone,
  registrationAvailability: r.registration_availability,
  approvalRequired: r.approval_required,
  description: r.description,
  sourceJsonSha256: r.source_json_sha256,
}));

const candidates = parseCsv(
  readFileSync(join(SRC, "companies/candidate-universe-status.csv"), "utf8"),
).map((r) => ({
  name: r.candidate_name,
  status: r.status,
  officialHostEvents: num(r.official_host_events_exact_fragment),
  notes: str(r.notes),
}));

const research = JSON.parse(
  readFileSync(join(SRC, "companies/company-research.json"), "utf8"),
);
const ranking = parseCsv(
  readFileSync(join(SRC, "companies/prospect-ranking.csv"), "utf8"),
);
const prospectsOnly = new Set(
  parseCsv(readFileSync(join(SRC, "companies/prospects-only.csv"), "utf8")).map(
    (r) => r.canonical_name,
  ),
);
const rankOf = new Map(ranking.map((r) => [r.canonical_name, r]));
const prospects = research.companies.map((c) => {
  const rk = rankOf.get(c.canonical_name) ?? {};
  return {
    canonicalName: c.canonical_name,
    legalName: str(c.legal_name),
    entityType: str(c.entity_type),
    category: str(c.category),
    website: str(c.website),
    hq: str(c.hq),
    founded: str(c.founded),
    stage: str(c.stage),
    fundingSummary: str(c.funding_summary),
    headcount: str(c.headcount),
    headcountSource: str(c.headcount_source),
    headcountStatus: str(c.headcount_status),
    products: str(c.products),
    icpFit: str(c.icp_fit),
    icpNotes: str(c.icp_notes),
    climateRelevance: num(c.climate_relevance),
    icpScore: num(c.icp_score),
    engagement: num(c.engagement),
    access: num(c.access),
    unknowns: str(c.unknowns),
    disposition: str(c.disposition),
    profileStatus: str(c.profile_status),
    lane: str(c.lane),
    nycPresence: str(c.nyc_presence),
    scoreTotal: num(c.score_total),
    oldScore: num(c.old_score),
    scoreDelta: num(c.score_delta),
    rank: num(rk.rank),
    warmPath: str(rk.warm_path),
    prospectOnly: prospectsOnly.has(c.canonical_name),
  };
});

const laneProfiles = [];
for (const lane of ["A", "B", "C"]) {
  for (const p of JSON.parse(
    readFileSync(join(SRC, `companies/companies-${lane}.json`), "utf8"),
  )) {
    laneProfiles.push({
      lane,
      name: p.name,
      category: str(p.category),
      website: str(p.website),
      hq: str(p.hq),
      founded: str(p.founded),
      stage: str(p.stage),
      fundingSummary: str(p.funding_summary),
      headcount: str(p.headcount),
      headcountSource: str(p.headcount_source),
      products: str(p.products),
      icpFit: str(p.icp_fit),
      icpNotes: str(p.icp_notes),
      climateWeekInvolvement: str(p.climate_week_involvement),
      climateWeekRole: str(p.climate_week_role),
      // Lane A cites bare URLs; lanes B/C cite {title,url} pairs.
      sources: (p.sources ?? []).map((s) =>
        typeof s === "string" ? { url: s } : { title: s.title, url: s.url },
      ),
    });
  }
}

const relationships = parseCsv(
  readFileSync(join(SRC, "companies/company-event-relationships.csv"), "utf8"),
).map((r) => ({
  entity: str(r.entity),
  relationType: str(r.relation_type),
  confidence: str(r.confidence),
  eventTitle: str(r.event_title),
  eventDate: str(r.event_date),
  eventType: str(r.event_type),
  eventFormat: str(r.event_format),
  matchedHostFragment: str(r.matched_host_fragment),
  hostField: str(r.host_field),
  sourceUrl: str(r.source_url),
  evidence: str(r.evidence),
}));

const auditFindings = parseCsv(
  readFileSync(join(SRC, "companies/entity-resolution-audit.csv"), "utf8"),
).map((r) => ({
  issueId: str(r.issue_id),
  severity: str(r.severity),
  subject: str(r.subject),
  confusedWith: str(r.confused_with),
  finding: str(r.finding),
  evidence: str(r.evidence),
  correction: str(r.correction),
  scoreImpact: str(r.score_impact),
}));

const intentMappings = parseCsv(
  readFileSync(join(SRC, "intent/outputs-vs-intent.csv"), "utf8"),
).map((r) => ({
  artifactCategory: r.artifact_category,
  artifactPath: r.artifact_path,
  rowClassOrScope: r.row_class_or_scope,
  count: str(r.count),
  disposition: r.disposition,
  targetUseCase: str(r.target_use_case),
  rationale: r.rationale,
  astraAction: str(r.astra_action),
}));

// --- documents: every non-CSV companion file, verbatim ---------------------
const DOC_PATHS = [
  "README.md",
  "SHA256-MANIFEST.json",
  "context/ALL-ASKS-AND-FULL-CONTEXT.md",
  "context/HOW-TO-FIND-PAUL-IN-CONVEX.md",
  "context/asks-submitted/CONTINUATION-BRIEF-company-research.md",
  "context/asks-submitted/fable51-medium-revision-brief.md",
  "context/asks-submitted/gemini38-intent-vs-outputs-brief.md",
  "context/asks-submitted/gpt6-astra-medium-presentation-brief.md",
  "context/paul-thread-and-run-receipts.json",
  "companies/HISTORICAL-UNCORRECTED-prospect-ranking.md",
  "companies/prior-candidate-names-480.txt",
  "events/verification-summary.json",
];
const documents = DOC_PATHS.map((path) => {
  const content = readFileSync(join(SRC, path), "utf8");
  return {
    path,
    title: path.split("/").pop(),
    kind: path.endsWith(".md")
      ? "markdown"
      : path.endsWith(".json")
        ? "json"
        : "text",
    retired: path.includes("HISTORICAL-UNCORRECTED"),
    bytes: Buffer.byteLength(content),
    sha256: createHash("sha256").update(content).digest("hex"),
    content,
  };
});

// --- emit -------------------------------------------------------------------
const TYPES = {
  events: "PaulEventRow",
  verifications: "PaulVerificationRow",
  candidates: "PaulCandidateRow",
  prospects: "PaulProspectRow",
  laneProfiles: "PaulLaneProfileRow",
  relationships: "PaulRelationshipRow",
  auditFindings: "PaulAuditRow",
  intentMappings: "PaulIntentRow",
  documents: "PaulDocumentRow",
};

const banner = (name, type) =>
  `// GENERATED by scripts/build-paul-seed.mjs from paul-data/paul-large-datafiles/\n` +
  `// Do not edit by hand. Regenerate with: node scripts/build-paul-seed.mjs\n\n` +
  (type ? `import type { ${type} } from "./types";\n\n` : "") +
  `export const ${name}${type ? `: ${type}[]` : ""} = `;

const emit = (file, name, data, type) => {
  writeFileSync(join(OUT, file), banner(name, type) + JSON.stringify(data, null, 1) + ";\n");
  console.log(`${file}: ${data.length} rows`);
};

const CHUNK = 250;
for (let i = 0; i < events.length; i += CHUNK) {
  emit(`events${Math.floor(i / CHUNK)}.ts`, `events${Math.floor(i / CHUNK)}`, events.slice(i, i + CHUNK), TYPES.events);
}
emit("verifications.ts", "verifications", verifications, TYPES.verifications);
emit("candidates.ts", "candidates", candidates, TYPES.candidates);
emit("prospects.ts", "prospects", prospects, TYPES.prospects);
emit("laneProfiles.ts", "laneProfiles", laneProfiles, TYPES.laneProfiles);
emit("relationships.ts", "relationships", relationships, TYPES.relationships);
emit("auditFindings.ts", "auditFindings", auditFindings, TYPES.auditFindings);
emit("intentMappings.ts", "intentMappings", intentMappings, TYPES.intentMappings);
emit("documents.ts", "documents", documents, TYPES.documents);

writeFileSync(
  join(OUT, "meta.ts"),
  banner("meta") +
    JSON.stringify(
      {
        generatedAt: new Date().toISOString().slice(0, 10),
        source: "paul-data/paul-large-datafiles",
        research: {
          generatedAt: research.generated_at,
          scope: research.scope,
          rubric: research.rubric,
          counts: research.counts,
        },
        verificationSummary: JSON.parse(
          readFileSync(join(SRC, "events/verification-summary.json"), "utf8"),
        ),
        counts: {
          events: events.length,
          officialInventory: official.length,
          screened: screened.length,
          verifications: verifications.length,
          candidates: candidates.length,
          prospects: prospects.length,
          laneProfiles: laneProfiles.length,
          relationships: relationships.length,
          auditFindings: auditFindings.length,
          intentMappings: intentMappings.length,
          documents: documents.length,
        },
      },
      null,
      1,
    ) + ";\n",
);
console.log("done");
