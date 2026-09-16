import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation } from "./_generated/server";
import { logEvent } from "./logs";
import { authedQuery } from "./model/functions";
import { seedPaulWorkspace } from "./model/paulSeed";
import { auditFindings } from "./paulData/auditFindings";
import { candidates as candidateRows } from "./paulData/candidates";
import { documents } from "./paulData/documents";
import { events0 } from "./paulData/events0";
import { events1 } from "./paulData/events1";
import { events2 } from "./paulData/events2";
import { events3 } from "./paulData/events3";
import { intentMappings } from "./paulData/intentMappings";
import { laneProfiles } from "./paulData/laneProfiles";
import { meta } from "./paulData/meta";
import { prospects } from "./paulData/prospects";
import { relationships } from "./paulData/relationships";
import { verifications } from "./paulData/verifications";

const ALL_EVENTS = [...events0, ...events1, ...events2, ...events3];

const PAUL_TABLES = [
  "paulEvents",
  "paulVerifications",
  "paulCandidates",
  "paulProspects",
  "paulLaneProfiles",
  "paulRelationships",
  "paulAuditFindings",
  "paulIntentMappings",
  "paulDocuments",
] as const;

const CHUNK = 200;

const screeningValidator = v.union(
  v.literal("inventory"),
  v.literal("qualified"),
  v.literal("pending"),
  v.literal("excluded"),
);

// ---------------------------------------------------------------------------
// Loaders. The paul tables are bulk data, not live user records: loadAll wipes
// and reloads them in scheduled chunks so a single mutation never approaches
// the write limit. Called by demo:seedPublic / demo:reset after the workspace
// rows land, so the prospect -> company join resolves against seeded companies.
export const loadAll = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    for (const table of PAUL_TABLES) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) {
        await ctx.db.delete(table, row._id);
      }
    }
    await ctx.scheduler.runAfter(0, internal.paul.loadChunk, {
      tableIndex: 0,
      cursor: 0,
    });
    return null;
  },
});

export const loadChunk = internalMutation({
  args: { tableIndex: v.number(), cursor: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const table = PAUL_TABLES[args.tableIndex];
    const end = args.cursor + CHUNK;


    if (table === "paulEvents") {
      for (const row of ALL_EVENTS.slice(args.cursor, end)) {
        await ctx.db.insert("paulEvents", row);

      }
    } else if (table === "paulVerifications") {
      for (const row of verifications.slice(args.cursor, end)) {
        await ctx.db.insert("paulVerifications", row);

      }
    } else if (table === "paulCandidates") {
      for (const row of candidateRows.slice(args.cursor, end)) {
        await ctx.db.insert("paulCandidates", row);

      }
    } else if (table === "paulProspects") {
      for (const row of prospects.slice(args.cursor, end)) {
        const company = await ctx.db
          .query("companies")
          .withIndex("by_name", (q) => q.eq("name", row.canonicalName))
          .first();
        await ctx.db.insert("paulProspects", {
          ...row,
          companyId: company?._id,
        });

      }
    } else if (table === "paulLaneProfiles") {
      for (const row of laneProfiles.slice(args.cursor, end)) {
        await ctx.db.insert("paulLaneProfiles", row);

      }
    } else if (table === "paulRelationships") {
      for (const row of relationships.slice(args.cursor, end)) {
        await ctx.db.insert("paulRelationships", row);

      }
    } else if (table === "paulAuditFindings") {
      for (const row of auditFindings.slice(args.cursor, end)) {
        await ctx.db.insert("paulAuditFindings", row);

      }
    } else if (table === "paulIntentMappings") {
      for (const row of intentMappings.slice(args.cursor, end)) {
        await ctx.db.insert("paulIntentMappings", row);

      }
    } else if (table === "paulDocuments") {
      for (const row of documents.slice(args.cursor, end)) {
        await ctx.db.insert("paulDocuments", row);

      }
    }

    const total = TABLE_LENGTHS[table];
    if (end < total) {
      await ctx.scheduler.runAfter(0, internal.paul.loadChunk, {
        tableIndex: args.tableIndex,
        cursor: end,
      });
    } else if (args.tableIndex + 1 < PAUL_TABLES.length) {
      await ctx.scheduler.runAfter(0, internal.paul.loadChunk, {
        tableIndex: args.tableIndex + 1,
        cursor: 0,
      });
    } else {
      await logEvent(ctx, {
        kind: "C",
        fn: "paul:loadChunk",
        status: "success",
        message: "Paul's Climate Week dataset loaded (915 events, 480 candidates, 26 prospects, 24 lane profiles, 79 relationships, 12 audit findings, 24 intent mappings, 32 verifications, 12 documents)",
      });
    }
    return null;
  },
});

