import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import {
  Badge,
  PageHeader,
  Panel,
  TextLink,
} from "../components/ui";

const DISPOSITION_TONE: Record<string, "neutral" | "green" | "yellow" | "red"> =
  {
    buyer_prospect: "green",
    partner_prospect: "green",
    adjacent_partner: "yellow",
    competitor_watch: "yellow",
    not_a_prospect: "red",
  };

// The research layer: 26 corrected scored identities, 24 pre-correction lane
// profiles kept for provenance, entity↔event evidence, and the audit trail.
export function Research() {
  const prospects = useQuery(api.paul.prospectsList);
  const lanes = useQuery(api.paul.laneProfilesList, {});
  const audit = useQuery(api.paul.auditFindingsList);
  const intents = useQuery(api.paul.intentMappingsList, {});
  const [open, setOpen] = useState<string | null>(null);
  const [tab, setTab] = useState<"prospects" | "lanes" | "audit" | "intent">(
    "prospects",
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Research"
        subtitle="Corrected identity scoring for Climate Week NYC 2026 — qualifier ≠ admission; these are source data, not a CRO pipeline"
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(
          [
            ["prospects", `Scored identities (${prospects?.length ?? "…"})`],
            ["lanes", `Lane profiles (${lanes?.length ?? "…"})`],
            ["audit", `Audit findings (${audit?.length ?? "…"})`],
            ["intent", `Intent map (${intents?.length ?? "…"})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              tab === key
                ? "border-accent bg-raised text-white"
                : "border-edge bg-panel text-neutral-400 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "prospects" ? (
        <Panel>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-edge text-xs text-neutral-500">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Disposition</th>
                <th className="px-4 py-3 font-medium">ICP</th>
                <th className="px-4 py-3 font-medium">Warm path</th>
              </tr>
            </thead>
            <tbody>
              {(prospects ?? []).map((p) => (
                <ProspectRow
                  key={p._id}
                  p={p}
                  open={open === p._id}
                  onToggle={() => setOpen(open === p._id ? null : p._id)}
                />
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}

      {tab === "lanes" ? (
        <div className="space-y-4">
          {(["A", "B", "C"] as const).map((lane) => {
            const rows = (lanes ?? []).filter((r) => r.lane === lane);
            if (rows.length === 0) return null;
            return (
              <Panel key={lane} className="p-4">
                <h2 className="mb-3 text-sm font-medium text-white">
                  Lane {lane} · {rows.length} profiles
                  <span className="ml-2 text-xs font-normal text-neutral-500">
                    pre-correction, kept for provenance
                  </span>
                </h2>
                <div className="space-y-3">
                  {rows.map((r) => (
                    <div
                      key={r._id}
                      className="border-t border-edge pt-3 first:border-0 first:pt-0"
                    >
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <span className="text-white">{r.name}</span>
                        <span className="text-xs text-neutral-500">
                          {r.category}
                          {r.stage ? ` · ${r.stage}` : ""}
                          {r.hq ? ` · ${r.hq}` : ""}
                        </span>
                        {r.website ? (
                          <TextLink href={r.website} className="text-xs">
                            site
                          </TextLink>
                        ) : null}
                      </div>
                      {r.fundingSummary ? (
                        <p className="mt-1 text-sm text-neutral-400">
                          {r.fundingSummary}
                        </p>
                      ) : null}
                      {r.icpNotes ? (
                        <p className="mt-1 text-sm text-neutral-400">
                          {r.icpNotes}
                        </p>
                      ) : null}
                      {(r.climateWeekRole ?? r.climateWeekInvolvement) ? (
                        <p className="mt-1 text-sm text-accent">
                          Climate Week: {r.climateWeekRole ?? r.climateWeekInvolvement}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Panel>
            );
          })}
        </div>
      ) : null}

      {tab === "audit" ? (
        <Panel>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-edge text-xs text-neutral-500">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Finding</th>
                <th className="px-4 py-3 font-medium">Correction</th>
                <th className="px-4 py-3 font-medium">Score impact</th>
              </tr>
            </thead>
            <tbody>
              {(audit ?? []).map((a) => (
                <tr
                  key={a._id}
                  className="border-b border-edge align-top last:border-0"
                >
                  <td className="px-4 py-3 text-neutral-400">{a.issueId}</td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={a.severity === "high" ? "red" : a.severity === "medium" ? "yellow" : "neutral"}
                    >
                      {a.severity}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-white">
                    {a.subject}
                    {a.confusedWith ? (
                      <div className="text-xs text-neutral-500">
                        ≠ {a.confusedWith}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{a.finding}</td>
                  <td className="px-4 py-3 text-neutral-400">{a.correction}</td>
                  <td className="px-4 py-3 text-neutral-400">{a.scoreImpact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}

      {tab === "intent" ? (
        <Panel>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-edge text-xs text-neutral-500">
                <th className="px-4 py-3 font-medium">Artifact</th>
                <th className="px-4 py-3 font-medium">Rows</th>
                <th className="px-4 py-3 font-medium">Disposition</th>
                <th className="px-4 py-3 font-medium">Target use case</th>
                <th className="px-4 py-3 font-medium">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {(intents ?? []).map((m) => (
                <tr
                  key={m._id}
                  className="border-b border-edge align-top last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="text-white">{m.artifactCategory}</div>
                    <div className="text-xs text-neutral-500">
                      {m.artifactPath}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{m.count}</td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        m.disposition === "keep"
                          ? "green"
                          : m.disposition === "reshape"
                            ? "yellow"
                            : "neutral"
                      }
                    >
                      {m.disposition}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {m.targetUseCase}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{m.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
    </div>
  );
}

function ProspectRow({
  p,
  open,
  onToggle,
}: {
  p: Doc<"paulProspects">;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer border-b border-edge align-top transition-colors last:border-0 hover:bg-raised"
      >
        <td className="px-4 py-3 text-neutral-400">{p.rank ?? "—"}</td>
        <td className="px-4 py-3 text-white">
          {p.canonicalName}
          <div className="text-xs text-neutral-500">
            {p.category}
            {p.prospectOnly ? " · prospect list only" : ""}
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="text-white">{p.scoreTotal ?? "—"}</span>
          {p.oldScore !== undefined && p.oldScore !== p.scoreTotal ? (
            <div className="text-xs text-neutral-500">was {p.oldScore}</div>
          ) : null}
        </td>
        <td className="px-4 py-3">
          <Badge tone={DISPOSITION_TONE[p.disposition ?? ""] ?? "neutral"}>
            {(p.disposition ?? "unknown").replaceAll("_", " ")}
          </Badge>
        </td>
        <td className="px-4 py-3 text-neutral-400">{p.icpFit}</td>
        <td className="max-w-56 px-4 py-3 text-xs text-neutral-400">
          {p.warmPath ?? "—"}
        </td>
      </tr>
      {open ? (
        <tr className="border-b border-edge bg-ink">
          <td colSpan={6} className="px-4 py-4">
            <ProspectDetail p={p} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function ProspectDetail({ p }: { p: Doc<"paulProspects"> }) {
  const relationships = useQuery(api.paul.eventRelationships, {
    entity: p.canonicalName,
  });
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Identity
        </div>
        <div className="space-y-1 text-sm">
          {[
            ["legal name", p.legalName],
            ["entity type", p.entityType],
            ["hq", p.hq],
            ["founded", p.founded],
            ["stage", p.stage],
            ["headcount", p.headcount],
            ["nyc presence", p.nycPresence],
            ["profile", p.profileStatus],
            ["lane", p.lane],
          ].map(([k, val]) =>
            val ? (
              <div key={k} className="flex gap-2">
                <span className="w-28 shrink-0 text-neutral-500">{k}</span>
                <span className="text-neutral-300">{val}</span>
              </div>
            ) : null,
          )}
          {p.website ? (
            <div className="pt-1">
              <TextLink href={p.website}>Website</TextLink>
            </div>
          ) : null}
        </div>
      </div>
      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Scoring
        </div>
        <div className="space-y-1 text-sm">
          {(
            [
              ["climate relevance", p.climateRelevance, 30],
              ["icp fit", p.icpScore, 25],
              ["engagement", p.engagement, 25],
              ["access", p.access, 20],
            ] as const
          ).map(([k, val, max]) => (
            <div key={k} className="flex gap-2">
              <span className="w-32 shrink-0 text-neutral-500">{k}</span>
              <span className="text-neutral-300">
                {val ?? "—"}
                <span className="text-neutral-600">/{max}</span>
              </span>
            </div>
          ))}
          {p.scoreDelta !== undefined && p.scoreDelta !== 0 ? (
            <div className="flex gap-2">
              <span className="w-32 shrink-0 text-neutral-500">correction</span>
              <span className="text-neutral-300">
                {p.oldScore} → {p.scoreTotal} ({p.scoreDelta > 0 ? "+" : ""}
                {p.scoreDelta})
              </span>
            </div>
          ) : null}
        </div>
        {p.fundingSummary ? (
          <p className="mt-2 text-sm text-neutral-400">{p.fundingSummary}</p>
        ) : null}
        {p.products ? (
          <p className="mt-1 text-sm text-neutral-400">{p.products}</p>
        ) : null}
      </div>
      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Notes
        </div>
        <div className="space-y-2 text-sm text-neutral-400">
          {p.icpNotes ? <p>{p.icpNotes}</p> : null}
          {p.unknowns ? (
            <p>
              <span className="text-neutral-500">Open questions: </span>
              {p.unknowns}
            </p>
          ) : null}
        </div>
        {relationships && relationships.length > 0 ? (
          <div className="mt-3">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Event links
            </div>
            <div className="space-y-1 text-sm">
              {relationships.map((r) => (
                <div key={r._id} className="text-neutral-300">
                  <span className="text-neutral-500">
                    {r.relationType}
                    {r.confidence ? ` (${r.confidence})` : ""}:
                  </span>{" "}
                  {r.eventTitle}
                  {r.eventDate ? ` — ${r.eventDate}` : ""}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
