// Embedded MCP server (@vibeflowai/convex-mcp) — serves this app's public
// Convex functions as MCP tools on POST /mcp so any agent pointed at a local
// build can pull data, add records, run analysis, and drive the app.
//
// Public by default (whoever runs the app locally). To secure a deployed
// instance: `npx convex env set MCP_AUTH_TOKEN <token>` — optional:true means
// the route stays open until the variable is set.
//
// paul.* tools read the Climate Week research tables; there are no paul write
// tools because those tables are reseeded verbatim from paul-data/. CRM writes
// go through the same writeMutation paths the UI uses. No remove/delete tools
// are exposed on an open endpoint — destructive writes stay UI-only.

import { api } from "./_generated/api";
import {
  bearerAuth,
  defineMcpServer,
  prompt,
  promptResult,
  resource,
  tool,
  userText,
} from "@vibeflowai/convex-mcp";

const DEAL_STAGES = [
  "QUALIFIED",
  "MEETING",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const;

const ACTIVITY_TYPES = [
  "NOTE",
  "CALL",
  "EMAIL",
  "MEETING",
  "TASK",
  "STAGE_CHANGE",
  "ENRICHMENT",
] as const;

const ENTITIES = ["company", "contact", "deal"] as const;

const SCREENING = ["inventory", "qualified", "pending", "excluded"] as const;

const MCP_AUTH = bearerAuth({ env: "MCP_AUTH_TOKEN", optional: true });

export const mcp = defineMcpServer({
  name: "paulcrm",
  version: "1.0.0",

  tools: {
    search: {
      global: tool(api.search.global, {
        kind: "query",
        description: "Search companies, contacts, and deals by name",
        args: (z) => ({ q: z.string() }),
      }),
    },

    companies: {
      list: tool(api.companies.list, {
        kind: "query",
        description: "List companies (paginated); optional name search",
        args: (z) => ({
          paginationOpts: z
            .object({
              numItems: z.number().default(50),
              cursor: z.string().nullable().default(null),
            })
            .default({ numItems: 50, cursor: null }),
          search: z.string().optional(),
        }),
      }),
      get: tool(api.companies.get, {
        kind: "query",
        description: "Get one company with its field values and contacts",
        args: (z) => ({ companyId: z.string() }),
      }),
      create: tool(api.companies.create, {
        kind: "mutation",
        description: "Add a company",
        args: (z) => ({
          name: z.string(),
          domain: z.string().optional(),
          industry: z.string().optional(),
        }),
      }),
      update: tool(api.companies.update, {
        kind: "mutation",
        description: "Update a company's fields",
        args: (z) => ({
          companyId: z.string(),
          name: z.string().optional(),
          domain: z.string().optional(),
          industry: z.string().optional(),
          description: z.string().optional(),
          ownerId: z.string().optional(),
          primaryContactId: z.string().optional(),
        }),
      }),
    },

    contacts: {
      list: tool(api.contacts.list, {
        kind: "query",
        description: "List contacts (paginated); optional name search",
        args: (z) => ({
          paginationOpts: z
            .object({
              numItems: z.number().default(50),
              cursor: z.string().nullable().default(null),
            })
            .default({ numItems: 50, cursor: null }),
          search: z.string().optional(),
        }),
      }),
      get: tool(api.contacts.get, {
        kind: "query",
        description: "Get one contact",
        args: (z) => ({ contactId: z.string() }),
      }),
      create: tool(api.contacts.create, {
        kind: "mutation",
        description: "Add a contact, optionally linked to a company",
        args: (z) => ({
          name: z.string(),
          email: z.string().optional(),
          title: z.string().optional(),
          companyId: z.string().optional(),
        }),
      }),
      update: tool(api.contacts.update, {
        kind: "mutation",
        description: "Update a contact",
        args: (z) => ({
          contactId: z.string(),
          name: z.string().optional(),
          email: z.string().optional(),
          title: z.string().optional(),
          companyId: z.string().optional(),
          ownerId: z.string().optional(),
        }),
      }),
    },

    deals: {
      board: tool(api.deals.board, {
        kind: "query",
        description: "All deals grouped by pipeline stage",
        args: () => ({}),
      }),
      get: tool(api.deals.get, {
        kind: "query",
        description: "Get one deal",
        args: (z) => ({ dealId: z.string() }),
      }),
      create: tool(api.deals.create, {
        kind: "mutation",
        description:
          "Add a deal. amountMinor is integer minor units (cents); stage is one of the pipeline stages",
        args: (z) => ({
          name: z.string(),
          companyId: z.string(),
          amountMinor: z.number(),
          currency: z.string(),
          stage: z.enum(DEAL_STAGES),
          expectedCloseAt: z.number().optional(),
        }),
      }),
      update: tool(api.deals.update, {
        kind: "mutation",
        description: "Update a deal",
        args: (z) => ({
          dealId: z.string(),
          name: z.string().optional(),
          amountMinor: z.number().optional(),
          ownerId: z.string().optional(),
          expectedCloseAt: z.number().optional(),
        }),
      }),
      changeStage: tool(api.deals.changeStage, {
        kind: "mutation",
        description: "Move a deal to a different pipeline stage",
        args: (z) => ({
          dealId: z.string(),
          stage: z.enum(DEAL_STAGES),
        }),
      }),
    },

    activities: {
      forCompany: tool(api.activities.forCompany, {
        kind: "query",
        description: "Activity timeline for a company",
        args: (z) => ({ companyId: z.string() }),
      }),
      forContact: tool(api.activities.forContact, {
        kind: "query",
        description: "Activity timeline for a contact",
        args: (z) => ({ contactId: z.string() }),
      }),
      forDeal: tool(api.activities.forDeal, {
        kind: "query",
        description: "Activity timeline for a deal",
        args: (z) => ({ dealId: z.string() }),
      }),
      openTasks: tool(api.activities.openTasks, {
        kind: "query",
        description: "Open tasks across the workspace",
        args: () => ({}),
      }),
      create: tool(api.activities.create, {
        kind: "mutation",
        description:
          "Log a note/call/email/meeting or create a task on a company, contact, or deal",
        args: (z) => ({
          type: z.enum(ACTIVITY_TYPES),
          body: z.string(),
          companyId: z.string().optional(),
          contactId: z.string().optional(),
          dealId: z.string().optional(),
          dueAt: z.number().optional(),
          remindMe: z.boolean().optional(),
        }),
      }),
      completeTask: tool(api.activities.completeTask, {
        kind: "mutation",
        description: "Mark a task activity complete",
        args: (z) => ({ activityId: z.string() }),
      }),
    },

    dashboard: {
      summary: tool(api.dashboard.summary, {
        kind: "query",
        description:
          "Pipeline totals, open deal count, won amount, company/contact counts",
        args: () => ({}),
      }),
      recentActivity: tool(api.dashboard.recentActivity, {
        kind: "query",
        description: "Most recent workspace activity",
        args: () => ({}),
      }),
    },

    fields: {
      listDefinitions: tool(api.fields.listDefinitions, {
        kind: "query",
        description: "Custom field definitions for an entity type",
        args: (z) => ({ entity: z.enum(ENTITIES) }),
      }),
      forEntity: tool(api.fields.forEntity, {
        kind: "query",
        description: "Custom field definitions plus values for one record",
        args: (z) => ({
          entity: z.enum(ENTITIES),
          entityId: z.string(),
        }),
      }),
      setValue: tool(api.fields.setValue, {
        kind: "mutation",
        description: "Set a custom field value on a record",
        args: (z) => ({
          fieldId: z.string(),
          entityId: z.string(),
          value: z.string(),
        }),
      }),
    },

    users: {
      list: tool(api.users.list, {
        kind: "query",
        description: "Workspace members",
        args: () => ({}),
      }),
    },

    logs: {
      list: tool(api.logs.list, {
        kind: "query",
        description: "Function call audit log (agent runs, writes)",
        args: () => ({}),
      }),
    },

    paul: {
      events: tool(api.paul.events, {
        kind: "query",
        description:
          "Climate Week NYC 2026 events (915 unique: official 838 inventory + Luma adds). Filter by screening, topN ranked list, or title search. Paginated.",
        args: (z) => ({
          screening: z.enum(SCREENING).optional(),
          topN: z.union([z.literal(10), z.literal(20)]).optional(),
          search: z.string().optional(),
          paginationOpts: z
            .object({
              numItems: z.number().default(50),
              cursor: z.string().nullable().default(null),
            })
            .default({ numItems: 50, cursor: null }),
        }),
      }),
      event: tool(api.paul.event, {
        kind: "query",
        description: "One Climate Week event by its key (from paul.events rows)",
        args: (z) => ({ key: z.string() }),
      }),
      eventStats: tool(api.paul.eventStats, {
        kind: "query",
        description:
          "Counts by screening status, Top 10/20 ranked membership, Luma-only adds",
        args: () => ({}),
      }),
      eventVerifications: tool(api.paul.eventVerifications, {
        kind: "query",
        description: "Luma re-verification evidence for an event recordId",
        args: (z) => ({ recordId: z.string() }),
      }),
      eventRelationships: tool(api.paul.eventRelationships, {
        kind: "query",
        description: "Entity ↔ event evidence links, by entity or event title",
        args: (z) => ({
          entity: z.string().optional(),
          eventTitle: z.string().optional(),
        }),
      }),
      candidates: tool(api.paul.candidates, {
        kind: "query",
        description:
          "480-name candidate universe mined from hosts/sponsors/speakers. Filter by status. Paginated.",
        args: (z) => ({
          status: z.string().optional(),
          paginationOpts: z
            .object({
              numItems: z.number().default(50),
              cursor: z.string().nullable().default(null),
            })
            .default({ numItems: 50, cursor: null }),
        }),
      }),
      candidateStats: tool(api.paul.candidateStats, {
        kind: "query",
        description: "Candidate counts by resolution status",
        args: () => ({}),
      }),
      prospectsList: tool(api.paul.prospectsList, {
        kind: "query",
        description:
          "The 26 corrected, scored identities — rank, score, disposition, warm path. Source data, not a pipeline.",
        args: () => ({}),
      }),
      laneProfilesList: tool(api.paul.laneProfilesList, {
        kind: "query",
        description: "24 pre-correction lane profiles, kept for provenance",
        args: (z) => ({ lane: z.string().optional() }),
      }),
      relationshipsList: tool(api.paul.relationshipsList, {
        kind: "query",
        description: "All 79 entity ↔ event relationships, or one entity's",
        args: (z) => ({ entity: z.string().optional() }),
      }),
      auditFindingsList: tool(api.paul.auditFindingsList, {
        kind: "query",
        description:
          "12 identity-confusion audit findings and corrections (e.g. Crux Climate ≠ Crux Alliance)",
        args: () => ({}),
      }),
      intentMappingsList: tool(api.paul.intentMappingsList, {
        kind: "query",
        description: "Per-artifact keep/reshape/drop intent and target use",
        args: (z) => ({ disposition: z.string().optional() }),
      }),
      documentsList: tool(api.paul.documentsList, {
        kind: "query",
        description: "The 12 source documents (metadata only, no content)",
        args: () => ({}),
      }),
      document: tool(api.paul.document, {
        kind: "query",
        description: "Full verbatim content of one source document by path",
        args: (z) => ({ path: z.string() }),
      }),
      researchMeta: tool(api.paul.researchMeta, {
        kind: "query",
        description:
          "Rubric, scope, verification summary, and per-file sha256 for the dataset",
        args: () => ({}),
      }),
      seed: tool(api.paul.seed, {
        kind: "mutation",
        description:
          "Backstop: schedules the paul-table load if paulEvents is empty. No-op otherwise.",
        args: () => ({}),
        annotations: { destructiveHint: false, idempotentHint: true },
      }),
      seedWorkspace: tool(api.paul.seedWorkspace, {
        kind: "mutation",
        description:
          "First-boot seed: Paul's workspace + schedules the full dataset load. No-op when a workspace exists.",
        args: () => ({}),
        annotations: { destructiveHint: false, idempotentHint: true },
      }),
    },

    demo: {
      info: tool(api.demo.info, {
        kind: "query",
        description: "Demo mode state and reset schedule",
        args: () => ({}),
      }),
      requestReset: tool(api.demo.requestReset, {
        kind: "mutation",
        description:
          "Wipes and reseeds every table (demo mode only — canonical data returns in ~a minute)",
        args: () => ({}),
        annotations: { destructiveHint: true },
      }),
    },
  },

  resources: {
    paul: {
      researchMeta: resource(api.paul.researchMeta, {
        kind: "query",
        uri: "paul://research/meta",
        title: "Research meta",
        description:
          "Rubric, verification summary, and sha256 manifest for the Climate Week dataset",
        mimeType: "application/json",
      }),
      documents: resource(api.paul.documentsList, {
        kind: "query",
        uri: "paul://documents",
        title: "Source documents",
        description: "The 12 dataset documents (metadata; fetch content via paul.document)",
        mimeType: "application/json",
      }),
    },
  },

  prompts: {
    paul: {
      briefing: prompt(
        {
          title: "Paul dataset briefing",
          description:
            "Semantics to read before analyzing the Climate Week research",
        },
        async () =>
          promptResult(
            [
              userText(
                "This workspace is Paul Cushman's Climate Week NYC 2026 research (Sep 20–27 2026). " +
                  "Read paul.* tools for the dataset and crm tools for the CRM. Key semantics: " +
                  "qualification ≠ admission — the 99 'qualified' events are vetted candidates, not confirmed entries. " +
                  "915 unique events = 838 official inventory + 77 Luma-only adds. " +
                  "priorityRank exists only on ranked CSVs (Top 10/20); most events are unranked. " +
                  "Crux Climate ≠ Crux Alliance — see paul.auditFindingsList for all identity corrections. " +
                  "The 26 prospects are scored identities for a fractional CRO's networking plan: " +
                  "source data, not a CRO pipeline — do not create deals for them. " +
                  "paul.* tables reseed verbatim from paul-data/ and are read-only; CRM writes go through companies/contacts/deals/activities tools.",
              ),
            ],
            "Paul Cushman Climate Week NYC 2026 dataset orientation",
          ),
      ),
    },
  },
});

export { MCP_AUTH };
