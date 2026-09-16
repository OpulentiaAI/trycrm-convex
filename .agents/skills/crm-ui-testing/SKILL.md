---
name: crm-ui-testing
description: Run the CRM frontend against an isolated local Convex deployment for real-data UI testing without touching an unrelated provisioned backend.
---

# CRM UI testing

Read `AGENTS.md`, the README setup/demo sections, `convex/convex.config.ts`,
and the deployment-guard skill before setup. This is real browser testing;
the generated `convex-test` skill covers a separate in-memory unit workflow.

## Devin Secrets Needed

None for the keyless local demo. Do not reuse a provisioned
`CONVEX_DEPLOY_KEY` or `CONVEX_URL` unless its target is explicitly authorized.
Real enrichment, email, and AI capabilities require their own vendor keys and
are outside keyless demo coverage.

## Safe local setup

1. Inspect environment variable names/targets, `.env*` deployment settings,
   and whether `~/.convex` credentials exist. Never print secret values.
   Do not overwrite an existing configured deployment without permission.
2. Install with `npm install --legacy-peer-deps`; plain install can encounter
   a zod peer conflict. Use the provisioned Node toolchain.
3. For an unconfigured checkout, create a fresh anonymous local backend:

   ```sh
   env -u CONVEX_DEPLOY_KEY -u CONVEX_URL -u CONVEX_DEPLOYMENT \
     CONVEX_AGENT_MODE=anonymous npm run dev
   ```

   Verify output and generated `.env.local` point to loopback, not a cloud
   deployment. Typical ports are frontend 5173 and backend 3210; trust output.
   Keep the process running. The CLI may download the backend/dashboard and
   generate guidelines or skills; report those working-tree side effects.
4. If component validation reports missing `CONTEXT_DEV_API_KEY`,
   `EXA_API_KEY`, or `FIRECRAWL_API_KEY`, set each to literal `unset` on this
   verified local deployment only:

   ```sh
   env -u CONVEX_DEPLOY_KEY -u CONVEX_URL -u CONVEX_DEPLOYMENT \
     CONVEX_AGENT_MODE=anonymous npx convex env set CONTEXT_DEV_API_KEY unset
   ```

   Repeat for the other missing names. The watcher should retry deployment;
   wait for `Convex functions ready` before claiming startup readiness.
5. Open `/app` to trigger the real demo seed. Seeding is scheduled/chunked;
   wait for actual rows, not hard-coded page descriptions. Throughput warnings
   may occur: report them and confirm final data counts rather than assuming
   the scheduled chain completed.

## Browser assertions and evidence

- Maximize the browser, record UI flows, and annotate grouped outcomes.
- Verify new navigation, filters, pagination, details, and at least one old CRM
  page. Count real rendered rows, not just title totals. Exercise empty states.
- Use computed styles, `document.fonts`, and resource timing to substantiate
  typography/theme claims in addition to screenshots.
- If a route goes blank, check browser DevTools and Convex logs for the exact
  query failure. A full navigation to another route can recover the UI; do not
  count the failed route as covered merely because its source looks correct.
- Demo mode is unauthenticated and resets data every ten minutes. Avoid
  retaining record URLs or assuming mutations survive a reset.
- Supplement hidden table counts with read-only local CLI inspection, e.g.
  `npx convex data TABLE --limit 2000 --format json`, using the same sanitized
  environment and verified local target. Do not treat database reads as proof
  that the corresponding UI rendered.
- Leave product fixes to the implementation agent. Report blocked document,
  auth, external-service, or other flows explicitly.