const TABLE_LENGTHS: Record<(typeof PAUL_TABLES)[number], number> = {
  paulEvents: ALL_EVENTS.length,
  paulVerifications: verifications.length,
  paulCandidates: candidateRows.length,
  paulProspects: prospects.length,
  paulLaneProfiles: laneProfiles.length,
  paulRelationships: relationships.length,
  paulAuditFindings: auditFindings.length,
  paulIntentMappings: intentMappings.length,
  paulDocuments: documents.length,
};

// Backstop for the paul tables if they were cleared without the workspace
// (e.g. a hand-run reset of only the paul tables). Idempotent.
export const seed = mutation({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const existing = await ctx.db.query("paulEvents").first();
    if (existing) return false;
    await ctx.scheduler.runAfter(0, internal.paul.loadAll, {});
    return true;
  },
});

// Seed Paul's workspace + schedule the paul-table load. Public like
// demo:seedPublic — it is the same first-boot path for this fork.
export const seedWorkspace = mutation({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const existing = await ctx.db.query("workspace").first();
    if (existing) return false;
    await seedPaulWorkspace(ctx, Date.now());
    await ctx.scheduler.runAfter(0, internal.paul.loadAll, {});
    return true;
  },
});

// ---------------------------------------------------------------------------
// Reads.

// Rubric, scope notes, and verification counts, straight from the source docs.
export const researchMeta = authedQuery({
  args: {},
  returns: v.any(),
  handler: async () => meta,
});

export const eventStats = authedQuery({
  args: {},
  returns: v.object({
    total: v.number(),
    inventory: v.number(),
    qualified: v.number(),
    pending: v.number(),
    excluded: v.number(),
    top10: v.number(),
    top20: v.number(),
    lumaOnly: v.number(),
  }),
  handler: async (ctx) => {
    const byScreening = async (s: "inventory" | "qualified" | "pending" | "excluded") =>
      (
        await ctx.db
          .query("paulEvents")
          .withIndex("by_screening", (q) => q.eq("screening", s))
          .collect()
      ).length;
    const top20 = (
      await ctx.db
        .query("paulEvents")
        .withIndex("by_priorityRank", (q) => q.lte("priorityRank", 20))
        .collect()
    ).length;
    const top10 = (
      await ctx.db
        .query("paulEvents")
        .withIndex("by_priorityRank", (q) => q.lte("priorityRank", 10))
        .collect()
    ).length;
    const lumaOnly = (
      await ctx.db
        .query("paulEvents")
        .withIndex("by_origin", (q) => q.eq("origin", "ecosystem-luma"))
        .collect()
    ).length;
    const qualified = await byScreening("qualified");
    const pending = await byScreening("pending");
    const excluded = await byScreening("excluded");
    const inventory = await byScreening("inventory");
    return {
      total: qualified + pending + excluded + inventory,
      inventory,
      qualified,
      pending,
      excluded,
      top10,
      top20,
      lumaOnly,
    };
  },
});

