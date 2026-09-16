import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import {
  Badge,
  EmptyState,
  PageHeader,
  Panel,
} from "../components/ui";

type Meta = {
  generatedAt?: string;
  research?: {
    scope?: string;
    rubric?: {
      climate_software_relevance_max?: number;
      icp_fit_max?: number;
      climate_week_engagement_max?: number;
      accessibility_max?: number;
      rules?: string[];
    };
    counts?: Record<string, unknown>;
  };
  verificationSummary?: {
    verified_at?: string;
    counts?: Record<string, number>;
    qualified_evidence?: Record<string, number>;
    qualified_access?: Record<string, number>;
    qualified_date_scope?: Record<string, number>;
  };
};

// The companion documents and scoring rubric, verbatim. Every markdown/JSON
// context file that shipped in paul-data lands here with its sha256 so the
// research stays inspectable without leaving the CRM.
export function Dossier() {
  const docs = useQuery(api.paul.documentsList);
  const meta = useQuery(api.paul.researchMeta) as Meta | undefined;
  const [path, setPath] = useState<string | null>(null);
  const doc = useQuery(api.paul.document, path ? { path } : "skip");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Dossier"
        subtitle="Research context, scoring rubric, and every source document — verbatim, checksummed"
      />

      {meta?.research ? (
        <Panel className="mb-4 p-4">
          <h2 className="mb-2 text-sm font-medium text-white">
            Scoring rubric
          </h2>
          {meta.research.scope ? (
            <p className="mb-3 text-sm text-neutral-400">
              {meta.research.scope}
            </p>
          ) : null}
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                ["Climate relevance", meta.research.rubric?.climate_software_relevance_max],
                ["ICP fit", meta.research.rubric?.icp_fit_max],
                ["CW engagement", meta.research.rubric?.climate_week_engagement_max],
                ["Accessibility", meta.research.rubric?.accessibility_max],
              ] as const
            ).map(([label, max]) => (
              <div key={label} className="rounded-md border border-edge px-3 py-2">
                <div className="text-lg text-white">{max ?? "—"}</div>
                <div className="text-xs text-neutral-500">{label}</div>
              </div>
            ))}
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-400">
            {(meta.research.rubric?.rules ?? []).map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {meta?.verificationSummary?.counts ? (
        <Panel className="mb-4 p-4">
          <h2 className="mb-2 text-sm font-medium text-white">
            Verification summary
          </h2>
          <div className="flex flex-wrap gap-4 text-sm text-neutral-300">
            {Object.entries(meta.verificationSummary.counts).map(([k, num]) => (
              <span key={k}>
                <span className="text-white">{num}</span>{" "}
                <span className="text-neutral-500">{k}</span>
              </span>
            ))}
          </div>
          {meta.verificationSummary.qualified_access ? (
            <div className="mt-3 space-y-1">
              <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Qualified event access
              </div>
              {Object.entries(meta.verificationSummary.qualified_access).map(
                ([k, num]) => (
                  <div key={k} className="flex gap-2 text-sm">
                    <span className="w-8 shrink-0 text-right text-neutral-300">
                      {num}
                    </span>
                    <span className="text-neutral-400">{k}</span>
                  </div>
                ),
              )}
            </div>
          ) : null}
        </Panel>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Panel className="md:col-span-1">
          <div className="border-b border-edge px-4 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Documents
          </div>
          <div>
            {(docs ?? []).map((d) => (
              <button
                key={d._id}
                type="button"
                onClick={() => setPath(d.path)}
                className={`block w-full border-b border-edge px-4 py-2.5 text-left text-sm transition-colors last:border-0 hover:bg-raised ${
                  path === d.path ? "bg-raised" : ""
                }`}
              >
                <div className="text-white">{d.title}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500">
                  <span>{d.path}</span>
                  {d.retired ? <Badge tone="yellow">retired</Badge> : null}
                  <Badge tone="neutral">{d.kind}</Badge>
                </div>
              </button>
            ))}
          </div>
        </Panel>
        <Panel className="md:col-span-2">
          {path === null ? (
            <EmptyState message="Pick a document to read it inline." />
          ) : doc === undefined ? (
            <div className="p-4 text-sm text-neutral-500">Loading…</div>
          ) : doc === null ? (
            <EmptyState message="Document not found." />
          ) : (
            <div>
              <div className="border-b border-edge px-4 py-3">
                <div className="text-sm font-medium text-white">{doc.title}</div>
                <div className="mt-0.5 font-mono text-xs text-neutral-500">
                  {doc.path} · {doc.bytes.toLocaleString()} bytes · sha256{" "}
                  {doc.sha256.slice(0, 12)}…
                </div>
              </div>
              <pre className="max-h-[65vh] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed text-neutral-300">
                {doc.content}
              </pre>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
