# Task 3 - Entity Resolution & Prospect Strength Reduce

**Input:** 480 candidate entities + 24 researched climate SaaS/data/AI profiles.
**Output:** 490 resolved, scored entities.


## Scoring rubric (0-100)

| Component | Max | Notes |
|---|---|---|
| Climate SaaS/data/AI relevance | 30 | researched category > name keywords > hosting activity |
| ICP fit (buyer/partner/competitor) | 25 | from research lanes; unknown when no resolved profile |
| Climate Week engagement | 25 | sponsor tier + events hosted + text mentions + speaker |
| Accessibility / NYC presence | 20 | HQ location + public hosting |


Entity type distribution: company-other: 200, nonprofit: 103, individual: 47, government: 24, company-climate-software: 22, community: 21, university: 19, utility-energy: 12, company-tech: 8, finance: 7, consulting: 6, company-industrial: 6, library: 5, media: 5, legal: 3, nonprofit-data: 2


## Top 30 prospects

| # | Entity | Type | Score | ICP | Stage | hc | Warm paths |
|---|---|---|---|---|---|---|---|
| 1 | Voltera | company-climate-software | 82 | buyer | Private — PE-backed by EQT Infrastr... | 44 | sponsor tier: Thematic Session Partner; has Climate Week main-program speaker |
| 2 | UL Solutions | company-climate-software | 78 | partner | Public - NYSE: ULS (IPO April 2024)... | 14,635 (AltIndex via LinkedIn, Aug 2026, +2.8% QoQ); ~8,400 core on LinkedIn page | sponsor tier: Silver Partner; has Climate Week main-program speaker |
| 3 | Crux Climate | company-climate-software | 77 | partner | Private, VC-backed — Series B (Apri... | 91 | hosts 7 official Climate Week event(s) |
| 4 | Apolitical | company-climate-software | 76 | partner | Private - grant/VC (~$13.78M total ... | 95 (LinkedIn, 2026); revenue ~$4.1M | sponsor tier: Thematic Session Partner |
| 5 | Salesforce | company-climate-software | 69 | competitor | Public - NYSE: CRM | ~83,823 (FY2026 headcount tracker; Salesforce official FY25 metrics schedules) | sponsor tier: Silver Partner; has Climate Week main-program speaker |
| 6 | Polecat | company-climate-software | 68 | partner | Private - Series A (~$4.1-5.3M tota... | 24 (LinkedIn 2026, +7.5% YoY); 30 (Latka 2024) | sponsor tier: Impact Partner |
| 7 | Carbon Mapper | nonprofit-data | 68 | partner | Nonprofit 501(c)(3) — philanthropic... | 43 (LinkedIn company page, +36.1% YoY); LeadIQ lists 11-50 | hosts 1 official Climate Week event(s); mentioned in 1 official event text(s) |
| 8 | STX Group | company-climate-software | 67 | buyer | Private — privately held, no listed... | 407 (LinkedIn company page, -1.1% YoY) | hosts 2 official Climate Week event(s) |
| 9 | BloombergNEF | company-climate-software | 65 | partner | Private — wholly owned research div... | ? | mentioned in 1 official event text(s) |
| 10 | Morningstar Sustainalytics | company-climate-software | 64 | partner | Private subsidiary of Morningstar, ... | 701 (LinkedIn, -15.4% YoY, Jun 2026); revenue ~EUR 25.9M | hosts 1 official Climate Week event(s) |
| 11 | S&P Global Sustainable1 | company-climate-software | 64 | partner | Public parent - NYSE: SPGI (>5,000 ... | 45,691 LinkedIn followers on Sustainable1 showcase; S&P Global >40,000 total employees | mentioned in 0 official event text(s) |
| 12 | Wood Mackenzie | company-climate-software | 63 | partner | Private — PE-owned; acquired by Ver... | ~2,924 (Revelio Labs, Mar 2026) / 1,974 (LinkedIn company page) | has Climate Week main-program speaker |
| 13 | Sunrun Inc. | company-climate-software | 63 | buyer | Public — Nasdaq: RUN | 9059 | mentioned in 8 official event text(s) |
| 14 | Ember | nonprofit-data | 62 | partner | Nonprofit — not-for-profit think ta... | 75 (LinkedIn company page, +23.2% YoY); an Aug 2025 job ad references an ~80-person team across 19 countries | has Climate Week main-program speaker |
| 15 | Climate Group | community | 60 | ? | ? | ? | hosts 33 official Climate Week event(s); sponsor tier: Event Host; has Climate W |
| 16 | Jupiter Intelligence | company-climate-software | 60 | competitor | Private — Series C (last round: $54... | ~53 (LinkedIn company page); LeadIQ lists 51-200 |  |
| 17 | Ambrook | company-climate-software | 58 | partner (weak buyer fit) | Private, VC-backed — Series B (Aug ... | 53 | hosts 2 official Climate Week event(s) |
| 18 | Datamaran | company-climate-software | 58 | competitor | Private - Series C ($32.6M growth f... | 107 (LinkedIn, -17.2% YoY, Jun 2026); 124 (PitchBook); 133 (Latka 2024) | hosts 1 official Climate Week event(s) |
| 19 | Clean Air Fund | company-other | 58 | ? | ? | ? | sponsor tier: Thematic Session Partner; has Climate Week main-program speaker |
| 20 | Google | company-climate-software | 58 | competitor (secondary channel-partner opportunity) | Public — Google/Alphabet: Nasdaq: G... | 190820 | mentioned in 5 official event text(s) |
| 21 | Watershed | company-climate-software | 55 | competitor | Private - Series C ($100M, Feb 2024... | 370 (LinkedIn, +13.2% YoY, Jun 2026); 400 (PitchBook); 550+ (company-affiliated profile) | mentioned in 4 official event text(s) |
| 22 | Scale AI | company-climate-software | 55 | weak-fit | Private, late-stage; Meta made a $1... | 1200 | mentioned in 2 official event text(s) |
| 23 | Daikin | company-other | 53 | ? | ? | ? | sponsor tier: Gold Partner |
| 24 | Siemens | company-other | 52 | ? | ? | ? | sponsor tier: Opening Ceremony Partner; has Climate Week main-program speaker |
| 25 | Trane Technologies | company-tech | 52 | ? | ? | ? | sponsor tier: Headline Partner; has Climate Week main-program speaker |
| 26 | Octopus Energy Group / Kraken Technologies | company-climate-software | 50 | partner (with competitor overlap) | Private. Octopus Energy Group is a ... | 5491 | mentioned in 0 official event text(s) |
| 27 | Takeda | company-other | 49 | ? | ? | ? | sponsor tier: The Hub Live Partner; has Climate Week main-program speaker |
| 28 | Climate X | company-climate-software | 49 | competitor | Private — Series A (last round: $18... | 89 (LinkedIn company page, +12.4% YoY) | mentioned in 1 official event text(s) |
| 29 | Kayrros | company-climate-software | 48 | competitor | Acquired — Energy Aspects agreed to... | 95 (LinkedIn company page) | mentioned in 0 official event text(s) |
| 30 | Fortescue | company-other | 47 | ? | ? | ? | sponsor tier: Platinum Partner |

## Notes, unknowns, disqualifiers

- Entities without a researched profile carry explicit score_unknowns; nothing is invented.
- 480 candidates != 480 prospects: typed roles, disqualifiers, and unknowns preserved per recovery guidance.
- Competitors are kept visible (scored for partnership, not selling).