import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Deal stages carried over from upstream.
export const dealStage = v.union(
  v.literal("QUALIFIED"),
  v.literal("MEETING"),
  v.literal("PROPOSAL"),
  v.literal("NEGOTIATION"),
  v.literal("CLOSED_WON"),
  v.literal("CLOSED_LOST"),
);

export const activityType = v.union(
  v.literal("NOTE"),
  v.literal("CALL"),
  v.literal("EMAIL"),
  v.literal("MEETING"),
  v.literal("TASK"),
  v.literal("STAGE_CHANGE"),
  v.literal("ENRICHMENT"),
);

export const enrichmentStatus = v.union(
  v.literal("NONE"),
  v.literal("RESEARCHING"),
  v.literal("ENRICHED"),
  v.literal("FAILED"),
);

// Evidence bands from the upstream evidence ledger. Strong evidence writes to
// the record, weak evidence becomes a suggestion a human settles.
export const evidenceBand = v.union(
  v.literal("CONFIRMED"),
  v.literal("PROBABLE"),
  v.literal("POSSIBLE"),
  v.literal("WEAK"),
);

export default defineSchema({
  // Single tenant, on purpose. One row.
  workspace: defineTable({
    name: v.string(),
    demoMode: v.boolean(),
    // Sign-in allow list. Empty means nobody signs in, the safe direction to
    // fail. Unused while demoMode is true.
    allowedSignIn: v.array(v.string()),
    reportingCurrency: v.string(),
    agentModel: v.string(),
    lastResetAt: v.number(),
    // Which provider outbound notifications use. Resend is the default;
    // AgentMail adds a persistent inbox agents can also receive on. Optional
    // so existing rows keep working; undefined means "resend".
    emailProvider: v.optional(
      v.union(v.literal("resend"), v.literal("agentmail")),
    ),
    // Compose email configuration: the from identity and a signature that
    // appends to every outbound message. All optional; sends fall back to
    // a generic from line until these are set.
    emailFromName: v.optional(v.string()),
    emailFromAddress: v.optional(v.string()),
    emailSignature: v.optional(v.string()),
    // Which model provider the chat surfaces use. All optional keys; the
    // reply names the missing key when the chosen provider is not configured.
    aiProvider: v.optional(
      v.union(
        v.literal("openai"),
        v.literal("anthropic"),
        v.literal("openrouter"),
        v.literal("deepseek"),
        v.literal("grok"),
      ),
    ),
    // Sidebar personalization: item ids in display order, and ids hidden by
    // the Settings page. Both reset with the demo like everything else.
    sidebarOrder: v.optional(v.array(v.string())),
    sidebarHidden: v.optional(v.array(v.string())),
    // Slack integration. Everything optional and off by default; the env
    // vars (SLACK_WEBHOOK_URL, SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET) live on
    // the deployment, these rows hold the workspace preferences.
    slackEnabled: v.optional(v.boolean()),
    slackNotifyRecords: v.optional(v.boolean()),
    slackNotifyDeals: v.optional(v.boolean()),
    slackNotifyTasks: v.optional(v.boolean()),
    slackNotifyAgent: v.optional(v.boolean()),
    // Channel ID (bot token mode) plus the display name for the settings UI.
    // Webhook mode ignores both: the channel is baked into the URL.
    slackChannelId: v.optional(v.string()),
    slackChannelName: v.optional(v.string()),
    // The /crm agent bot toggle, and an optional email domain that widens
    // the Slack user match beyond the exact team member emails.
    slackBotEnabled: v.optional(v.boolean()),
    slackAllowedEmailDomain: v.optional(v.string()),
  }),

  // Workspace members. Demo seeds these; with Convex Auth enabled this table
  // maps to authenticated users.
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("owner"), v.literal("member")),
    avatarUrl: v.optional(v.string()),
  }).index("by_email", ["email"]),

  companies: defineTable({
    name: v.string(),
    domain: v.optional(v.string()),
    industry: v.optional(v.string()),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    primaryContactId: v.optional(v.id("contacts")),
    enrichmentStatus: enrichmentStatus,
    lastActivityAt: v.optional(v.number()),
  })
    .index("by_domain", ["domain"])
    .index("by_name", ["name"])
    .searchIndex("search_name", { searchField: "name" }),

  contacts: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    title: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    ownerId: v.optional(v.id("users")),
    avatarUrl: v.optional(v.string()),
    lastActivityAt: v.optional(v.number()),
  })
    .index("by_company", ["companyId"])
    .index("by_email", ["email"])
    .searchIndex("search_name", { searchField: "name" }),

  deals: defineTable({
    name: v.string(),
    companyId: v.id("companies"),
    stage: dealStage,
    // Money is integer minor units. Round once, at the boundary.
    amountMinor: v.number(),
    currency: v.string(),
    ownerId: v.optional(v.id("users")),
    primaryContactId: v.optional(v.id("contacts")),
    expectedCloseAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
  })
    .index("by_company", ["companyId"])
    .index("by_stage", ["stage"])
    .index("by_owner", ["ownerId"])
    .searchIndex("search_name", { searchField: "name" }),

  // Timeline entries for companies, contacts, and deals.
  activities: defineTable({
    type: activityType,
    body: v.string(),
    companyId: v.optional(v.id("companies")),
    contactId: v.optional(v.id("contacts")),
    dealId: v.optional(v.id("deals")),
    authorId: v.optional(v.id("users")),
    // Tasks
    dueAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    // Stage changes
    meta: v.optional(
      v.object({
        fromStage: v.optional(v.string()),
        toStage: v.optional(v.string()),
      }),
    ),
  })
    .index("by_company", ["companyId"])
    .index("by_contact", ["contactId"])
    .index("by_deal", ["dealId"])
    .index("by_type", ["type"]),

  // Custom fields per entity, with an agentFilled flag and an agentBrief that
  // tells the agent what to put in a field.
  fieldDefinitions: defineTable({
    entity: v.union(
      v.literal("company"),
      v.literal("contact"),
      v.literal("deal"),
    ),
    key: v.string(),
    label: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("number"),
      v.literal("select"),
      v.literal("date"),
    ),
    options: v.optional(v.array(v.string())),
    order: v.number(),
    archived: v.boolean(),
    agentFilled: v.boolean(),
    agentBrief: v.optional(v.string()),
  }).index("by_entity_and_key", ["entity", "key"]),

  // Per-entity table preferences and record defaults, one row per entity.
  // Column prefs are stored sparsely: only keys the user touched appear, and
  // the array order is the display order. Unknown keys are ignored on read so
  // renamed or archived fields degrade cleanly.
  tableSettings: defineTable({
    entity: v.union(
      v.literal("company"),
      v.literal("contact"),
      v.literal("deal"),
    ),
    columns: v.array(
      v.object({
        key: v.string(),
        label: v.optional(v.string()),
        hidden: v.optional(v.boolean()),
        pinned: v.optional(v.boolean()),
      }),
    ),
    defaultOwnerId: v.optional(v.id("users")),
    defaultIndustry: v.optional(v.string()),
    defaultStage: v.optional(dealStage),
    defaultCurrency: v.optional(v.string()),
    autoEnrich: v.optional(v.boolean()),
  }).index("by_entity", ["entity"]),

  fieldValues: defineTable({
    fieldId: v.id("fieldDefinitions"),
    // The record this value belongs to, as a string id into companies,
    // contacts, or deals.
    entityId: v.string(),
    value: v.string(),
  })
    .index("by_entityId", ["entityId"])
    .index("by_field_and_entityId", ["fieldId", "entityId"]),

  // The agent work queue. The queue is a table: claimDue is a mutation that
  // reads by index and writes a lease, and Convex serializes mutations so two
  // dispatchers claim disjoint work with no lock hint.
  agentTasks: defineTable({
    kind: v.union(
      v.literal("ENRICH_COMPANY"),
      v.literal("RECHECK_CONTACT"),
      v.literal("BRIEF_OWNER"),
      v.literal("CUSTOM"),
    ),
    // state is denormalized on purpose: indexes cannot express
    // "where finishedAt is null", so state carries that as an indexed value.
    state: v.union(v.literal("open"), v.literal("done"), v.literal("failed")),
    reason: v.string(),
    companyId: v.optional(v.id("companies")),
    contactId: v.optional(v.id("contacts")),
    dealId: v.optional(v.id("deals")),
    priority: v.number(),
    dueAt: v.number(),
    leasedUntil: v.optional(v.number()),
    attempts: v.number(),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    result: v.optional(v.string()),
  })
    .index("by_state_and_dueAt", ["state", "dueAt"])
    .index("by_company", ["companyId"])
    .index("by_contact", ["contactId"]),

  // Agent builder: definitions are data, versions are rows, deploying is a
  // pointer move. No build, no redeploy.
  agentDefinitions: defineTable({
    name: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("deployed"),
      v.literal("paused"),
      v.literal("archived"),
    ),
    currentVersionId: v.optional(v.id("agentVersions")),
    trigger: v.object({
      kind: v.union(
        v.literal("manual"),
        v.literal("schedule"),
        v.literal("event"),
      ),
      cronspec: v.optional(v.string()),
      event: v.optional(v.string()),
    }),
  }),

  agentVersions: defineTable({
    agentId: v.id("agentDefinitions"),
    number: v.number(),
    instructions: v.string(),
    // The manifest names which of the compiled tools a version may call, so
    // an agent built in the UI cannot invent a tool that does not exist.
    toolNames: v.array(v.string()),
    model: v.string(),
    deployedAt: v.optional(v.number()),
  }).index("by_agent_and_number", ["agentId", "number"]),

  agentRuns: defineTable({
    agentId: v.optional(v.id("agentDefinitions")),
    taskId: v.optional(v.id("agentTasks")),
    companyId: v.optional(v.id("companies")),
    contactId: v.optional(v.id("contacts")),
    status: v.union(
      v.literal("running"),
      v.literal("done"),
      v.literal("failed"),
    ),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    steps: v.array(
      v.object({
        at: v.number(),
        kind: v.union(
          v.literal("plan"),
          v.literal("tool"),
          v.literal("observation"),
          v.literal("discard"),
          v.literal("write"),
          v.literal("question"),
        ),
        text: v.string(),
      }),
    ),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
  })
    .index("by_agent", ["agentId"])
    .index("by_company", ["companyId"])
    .index("by_contact", ["contactId"]),

  // The evidence ledger. Tools report what they observed; the ledger prices
  // the observation and decides the band. No tool accepts a confidence score.
  facts: defineTable({
    entityType: v.union(
      v.literal("company"),
      v.literal("contact"),
      v.literal("deal"),
    ),
    entityId: v.string(),
    field: v.string(),
    value: v.string(),
    evidenceKind: v.string(),
    band: evidenceBand,
    sourceUrl: v.optional(v.string()),
    // Weak evidence becomes a suggestion a human settles.
    settled: v.union(
      v.literal("written"),
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
  }).index("by_entityId", ["entityId"]),

  // Workspace-wide Ask chats, mapped to Agent component threads. Unlike
  // chatThreads these are not tied to a record: archive and delete are
  // first-class, like a chat app.
  askThreads: defineTable({
    threadId: v.string(),
    title: v.string(),
    archived: v.boolean(),
    lastMessageAt: v.number(),
  }).index("by_threadId", ["threadId"]),

  // The activity log the Activity page renders, in the shape of the Convex
  // dashboard logs: one row per notable function outcome. Bounded by the
  // demo reset and the Clear button.
  logEvents: defineTable({
    kind: v.union(v.literal("M"), v.literal("A"), v.literal("C")),
    fn: v.string(),
    status: v.union(
      v.literal("success"),
      v.literal("error"),
      v.literal("info"),
    ),
    message: v.string(),
  }),

  // Verified Slack users. The /crm bot maps a Slack user id to a workspace
  // member by email (users.info via the bot token) and caches the match
  // here. Rows older than 30 days re-verify so departed teammates age out.
  slackIdentities: defineTable({
    slackUserId: v.string(),
    email: v.string(),
    name: v.string(),
    verifiedAt: v.number(),
  }).index("by_slackUserId", ["slackUserId"]),

  // Per-record agent chat threads, mapped to Agent component threads.
  chatThreads: defineTable({
    threadId: v.string(),
    companyId: v.optional(v.id("companies")),
    contactId: v.optional(v.id("contacts")),
    dealId: v.optional(v.id("deals")),
  })
    .index("by_company", ["companyId"])
    .index("by_contact", ["contactId"])
    .index("by_deal", ["dealId"])
    .index("by_threadId", ["threadId"]),

  // ---------------------------------------------------------------------
  // Paul Cushman's Climate Week NYC 2026 dataset. Everything below is a
  // verbatim port of paul-data/paul-large-datafiles/ — regenerated into
  // convex/paulData/ by scripts/build-paul-seed.mjs. Field names are the
  // source column names camelCased; no information is dropped.

  // Climate Week events: the 838-row official inventory merged with the
  // 230-row screened ecosystem list (153 official rows carry screening
  // annotations; 77 records are Luma-only). `lists` records every source
  // file the record appears in.
  paulEvents: defineTable({
    key: v.string(), // "off:<slug>" or "eco:<record_id>"
    slug: v.optional(v.string()),
    origin: v.string(),
    title: v.string(),
    // official838 columns
    weekTag: v.optional(v.string()),
    date: v.optional(v.string()),
    dateTime: v.optional(v.string()),
    dateTimeFull: v.optional(v.string()),
    format: v.optional(v.string()),
    type: v.optional(v.string()),
    host: v.optional(v.string()),
    location: v.optional(v.string()),
    address: v.optional(v.string()),
    themes: v.optional(v.string()),
    registrationUrl: v.optional(v.string()),
    url: v.optional(v.string()),
    duration: v.optional(v.string()),
    language: v.optional(v.string()),
    detailStatus: v.optional(v.string()),
    // screened-list columns
    recordId: v.optional(v.string()),
    dateLocal: v.optional(v.string()),
    timeLocal: v.optional(v.string()),
    timezone: v.optional(v.string()),
    venue: v.optional(v.string()),
    neighborhood: v.optional(v.string()),
    borough: v.optional(v.string()),
    officialUrl: v.optional(v.string()),
    sourceCalendars: v.optional(v.string()),
    netSignal: v.optional(v.string()),
    icpScore: v.optional(v.number()),
    icpFitRationale: v.optional(v.string()),
    confirmedPeopleOrgs: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    priceCurrency: v.optional(v.string()),
    accessRequirements: v.optional(v.string()),
    observedRegistrationStatus: v.optional(v.string()),
    observationTime: v.optional(v.string()),
    rankScore: v.optional(v.number()),
    rankTier: v.optional(v.string()),
    remainingUncertainty: v.optional(v.string()),
    officialDescSnippet: v.optional(v.string()),
    networkingEvidence: v.optional(v.string()),
    evidenceLevel: v.optional(v.string()),
    descHasCommercial: v.optional(v.string()),
    priorityRank: v.optional(v.number()),
    lists: v.array(v.string()),
    // Derived from rank_tier for indexed filtering: inventory rows were
    // never screened; the rest carry their screened bucket.
    screening: v.union(
      v.literal("inventory"),
      v.literal("qualified"),
      v.literal("pending"),
      v.literal("excluded"),
    ),
  })
    .index("by_key", ["key"])
    .index("by_slug", ["slug"])
    .index("by_origin", ["origin"])
    .index("by_screening", ["screening"])
    .index("by_screening_and_rank", ["screening", "rankScore"])
    .index("by_priorityRank", ["priorityRank"])
    .searchIndex("search_title", { searchField: "title" }),

  // Primary-source Luma verifications (32 pages re-checked by hand).
  paulVerifications: defineTable({
    recordId: v.string(),
    sourceUrl: v.optional(v.string()),
    observedAt: v.optional(v.string()),
    eventId: v.optional(v.string()),
    title: v.optional(v.string()),
    startAt: v.optional(v.string()),
    endAt: v.optional(v.string()),
    timezone: v.optional(v.string()),
    registrationAvailability: v.optional(v.string()),
    approvalRequired: v.optional(v.boolean()),
    description: v.optional(v.string()),
    sourceJsonSha256: v.optional(v.string()),
  }).index("by_recordId", ["recordId"]),

  // The 480-name candidate universe with status vs official hosts/profiles.
  paulCandidates: defineTable({
    name: v.string(),
    status: v.string(),
    officialHostEvents: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_name", ["name"]),

  // The 26 corrected scored identities (company-research.json merged with
  // prospect-ranking.csv and the prospects-only subset flag).
  paulProspects: defineTable({
    canonicalName: v.string(),
    legalName: v.optional(v.string()),
    entityType: v.optional(v.string()),
    category: v.optional(v.string()),
    website: v.optional(v.string()),
    hq: v.optional(v.string()),
    founded: v.optional(v.string()),
    stage: v.optional(v.string()),
    fundingSummary: v.optional(v.string()),
    headcount: v.optional(v.string()),
    headcountSource: v.optional(v.string()),
    headcountStatus: v.optional(v.string()),
    products: v.optional(v.string()),
    icpFit: v.optional(v.string()),
    icpNotes: v.optional(v.string()),
    climateRelevance: v.optional(v.number()),
    icpScore: v.optional(v.number()),
    engagement: v.optional(v.number()),
    access: v.optional(v.number()),
    unknowns: v.optional(v.string()),
    disposition: v.optional(v.string()),
    profileStatus: v.optional(v.string()),
    lane: v.optional(v.string()),
    nycPresence: v.optional(v.string()),
    scoreTotal: v.optional(v.number()),
    oldScore: v.optional(v.number()),
    scoreDelta: v.optional(v.number()),
    rank: v.optional(v.number()),
    warmPath: v.optional(v.string()),
    prospectOnly: v.optional(v.boolean()),
    // Link to the native companies row seeded for this prospect.
    companyId: v.optional(v.id("companies")),
  })
    .index("by_name", ["canonicalName"])
    .index("by_rank", ["rank"])
    .index("by_disposition", ["disposition"])
    .index("by_company", ["companyId"]),

  // The 24 recovered lane A/B/C research profiles (pre-correction, kept for
  // provenance alongside the corrected scored identities).
  paulLaneProfiles: defineTable({
    lane: v.string(),
    name: v.string(),
    category: v.optional(v.string()),
    website: v.optional(v.string()),
    hq: v.optional(v.string()),
    founded: v.optional(v.string()),
    stage: v.optional(v.string()),
    fundingSummary: v.optional(v.string()),
    headcount: v.optional(v.string()),
    headcountSource: v.optional(v.string()),
    products: v.optional(v.string()),
    icpFit: v.optional(v.string()),
    icpNotes: v.optional(v.string()),
    climateWeekInvolvement: v.optional(v.string()),
    climateWeekRole: v.optional(v.string()),
    sources: v.optional(
      v.array(
        v.object({ title: v.optional(v.string()), url: v.string() }),
      ),
    ),
  })
    .index("by_lane", ["lane"])
    .index("by_name", ["name"]),

  // Entity <-> event evidence (host/sponsor/speaker claims with confidence).
  paulRelationships: defineTable({
    entity: v.optional(v.string()),
    relationType: v.optional(v.string()),
    confidence: v.optional(v.string()),
    eventTitle: v.optional(v.string()),
    eventDate: v.optional(v.string()),
    eventType: v.optional(v.string()),
    eventFormat: v.optional(v.string()),
    matchedHostFragment: v.optional(v.string()),
    hostField: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    evidence: v.optional(v.string()),
  })
    .index("by_entity", ["entity"])
    .index("by_eventTitle", ["eventTitle"]),

  // The 12 entity-resolution corrections (Crux merge, Scale AI, etc.).
  paulAuditFindings: defineTable({
    issueId: v.optional(v.string()),
    severity: v.optional(v.string()),
    subject: v.optional(v.string()),
    confusedWith: v.optional(v.string()),
    finding: v.optional(v.string()),
    evidence: v.optional(v.string()),
    correction: v.optional(v.string()),
    scoreImpact: v.optional(v.string()),
  }),

  // Artifact-by-artifact intent mapping (keep/reshape/drop vs the two jobs).
  paulIntentMappings: defineTable({
    artifactCategory: v.optional(v.string()),
    artifactPath: v.optional(v.string()),
    rowClassOrScope: v.optional(v.string()),
    count: v.optional(v.string()),
    disposition: v.optional(v.string()),
    targetUseCase: v.optional(v.string()),
    rationale: v.optional(v.string()),
    astraAction: v.optional(v.string()),
  }).index("by_disposition", ["disposition"]),

  // Every context/companion document verbatim (README, context, briefs,
  // receipts, manifest, the retired historical ranking).
  paulDocuments: defineTable({
    path: v.string(),
    title: v.string(),
    kind: v.union(
      v.literal("markdown"),
      v.literal("json"),
      v.literal("text"),
    ),
    retired: v.boolean(),
    bytes: v.number(),
    sha256: v.string(),
    content: v.string(),
  }).index("by_path", ["path"]),
});
