import { usePaginatedQuery, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Panel,
  Select,
} from "../components/ui";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "official_host_name", label: "Official host name" },
  { value: "unresolved_name", label: "Unresolved name" },
  { value: "has_corrected_profile", label: "Has corrected profile" },
  { value: "generic_token_not_an_entity", label: "Generic token" },
];

const STATUS_TONE: Record<string, "neutral" | "green" | "yellow" | "red"> = {
  official_host_name: "green",
  has_corrected_profile: "green",
  unresolved_name: "yellow",
  generic_token_not_an_entity: "red",
};

// The 480-name candidate universe the research inherited, with each name's
// resolution status against official event hosts and corrected profiles.
export function Universe() {
  const stats = useQuery(api.paul.candidateStats);
  const [status, setStatus] = useState("");
  const { results, status: loadStatus, loadMore } = usePaginatedQuery(
    api.paul.candidates,
    status ? { status } : {},
    { initialNumItems: 50 },
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Candidate universe"
        subtitle="480 names mined from host lists, sponsors, and speaker fields — most are fragments, not entities"
        action={
          <div className="w-64">
            <Select
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
              ariaLabel="Filter by status"
            />
          </div>
        }
      />

      {stats ? (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Total names" value={stats.total} />
          <Stat label="Official hosts" value={stats.officialHostName} />
          <Stat label="Unresolved" value={stats.unresolvedName} />
          <Stat label="Corrected profile" value={stats.hasCorrectedProfile} />
          <Stat label="Generic tokens" value={stats.genericToken} />
        </div>
      ) : null}

      <Panel>
        {results.length === 0 && loadStatus !== "LoadingFirstPage" ? (
          <EmptyState message="No candidates with this status." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-edge text-xs text-neutral-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Host events</th>
                <th className="px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {results.map((c) => (
                <tr
                  key={c._id}
                  className="border-b border-edge align-top last:border-0"
                >
                  <td className="px-4 py-3 text-white">{c.name}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[c.status] ?? "neutral"}>
                      {c.status.replaceAll("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {c.officialHostEvents ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{c.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {loadStatus === "CanLoadMore" || loadStatus === "LoadingMore" ? (
          <div className="border-t border-edge p-3 text-center">
            <Button onClick={() => loadMore(50)}>Load more</Button>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Panel className="px-3 py-2">
      <div className="text-lg text-white">{value}</div>
      <div className="text-xs text-neutral-500">{label}</div>
    </Panel>
  );
}
