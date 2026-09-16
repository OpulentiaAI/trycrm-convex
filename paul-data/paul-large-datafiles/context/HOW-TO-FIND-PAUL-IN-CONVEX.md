# How to find Paul Cushman’s account in Convex

**Deployment:** `prod:confident-sheep-333`  
**Working directory for CLI:** `frontend/` with `--env-file .env.deploy`  
**Do not print `.env.deploy` or credential-bearing config.**

## Identity (production)

| Field | Value |
|---|---|
| Email | `paul@opulent.ai` |
| Canonical / legacy user id | `k578jdb7rf0jwqngs07eyhshf18e5ctk` |
| Workspace | `ws_1670f24ed67e4871be643bf4f6` |
| Issuer | `https://opulent.ai` |
| tokenIdentifier | `https://opulent.ai\|k578jdb7rf0jwqngs07eyhshf18e5ctk` |

Authenticated Convex CLI calls that must run *as Paul* pass:

```json
{"subject":"k578jdb7rf0jwqngs07eyhshf18e5ctk","email":"paul@opulent.ai","issuer":"https://opulent.ai","tokenIdentifier":"https://opulent.ai|k578jdb7rf0jwqngs07eyhshf18e5ctk"}
```

via `convex run … --identity '<json>'`.

If you only have the email, resolve the legacy id first:

```text
userIdentityLinks:getLegacyLinkByEmailInternal  { email: "paul@opulent.ai" }
```

Do not use Jeremy’s identity (`jeremyalstoncapital@gmail.com`) for Paul’s threads.

## Indexes that actually work

| Table | Index | Lookup |
|---|---|---|
| `threads` | `by_user` | `eq("userId", "k578jdb7rf0jwqngs07eyhshf18e5ctk")` |
| `agentRuns` | `by_thread` | `eq("threadId", thread.threadId)` |
| `agentRuns` | `by_runId` | `eq("runId", rid)` |
| `toolExecutions` | `by_run_tool` | `eq("runId", rid)` |
| `driveFiles` | `by_sourceRun` | `eq("sourceRunId", rid)` |
| `driveFiles` | `by_fileId` | `eq("fileId", fileId)` |
| `queuedChatMessages` | `by_user_thread_createdAt` | `eq("userId", u).eq("threadId", t)` |
| `creditBalanceSnapshots` | `by_user` | `eq("userId", u)` |

File bytes: `ctx.storage.getUrl(storageId)`.

## Example: list Paul’s threads and any live runs

```bash
cd frontend
convex run --env-file .env.deploy --inline-query '
const u="k578jdb7rf0jwqngs07eyhshf18e5ctk";
const ts=await ctx.db.query("threads").withIndex("by_user",q=>q.eq("userId",u)).take(150);
const all=await Promise.all(ts.map(async t=>{
  const rs=await ctx.db.query("agentRuns").withIndex("by_thread",q=>q.eq("threadId",t.threadId)).order("desc").take(8);
  return {threadId:t.threadId,title:t.title,runs:rs.map(r=>({id:r.runId,status:r.status,model:r.modelName,startedAt:r.startedAt}))};
}));
return all;
'
```

Canonical mutations used to launch work *as Paul*:

- `threads:create` — `{ workspaceId, title, executionEnvironment: "vm" }`
- `chatDb:sendMessage` — `{ threadId, prompt, model, coordinatorModel, workerModel, reasoningEffort, executionEnvironment, deliveryMode: "auto", clientMessageId, images? }`
- `chatDb:generateUploadUrl` / `chatDb:completeUpload` — attach files to a thread

## Threads created for this work (Paul-owned)

| Job | Thread | First run | Model |
|---|---|---|---|
| Gemini 3.8 intent vs outputs | `m57085jk44c6qh99mn40ejk4998e63ea` | `ks73xrb4dmxgs5ddk6mfa09b5h8e69jz` (Gmail skip successor `ks71gmcb5n1786w5nst47t30298e6n9a`) | `ai-gateway/google/gemini-3.8-flash` |
| GPT-6 Astra medium presentation | `m578eaqsq8jrernqb188bmdwcs8e6tra` | `ks73ky3khq2zn9md925gmxgtd98e6680` | `ai-gateway/openai/gpt-6-astra` (reasoning medium) |
| Fable 5.1 medium revision | `m57es3xrcxmpah3x81fhj4z93h8e66t5` | `ks7aqdb4p0t1mv0k3mxjzb6y0n8e6xkk` | `ai-gateway/anthropic/claude-fable-5.1` (reasoning medium) |

Older pipeline (stopped / not the current presentation): parent `ks77v6m0ddhsyget8k3mky6xhx8e5xfy`; company lanes A `ks717f85qqs46vmtj1qpb1r3bx8e4emg`, B `ks76j45p030e87t5f6reyvqawh8e5aav`, C `ks73r8hgd5g1f5jkzbcv58t0as8e4cyz`; networking `ks7b6pvy5e81vjebrfhjgwhhm58e4a3y` in `m575pwpyg44vmgqa9pvh5mdde18e4g1q`.

UI path: dashboard thread `/dashboard/projects/default/thread/<threadId>` under Paul’s login, not Jeremy’s.
