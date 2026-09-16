import type { MutationCtx } from "../_generated/server";
import { prospects } from "../paulData/prospects";
import type { PaulProspectRow } from "../paulData/types";

const DAY = 24 * 60 * 60 * 1000;

// Paul Cushman's workspace: the 26 resolved Climate Week entities become
// companies with their research carried in custom fields and the evidence
// ledger. No deals — the research explicitly says these lists are source
// data, not a CRO pipeline (see prds/paul-data-port.md).
export async function seedPaulWorkspace(
  ctx: MutationCtx,
  now: number,
): Promise<void> {
  await ctx.db.insert("workspace", {
    name: "Paul Cushman — Climate Week NYC 2026",
    demoMode: true,
    allowedSignIn: [],
    reportingCurrency: "USD",
    agentModel: "gpt-5-mini",
    lastResetAt: now,
  });

  const paul = await ctx.db.insert("users", {
    name: "Paul Cushman",
    email: "paul@opulent.ai",
    role: "owner",
  });
  const jeremy = await ctx.db.insert("users", {
    name: "Jeremy Alston",
    email: "jeremyalstoncapital@gmail.com",
    role: "member",
  });

  const score = await ctx.db.insert("fieldDefinitions", {
    entity: "company",
    key: "prospect_score",
    label: "Prospect score",
    type: "number",
    order: 1,
    archived: false,
    agentFilled: true,
    agentBrief:
      "Climate relevance (30) + ICP fit (25) + Climate Week engagement (25) + accessibility (20), out of 100.",
  });
  const disposition = await ctx.db.insert("fieldDefinitions", {
    entity: "company",
    key: "disposition",
    label: "Disposition",
    type: "select",
    options: [
      "buyer_prospect",
      "partner_prospect",
      "adjacent_partner",
      "competitor_watch",
      "not_a_prospect",
    ],
    order: 2,
    archived: false,
    agentFilled: true,
  });
  const icpFit = await ctx.db.insert("fieldDefinitions", {
    entity: "company",
    key: "icp_fit",
    label: "ICP fit",
    type: "select",
    options: ["buyer", "partner", "competitor", "weak-fit", "other"],
    order: 3,
    archived: false,
    agentFilled: true,
  });
  const warmPath = await ctx.db.insert("fieldDefinitions", {
    entity: "company",
    key: "warm_path",
    label: "Warm path",
    type: "text",
    order: 4,
    archived: false,
    agentFilled: true,
    agentBrief:
      "Warm-intro route to a real prospect — Chicago Ventures, GTM Ventures, GTM Fund, or a shared event host.",
  });

  for (const p of prospects) {
    const companyId = await ctx.db.insert("companies", {
      name: p.canonicalName,
      domain: domainOf(p),
      industry: p.category,
      description: p.icpNotes,
      ownerId: paul,
      enrichmentStatus: "ENRICHED",
      lastActivityAt: now,
    });
    const value = async (
      fieldId: typeof score,
      v: string | number | undefined,
    ) => {
      if (v === undefined || v === "") return;
      await ctx.db.insert("fieldValues", {
        fieldId,
        entityId: companyId,
        value: String(v),
      });
    };
    await value(score, p.scoreTotal);
    await value(disposition, p.disposition);
    await value(icpFit, p.icpFit);
    await value(warmPath, p.warmPath);

    // The research dossier wrote these numbers; the ledger records that as
    // accepted evidence, not an agent observation.
    if (p.scoreTotal !== undefined) {
      await ctx.db.insert("facts", {
        entityType: "company",
        entityId: companyId,
        field: "prospect_score",
        value: String(p.scoreTotal),
        evidenceKind: "paul.company-research",
        band: "CONFIRMED",
        settled: "accepted",
      });
    }
    await ctx.db.insert("activities", {
      type: "NOTE",
      body: [
        `Climate Week research profile — score ${p.scoreTotal ?? "?"}${p.oldScore !== undefined && p.oldScore !== p.scoreTotal ? ` (was ${p.oldScore})` : ""}.`,
        p.disposition && `Disposition: ${p.disposition}.`,
        p.unknowns && `Open questions: ${p.unknowns}`,
      ]
        .filter(Boolean)
        .join(" "),
      companyId,
      authorId: jeremy,
    });
  }

  await ctx.db.insert("agentTasks", {
    kind: "CUSTOM",
    state: "open",
    reason:
      "Climate Week NYC 2026 starts Sep 20. Draft outreach briefs for the top-10 ranked prospects so Paul walks in with talking points.",
    priority: 1,
    dueAt: now + 2 * DAY,
    attempts: 0,
  });
  await ctx.db.insert("agentTasks", {
    kind: "CUSTOM",
    state: "open",
    reason:
      "116 of 480 candidate names are still unresolved_name. Re-check them against official event hosts and Luma attendee lists to promote real entities.",
    priority: 2,
    dueAt: now + 5 * DAY,
    attempts: 0,
  });
}

function domainOf(p: PaulProspectRow): string | undefined {
  if (!p.website) return undefined;
  try {
    return new URL(p.website).hostname.replace(/^www\./, "");
  } catch {
    return p.website;
  }
}
