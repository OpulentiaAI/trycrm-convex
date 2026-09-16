import { usePaginatedQuery, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  PageHeader,
  Panel,
  TextLink,
} from "../components/ui";

type Filter =
  | { kind: "all" }
  | { kind: "screening"; value: "qualified" | "pending" | "excluded" | "inventory" }
  | { kind: "topN"; value: 10 | 20 };

const FILTERS: Array<{ filter: Filter; label: string }> = [
  { filter: { kind: "all" }, label: "All" },
  { filter: { kind: "screening", value: "qualified" }, label: "Qualified" },
  { filter: { kind: "topN", value: 20 }, label: "Top 20" },
  { filter: { kind: "topN", value: 10 }, label: "Top 10" },
  { filter: { kind: "screening", value: "pending" }, label: "Pending" },
  { filter: { kind: "screening", value: "excluded" }, label: "Excluded" },
  { filter: { kind: "screening", value: "inventory" }, label: "Official 838" },
];

const SCREENING_TONE = {
  qualified: "green",
  pending: "yellow",
  excluded: "red",
  inventory: "neutral",
} as const;

// The Climate Week event inventory: 838 official listings merged with the
// screened ecosystem list, 915 unique rows, every source column preserved.
export function Events() {
  const stats = useQuery(api.paul.eventStats);
  const [filter, setFilter] = useState<Filter>({ kind: "screening", value: "qualified" });
  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const args =
    search.trim() !== ""
      ? { search: search.trim() }
      : filter.kind === "screening"
        ? { screening: filter.value }
        : filter.kind === "topN"
          ? { topN: filter.value }
          : {};
  const { results, status, loadMore } = usePaginatedQuery(
    api.paul.events,
    args,
    { initialNumItems: 50 },
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Climate Week events"
        subtitle="915 unique events — the official 838-row inventory merged with the 230-row screened ecosystem list"
        action={
          <div className="w-64">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search titles…"
            />
          </div>
        }
      />

      {stats ? (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <Stat label="Total" value={stats.total} />
          <Stat label="Qualified" value={stats.qualified} />
          <Stat label="Top 20" value={stats.top20} />
          <Stat label="Top 10" value={stats.top10} />
          <Stat label="Pending" value={stats.pending} />
          <Stat label="Excluded" value={stats.excluded} />
          <Stat label="Luma-only" value={stats.lumaOnly} />
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map(({ filter: f, label }) => {
          const active =
            f.kind === filter.kind &&
            (f.kind !== "all" ? f.value === (filter as { value?: unknown }).value : true);
          return (
            <button
              key={label}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-accent bg-raised text-white"
                  : "border-edge bg-panel text-neutral-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <Panel>
        {results.length === 0 && status !== "LoadingFirstPage" ? (
          <EmptyState message="No events match this filter." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-edge text-xs text-neutral-500">
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Host</th>
                <th className="px-4 py-3 font-medium">Where</th>
                <th className="px-4 py-3 font-medium">Screening</th>
                <th className="px-4 py-3 font-medium">Lists</th>
              </tr>
            </thead>
            <tbody>
              {results.map((event) => (
                <EventRow
                  key={event.key}
                  event={event}
                  open={openKey === event.key}
                  onToggle={() =>
                    setOpenKey(openKey === event.key ? null : event.key)
                  }
                />
              ))}
            </tbody>
          </table>
        )}
        {status === "CanLoadMore" || status === "LoadingMore" ? (
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

function EventRow({
  event,
  open,
  onToggle,
}: {
  event: Doc<"paulEvents">;
  open: boolean;
  onToggle: () => void;
}) {
  const when =
    event.dateLocal ??
    event.date ??
    event.dateTime ??
    event.dateTimeFull ??
    "";
  const where =
    event.neighborhood ?? event.borough ?? event.location ?? event.venue ?? "";
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer border-b border-edge align-top transition-colors last:border-0 hover:bg-raised"
      >
        <td className="whitespace-nowrap px-4 py-3 text-neutral-400">{when}</td>
        <td className="px-4 py-3 text-white">
          <div>{event.title}</div>
          {event.priorityRank !== undefined ? (
            <div className="mt-0.5 text-xs text-accent">
              rank #{event.priorityRank}
              {event.rankScore !== undefined
                ? ` · score ${event.rankScore}`
                : ""}
            </div>
          ) : null}
        </td>
        <td className="px-4 py-3 text-neutral-300">{event.host ?? ""}</td>
        <td className="px-4 py-3 text-neutral-400">{where}</td>
        <td className="px-4 py-3">
          <Badge tone={SCREENING_TONE[event.screening]}>
            {event.origin === "ecosystem-luma" && event.screening === "inventory"
              ? "luma-only"
              : event.screening}
          </Badge>
        </td>
        <td className="px-4 py-3 text-xs text-neutral-500">
          {event.lists.join(", ")}
        </td>
      </tr>
      {open ? (
        <tr className="border-b border-edge bg-ink">
          <td colSpan={6} className="px-4 py-4">
            <EventDetail event={event} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function EventDetail({ event }: { event: Doc<"paulEvents"> }) {
  const verifications = useQuery(
    api.paul.eventVerifications,
    event.recordId ? { recordId: event.recordId } : "skip",
  );
  const relationships = useQuery(
    api.paul.eventRelationships,
    event.title ? { eventTitle: event.title } : "skip",
  );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Field label="Details">
        {[
          ["type", event.type ?? event.format],
          ["time", event.timeLocal ?? event.dateTimeFull],
          ["timezone", event.timezone],
          ["address", event.address ?? event.venue],
          ["duration", event.duration],
          ["themes", event.themes],
          ["target audience", event.targetAudience],
          ["registration", event.observedRegistrationStatus],
          ["access", event.accessRequirements],
          ["price", event.priceCurrency],
          ["source calendars", event.sourceCalendars],
        ].map(([k, val]) =>
          val ? (
            <div key={k} className="flex gap-2">
              <span className="w-28 shrink-0 text-neutral-500">{k}</span>
              <span className="text-neutral-300">{val}</span>
            </div>
          ) : null,
        )}
        <div className="mt-2 flex gap-4">
          {event.registrationUrl ? (
            <TextLink href={event.registrationUrl}>Register</TextLink>
          ) : null}
          {event.officialUrl ? (
            <TextLink href={event.officialUrl}>Official</TextLink>
          ) : null}
          {event.url ? <TextLink href={event.url}>Listing</TextLink> : null}
        </div>
      </Field>
      <Field label="Screening evidence">
        {[
          ["net signal", event.netSignal],
          ["icp score", event.icpScore],
          ["icp rationale", event.icpFitRationale],
          ["evidence level", event.evidenceLevel],
          ["networking", event.networkingEvidence],
          ["confirmed people/orgs", event.confirmedPeopleOrgs],
          ["commercial in desc", event.descHasCommercial],
          ["uncertainty", event.remainingUncertainty],
          ["observed", event.observationTime],
        ].map(([k, val]) =>
          val !== undefined && val !== "" ? (
            <div key={k} className="flex gap-2">
              <span className="w-32 shrink-0 text-neutral-500">{k}</span>
              <span className="text-neutral-300">{String(val)}</span>
            </div>
          ) : null,
        )}
        {relationships && relationships.length > 0 ? (
          <div className="mt-2">
            <div className="mb-1 text-neutral-500">entity links</div>
            {relationships.map((r) => (
              <div key={r._id} className="text-neutral-300">
                {r.entity} · {r.relationType}
                {r.confidence ? ` (${r.confidence})` : ""}
              </div>
            ))}
          </div>
        ) : null}
      </Field>
      <Field label="Luma verification">
        {verifications === undefined ? (
          <span className="text-neutral-500">Loading…</span>
        ) : verifications.length === 0 ? (
          <span className="text-neutral-500">No re-verification on file.</span>
        ) : (
          verifications.map((ver) => (
            <div key={ver._id} className="space-y-1">
              <div className="flex gap-2">
                <span className="w-28 shrink-0 text-neutral-500">status</span>
                <span className="text-neutral-300">
                  {ver.registrationAvailability}
                  {ver.approvalRequired ? " · approval required" : ""}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="w-28 shrink-0 text-neutral-500">observed</span>
                <span className="text-neutral-300">{ver.observedAt}</span>
              </div>
              {ver.description ? (
                <p className="mt-1 text-neutral-400">{ver.description}</p>
              ) : null}
              {ver.sourceUrl ? (
                <TextLink href={ver.sourceUrl}>Source page</TextLink>
              ) : null}
            </div>
          ))
        )}
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  );
}