export const events = authedQuery({
  args: {
    screening: v.optional(screeningValidator),
    topN: v.optional(v.union(v.literal(10), v.literal(20))),
    search: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    if (args.search) {
      return await ctx.db
        .query("paulEvents")
        .withSearchIndex("search_title", (q) =>
          q.search("title", args.search!),
        )
        .paginate(args.paginationOpts);
    }
    if (args.topN !== undefined) {
      return await ctx.db
        .query("paulEvents")
        .withIndex("by_priorityRank", (q) =>
          q.lte("priorityRank", args.topN!),
        )
        .paginate(args.paginationOpts);
    }
    if (args.screening) {
      return await ctx.db
        .query("paulEvents")
        .withIndex("by_screening", (q) =>
          q.eq("screening", args.screening!),
        )
        .paginate(args.paginationOpts);
    }
    return await ctx.db.query("paulEvents").paginate(args.paginationOpts);
  },
});

export const event = authedQuery({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paulEvents")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});

export const eventVerifications = authedQuery({
  args: { recordId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paulVerifications")
      .withIndex("by_recordId", (q) => q.eq("recordId", args.recordId))
      .collect();
  },
});

export const eventRelationships = authedQuery({
  args: { entity: v.optional(v.string()), eventTitle: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.eventTitle) {
      return await ctx.db
        .query("paulRelationships")
        .withIndex("by_eventTitle", (q) => q.eq("eventTitle", args.eventTitle!))
        .collect();
    }
    if (args.entity) {
      return await ctx.db
        .query("paulRelationships")
        .withIndex("by_entity", (q) => q.eq("entity", args.entity!))
        .collect();
    }
    return await ctx.db.query("paulRelationships").collect();
  },
});

export const candidates = authedQuery({
  args: {
    status: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("paulCandidates")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .paginate(args.paginationOpts);
    }
    return await ctx.db.query("paulCandidates").paginate(args.paginationOpts);
  },
});

export const candidateStats = authedQuery({
  args: {},
  returns: v.object({
    total: v.number(),
    officialHostName: v.number(),
    unresolvedName: v.number(),
    hasCorrectedProfile: v.number(),
    genericToken: v.number(),
  }),
  handler: async (ctx) => {
    const count = async (status: string) =>
      (
        await ctx.db
          .query("paulCandidates")
          .withIndex("by_status", (q) => q.eq("status", status))
          .collect()
      ).length;
    const officialHostName = await count("official_host_name");
    const unresolvedName = await count("unresolved_name");
    const hasCorrectedProfile = await count("has_corrected_profile");
    const genericToken = await count("generic_token_not_an_entity");
    return {
      total: officialHostName + unresolvedName + hasCorrectedProfile + genericToken,
      officialHostName,
      unresolvedName,
      hasCorrectedProfile,
      genericToken,
    };
  },
});

export const prospectsList = authedQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("paulProspects").collect();
    return rows.sort(
      (a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER),
    );
  },
});

export const laneProfilesList = authedQuery({
  args: { lane: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.lane) {
      return await ctx.db
        .query("paulLaneProfiles")
        .withIndex("by_lane", (q) => q.eq("lane", args.lane!))
        .collect();
    }
    return await ctx.db.query("paulLaneProfiles").collect();
  },
});

export const relationshipsList = authedQuery({
  args: { entity: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.entity) {
      return await ctx.db
        .query("paulRelationships")
        .withIndex("by_entity", (q) => q.eq("entity", args.entity!))
        .collect();
    }
    return await ctx.db.query("paulRelationships").collect();
  },
});

export const auditFindingsList = authedQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("paulAuditFindings").collect();
  },
});

export const intentMappingsList = authedQuery({
  args: { disposition: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.disposition) {
      return await ctx.db
        .query("paulIntentMappings")
        .withIndex("by_disposition", (q) => q.eq("disposition", args.disposition!))
        .collect();
    }
    return await ctx.db.query("paulIntentMappings").collect();
  },
});

// List omits content so the payload stays small; open one row for the body.
export const documentsList = authedQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("paulDocuments").collect();
    return rows.map(({ content: _content, ...rest }) => rest);
  },
});

export const document = authedQuery({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paulDocuments")
      .withIndex("by_path", (q) => q.eq("path", args.path))
      .first();
  },
});
