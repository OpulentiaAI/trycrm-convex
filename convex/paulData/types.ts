// Row types for the generated seed data. These mirror the paul* validators in
// convex/schema.ts — keep them in sync when the schema changes. The generated
// modules declare arrays of these types so inserts typecheck.

export type PaulEventScreening =
  | "inventory"
  | "qualified"
  | "pending"
  | "excluded";

export interface PaulEventRow {
  key: string;
  slug?: string;
  origin: string;
  title: string;
  weekTag?: string;
  date?: string;
  dateTime?: string;
  dateTimeFull?: string;
  format?: string;
  type?: string;
  host?: string;
  location?: string;
  address?: string;
  themes?: string;
  registrationUrl?: string;
  url?: string;
  duration?: string;
  language?: string;
  detailStatus?: string;
  recordId?: string;
  dateLocal?: string;
  timeLocal?: string;
  timezone?: string;
  venue?: string;
  neighborhood?: string;
  borough?: string;
  officialUrl?: string;
  sourceCalendars?: string;
  netSignal?: string;
  icpScore?: number;
  icpFitRationale?: string;
  confirmedPeopleOrgs?: string;
  targetAudience?: string;
  priceCurrency?: string;
  accessRequirements?: string;
  observedRegistrationStatus?: string;
  observationTime?: string;
  rankScore?: number;
  rankTier?: string;
  remainingUncertainty?: string;
  officialDescSnippet?: string;
  networkingEvidence?: string;
  evidenceLevel?: string;
  descHasCommercial?: string;
  priorityRank?: number;
  lists: string[];
  screening: PaulEventScreening;
}

export interface PaulVerificationRow {
  recordId: string;
  sourceUrl?: string;
  observedAt?: string;
  eventId?: string;
  title?: string;
  startAt?: string;
  endAt?: string;
  timezone?: string;
  registrationAvailability?: string;
  approvalRequired?: boolean;
  description?: string;
  sourceJsonSha256?: string;
}

export interface PaulCandidateRow {
  name: string;
  status: string;
  officialHostEvents?: number;
  notes?: string;
}

export interface PaulProspectRow {
  canonicalName: string;
  legalName?: string;
  entityType?: string;
  category?: string;
  website?: string;
  hq?: string;
  founded?: string;
  stage?: string;
  fundingSummary?: string;
  headcount?: string;
  headcountSource?: string;
  headcountStatus?: string;
  products?: string;
  icpFit?: string;
  icpNotes?: string;
  climateRelevance?: number;
  icpScore?: number;
  engagement?: number;
  access?: number;
  unknowns?: string;
  disposition?: string;
  profileStatus?: string;
  lane?: string;
  nycPresence?: string;
  scoreTotal?: number;
  oldScore?: number;
  scoreDelta?: number;
  rank?: number;
  warmPath?: string;
  prospectOnly?: boolean;
}

export interface PaulLaneProfileRow {
  lane: string;
  name: string;
  category?: string;
  website?: string;
  hq?: string;
  founded?: string;
  stage?: string;
  fundingSummary?: string;
  headcount?: string;
  headcountSource?: string;
  products?: string;
  icpFit?: string;
  icpNotes?: string;
  climateWeekInvolvement?: string;
  climateWeekRole?: string;
  sources?: { title?: string; url: string }[];
}

export interface PaulRelationshipRow {
  entity?: string;
  relationType?: string;
  confidence?: string;
  eventTitle?: string;
  eventDate?: string;
  eventType?: string;
  eventFormat?: string;
  matchedHostFragment?: string;
  hostField?: string;
  sourceUrl?: string;
  evidence?: string;
}

export interface PaulAuditRow {
  issueId?: string;
  severity?: string;
  subject?: string;
  confusedWith?: string;
  finding?: string;
  evidence?: string;
  correction?: string;
  scoreImpact?: string;
}

export interface PaulIntentRow {
  artifactCategory?: string;
  artifactPath?: string;
  rowClassOrScope?: string;
  count?: string;
  disposition?: string;
  targetUseCase?: string;
  rationale?: string;
  astraAction?: string;
}

export interface PaulDocumentRow {
  path: string;
  title: string;
  kind: "markdown" | "json" | "text";
  retired: boolean;
  bytes: number;
  sha256: string;
  content: string;
}
